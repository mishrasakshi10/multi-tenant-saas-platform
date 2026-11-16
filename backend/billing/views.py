
import logging
from datetime import datetime, timezone as datetime_timezone

import stripe

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceOwner, IsWorkspaceMember

from .models import Subscription, StripeWebhookEvent
from .serializers import SubscriptionSerializer
from .stripe_service import get_stripe_client


logger = logging.getLogger(__name__)


def get_stripe_object_id(value):
    if isinstance(value, str):
        return value

    if isinstance(value, dict):
        return value.get("id")

    return getattr(value, "id", None)


def update_subscription_from_stripe(
    subscription,
    stripe_subscription,
    deleted=False
):
    stripe_status = stripe_subscription.get("status")

    if deleted:
        subscription.status = Subscription.Status.CANCELED
    elif stripe_status in Subscription.Status.values:
        subscription.status = stripe_status
    else:
        logger.warning(
            "Unknown Stripe subscription status: %s",
            stripe_status
        )

    period_end = stripe_subscription.get("current_period_end")

    if period_end:
        subscription.current_period_end = datetime.fromtimestamp(
            period_end,
            tz=datetime_timezone.utc
        )

    subscription.cancel_at_period_end = (
        False if deleted
        else stripe_subscription.get("cancel_at_period_end", False)
    )

    customer_id = get_stripe_object_id(
        stripe_subscription.get("customer")
    )

    if customer_id:
        subscription.stripe_customer_id = customer_id

    items = stripe_subscription.get("items", {}).get("data", [])

    if items:
        price_id = get_stripe_object_id(items[0].get("price"))

        if price_id:
            subscription.stripe_price_id = price_id

    subscription.save()


class CreateCheckoutSessionAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, workspace_id):

        workspace = get_object_or_404(
            Workspace.objects.filter(
                memberships__user=request.user
            ).distinct(),
            pk=workspace_id
        )

        owner_permission = IsWorkspaceOwner()

        if not owner_permission.has_object_permission(
            request, self, workspace
        ):
            return Response(
                {"detail": "Only the workspace Owner can manage billing."},
                status=status.HTTP_403_FORBIDDEN
            )

        if not settings.STRIPE_PRICE_ID:
            return Response(
                {"detail": "Stripe Price ID is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {"detail": "Stripe is not configured yet."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            client = get_stripe_client()

            subscription, _ = Subscription.objects.get_or_create(
                workspace=workspace
            )

            if subscription.status == Subscription.Status.ACTIVE:
                return Response(
                    {
                        "detail": (
                            "This workspace already has an active subscription."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not subscription.stripe_customer_id:

                customer = client.v1.customers.create({
                    "name": workspace.name,
                    "metadata": {
                        "workspace_id": str(workspace.id)
                    }
                })

                subscription.stripe_customer_id = customer.id
                subscription.save(
                    update_fields=["stripe_customer_id", "updated_at"]
                )

            checkout_session = client.v1.checkout.sessions.create({

                "mode": "subscription",

                "customer": subscription.stripe_customer_id,

                "line_items": [
                    {
                        "price": settings.STRIPE_PRICE_ID,
                        "quantity": 1
                    }
                ],

                "success_url": (
                    settings.STRIPE_SUCCESS_URL
                    + "?session_id={CHECKOUT_SESSION_ID}"
                ),

                "cancel_url": settings.STRIPE_CANCEL_URL,

                "metadata": {
                    "workspace_id": str(workspace.id)
                },

                "subscription_data": {
                    "metadata": {
                        "workspace_id": str(workspace.id)
                    }
                }
            })

            subscription.stripe_price_id = settings.STRIPE_PRICE_ID
            subscription.save(
                update_fields=["stripe_price_id", "updated_at"]
            )

            return Response({
                "checkout_url": checkout_session.url
            })

        except stripe.StripeError:
            logger.exception("Stripe checkout creation failed.")

            return Response(
                {"detail": "Unable to create Stripe checkout session."},
                status=status.HTTP_502_BAD_GATEWAY
            )


class WorkspaceSubscriptionAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, workspace_id):

        workspace = get_object_or_404(
            Workspace.objects.filter(
                memberships__user=request.user
            ).distinct(),
            pk=workspace_id
        )

        permission = IsWorkspaceMember()

        if not permission.has_object_permission(
            request, self, workspace
        ):
            return Response(
                {"detail": "You are not a workspace member."},
                status=status.HTTP_403_FORBIDDEN
            )

        subscription = get_object_or_404(
            Subscription,
            workspace=workspace
        )

        serializer = SubscriptionSerializer(subscription)

        return Response(serializer.data)


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookAPIView(APIView):

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):

        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        if not webhook_secret:
            return Response(
                {"detail": "Stripe webhook is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        payload = request.body
        signature = request.META.get("HTTP_STRIPE_SIGNATURE")

        if not signature:
            return Response(
                {"detail": "Missing Stripe signature."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            event = stripe.Webhook.construct_event(
                payload,
                signature,
                webhook_secret
            )

        except (ValueError, stripe.SignatureVerificationError):
            return Response(
                {"detail": "Invalid webhook payload or signature."},
                status=status.HTTP_400_BAD_REQUEST
            )

        event_id = event.get("id")
        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})

        if not event_id or not event_type:
            return Response(
                {"detail": "Invalid Stripe event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():

                _, created = StripeWebhookEvent.objects.get_or_create(
                    event_id=event_id,
                    defaults={"event_type": event_type}
                )

                if not created:
                    return Response({"received": True})

                if event_type == "checkout.session.completed":

                    workspace_id = event_data.get(
                        "metadata", {}
                    ).get("workspace_id")

                    stripe_subscription_id = get_stripe_object_id(
                        event_data.get("subscription")
                    )

                    if workspace_id and stripe_subscription_id:

                        subscription = (
                            Subscription.objects.select_for_update()
                            .filter(workspace_id=workspace_id)
                            .first()
                        )

                        if subscription:

                            client = get_stripe_client()

                            stripe_subscription = (
                                client.v1.subscriptions.retrieve(
                                    stripe_subscription_id
                                )
                            )

                            subscription.stripe_subscription_id = (
                                stripe_subscription_id
                            )

                            update_subscription_from_stripe(
                                subscription,
                                stripe_subscription
                            )

                elif event_type in (
                    "customer.subscription.created",
                    "customer.subscription.updated",
                    "customer.subscription.deleted"
                ):

                    stripe_subscription_id = event_data.get("id")

                    workspace_id = event_data.get(
                        "metadata", {}
                    ).get("workspace_id")

                    subscription = None

                    if workspace_id:
                        subscription = (
                            Subscription.objects.select_for_update()
                            .filter(workspace_id=workspace_id)
                            .first()
                        )

                    if not subscription and stripe_subscription_id:
                        subscription = (
                            Subscription.objects.select_for_update()
                            .filter(
                                stripe_subscription_id=stripe_subscription_id
                            )
                            .first()
                        )

                    if subscription:

                        subscription.stripe_subscription_id = (
                            stripe_subscription_id
                        )

                        update_subscription_from_stripe(
                            subscription,
                            event_data,
                            deleted=(
                                event_type
                                == "customer.subscription.deleted"
                            )
                        )

            return Response({"received": True})

        except stripe.StripeError:
            logger.exception("Stripe webhook processing failed.")

            return Response(
                {"detail": "Stripe webhook processing failed."},
                status=status.HTTP_502_BAD_GATEWAY
            )

        except Exception:
            logger.exception("Unexpected Stripe webhook error.")

            return Response(
                {"detail": "Webhook processing failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

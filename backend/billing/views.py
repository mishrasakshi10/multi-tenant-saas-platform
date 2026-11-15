
import logging

import stripe

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceOwner, IsWorkspaceMember

from .models import Subscription
from .serializers import SubscriptionSerializer
from .stripe_service import get_stripe_client


logger = logging.getLogger(__name__)


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

            subscription, created = Subscription.objects.get_or_create(
                workspace=workspace
            )

            if subscription.status == Subscription.Status.ACTIVE:
                return Response(
                    {"detail": "This workspace already has an active subscription."},
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

        event_type = event["type"]
        event_data = event["data"]["object"]

        if event_type == "checkout.session.completed":

            workspace_id = event_data.get("metadata", {}).get(
                "workspace_id"
            )

            if workspace_id:
                Subscription.objects.filter(
                    workspace_id=workspace_id
                ).update(
                    stripe_subscription_id=event_data.get("subscription"),
                    status=Subscription.Status.INCOMPLETE
                )

        elif event_type in [
            "customer.subscription.updated",
            "customer.subscription.deleted"
        ]:

            workspace_id = event_data.get("metadata", {}).get(
                "workspace_id"
            )

            if workspace_id:

                subscription = Subscription.objects.filter(
                    workspace_id=workspace_id
                ).first()

                if subscription:

                    subscription.status = event_data.get(
                        "status",
                        Subscription.Status.CANCELED
                    )

                    subscription.cancel_at_period_end = event_data.get(
                        "cancel_at_period_end",
                        False
                    )

                    subscription.save(
                        update_fields=[
                            "status",
                            "cancel_at_period_end",
                            "updated_at"
                        ]
                    )

        return Response({"received": True})

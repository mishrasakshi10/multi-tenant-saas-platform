
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from rest_framework.test import APIClient

from workspaces.models import Workspace, Membership
from billing.models import Subscription, StripeWebhookEvent


User = get_user_model()


class BillingAPITests(TestCase):

    def setUp(self):

        self.client = APIClient()

        self.owner = User.objects.create_user(
            username="billingowner",
            email="owner@example.com",
            password="TestPassword123!"
        )

        self.member = User.objects.create_user(
            username="billingmember",
            email="member@example.com",
            password="TestPassword123!"
        )

        self.workspace = Workspace.objects.create(
            name="Billing Test Workspace",
            slug="billing-test-workspace",
            created_by=self.owner
        )

        Membership.objects.create(
            workspace=self.workspace,
            user=self.owner,
            role=Membership.Role.OWNER
        )

        Membership.objects.create(
            workspace=self.workspace,
            user=self.member,
            role=Membership.Role.MEMBER
        )

        self.checkout_url = reverse(
            "create-checkout-session",
            kwargs={"workspace_id": self.workspace.id}
        )

        self.subscription_url = reverse(
            "workspace-subscription",
            kwargs={"workspace_id": self.workspace.id}
        )

        self.webhook_url = reverse("stripe-webhook")

    # -----------------------------------------
    # CHECKOUT TESTS
    # -----------------------------------------

    def test_unauthenticated_user_cannot_create_checkout(self):

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, 401)

    def test_workspace_member_cannot_create_checkout(self):

        self.client.force_authenticate(user=self.member)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, 403)

    @override_settings(
        STRIPE_SECRET_KEY="",
        STRIPE_PRICE_ID=""
    )
    def test_checkout_requires_stripe_configuration(self):

        self.client.force_authenticate(user=self.owner)

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, 503)

    @override_settings(
        STRIPE_SECRET_KEY="sk_test_example",
        STRIPE_PRICE_ID="price_test_example"
    )
    @patch("billing.views.get_stripe_client")
    def test_owner_can_create_checkout_session(self, mock_client):

        self.client.force_authenticate(user=self.owner)

        customer = MagicMock()
        customer.id = "cus_test_123"

        checkout_session = MagicMock()
        checkout_session.url = "https://checkout.stripe.com/test"

        mock_client.return_value.v1.customers.create.return_value = customer

        mock_client.return_value.v1.checkout.sessions.create.return_value = (
            checkout_session
        )

        response = self.client.post(self.checkout_url)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["checkout_url"],
            "https://checkout.stripe.com/test"
        )

        self.assertTrue(
            Subscription.objects.filter(
                workspace=self.workspace
            ).exists()
        )

    def test_workspace_member_can_view_subscription(self):

        subscription = Subscription.objects.create(
            workspace=self.workspace,
            plan_name="Free",
            status=Subscription.Status.INCOMPLETE
        )

        self.client.force_authenticate(user=self.member)

        response = self.client.get(self.subscription_url)

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            response.data["plan_name"],
            subscription.plan_name
        )

    def test_non_member_cannot_view_subscription(self):

        other_user = User.objects.create_user(
            username="outsider",
            email="outsider@example.com",
            password="TestPassword123!"
        )

        self.client.force_authenticate(user=other_user)

        response = self.client.get(self.subscription_url)

        self.assertEqual(response.status_code, 404)

    # -----------------------------------------
    # WEBHOOK TEST HELPERS
    # -----------------------------------------

    def create_webhook_event(
        self,
        event_id,
        event_type,
        event_data
    ):

        return {
            "id": event_id,
            "type": event_type,
            "data": {
                "object": event_data
            }
        }

    def send_webhook(self):

        return self.client.post(
            self.webhook_url,
            data=b'{}',
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="test-signature"
        )

    # -----------------------------------------
    # WEBHOOK SECURITY TESTS
    # -----------------------------------------

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    def test_webhook_requires_signature(self):

        response = self.client.post(
            self.webhook_url,
            data=b'{}',
            content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    @patch("billing.views.stripe.Webhook.construct_event")
    def test_webhook_rejects_invalid_signature(
        self,
        mock_construct_event
    ):

        mock_construct_event.side_effect = ValueError(
            "Invalid webhook signature"
        )

        response = self.send_webhook()

        self.assertEqual(response.status_code, 400)

    # -----------------------------------------
    # CHECKOUT COMPLETED WEBHOOK TEST
    # -----------------------------------------

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    @patch("billing.views.get_stripe_client")
    @patch("billing.views.stripe.Webhook.construct_event")
    def test_checkout_completed_updates_subscription(
        self,
        mock_construct_event,
        mock_client
    ):

        subscription = Subscription.objects.create(
            workspace=self.workspace
        )

        event = self.create_webhook_event(
            "evt_checkout_123",
            "checkout.session.completed",
            {
                "metadata": {
                    "workspace_id": str(self.workspace.id)
                },
                "subscription": "sub_test_123",
                "customer": "cus_test_123"
            }
        )

        mock_construct_event.return_value = event

        mock_client.return_value.v1.subscriptions.retrieve.return_value = {
            "id": "sub_test_123",
            "status": "active",
            "customer": "cus_test_123",
            "current_period_end": 1799999999,
            "cancel_at_period_end": False,
            "items": {
                "data": [
                    {
                        "price": {
                            "id": "price_test_123"
                        }
                    }
                ]
            }
        }

        response = self.send_webhook()

        subscription.refresh_from_db()

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            subscription.stripe_subscription_id,
            "sub_test_123"
        )

        self.assertEqual(
            subscription.stripe_customer_id,
            "cus_test_123"
        )

        self.assertEqual(
            subscription.status,
            Subscription.Status.ACTIVE
        )

        self.assertEqual(
            subscription.stripe_price_id,
            "price_test_123"
        )

    # -----------------------------------------
    # SUBSCRIPTION UPDATED WEBHOOK TEST
    # -----------------------------------------

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    @patch("billing.views.stripe.Webhook.construct_event")
    def test_subscription_updated_sets_active_status(
        self,
        mock_construct_event
    ):

        subscription = Subscription.objects.create(
            workspace=self.workspace
        )

        event = self.create_webhook_event(
            "evt_updated_123",
            "customer.subscription.updated",
            {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "active",
                "current_period_end": 1799999999,
                "cancel_at_period_end": False,
                "metadata": {
                    "workspace_id": str(self.workspace.id)
                },
                "items": {
                    "data": [
                        {
                            "price": {
                                "id": "price_test_123"
                            }
                        }
                    ]
                }
            }
        )

        mock_construct_event.return_value = event

        response = self.send_webhook()

        subscription.refresh_from_db()

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            subscription.status,
            Subscription.Status.ACTIVE
        )

        self.assertEqual(
            subscription.stripe_subscription_id,
            "sub_test_123"
        )

        self.assertEqual(
            subscription.stripe_customer_id,
            "cus_test_123"
        )

        self.assertIsNotNone(
            subscription.current_period_end
        )

    # -----------------------------------------
    # SUBSCRIPTION DELETED WEBHOOK TEST
    # -----------------------------------------

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    @patch("billing.views.stripe.Webhook.construct_event")
    def test_subscription_deleted_sets_canceled_status(
        self,
        mock_construct_event
    ):

        subscription = Subscription.objects.create(
            workspace=self.workspace,
            stripe_subscription_id="sub_test_123",
            status=Subscription.Status.ACTIVE
        )

        event = self.create_webhook_event(
            "evt_deleted_123",
            "customer.subscription.deleted",
            {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "canceled",
                "cancel_at_period_end": False,
                "metadata": {
                    "workspace_id": str(self.workspace.id)
                }
            }
        )

        mock_construct_event.return_value = event

        response = self.send_webhook()

        subscription.refresh_from_db()

        self.assertEqual(response.status_code, 200)

        self.assertEqual(
            subscription.status,
            Subscription.Status.CANCELED
        )

    # -----------------------------------------
    # DUPLICATE WEBHOOK TEST
    # -----------------------------------------

    @override_settings(
        STRIPE_WEBHOOK_SECRET="whsec_test"
    )
    @patch("billing.views.stripe.Webhook.construct_event")
    def test_duplicate_webhook_is_not_processed_twice(
        self,
        mock_construct_event
    ):

        subscription = Subscription.objects.create(
            workspace=self.workspace
        )

        event = self.create_webhook_event(
            "evt_duplicate_123",
            "customer.subscription.updated",
            {
                "id": "sub_test_123",
                "customer": "cus_test_123",
                "status": "active",
                "cancel_at_period_end": False,
                "metadata": {
                    "workspace_id": str(self.workspace.id)
                }
            }
        )

        mock_construct_event.return_value = event

        first_response = self.send_webhook()

        self.assertEqual(first_response.status_code, 200)

        subscription.refresh_from_db()

        self.assertEqual(
            subscription.status,
            Subscription.Status.ACTIVE
        )

        # Change the payload but reuse the same event ID.
        event["data"]["object"]["status"] = "canceled"

        second_response = self.send_webhook()

        subscription.refresh_from_db()

        self.assertEqual(second_response.status_code, 200)

        # Duplicate event must not change the subscription.
        self.assertEqual(
            subscription.status,
            Subscription.Status.ACTIVE
        )

        self.assertEqual(
            StripeWebhookEvent.objects.filter(
                event_id="evt_duplicate_123"
            ).count(),
            1
        )


from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from rest_framework.test import APIClient

from workspaces.models import Workspace, Membership
from billing.models import Subscription


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

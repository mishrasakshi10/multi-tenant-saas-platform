
from django.urls import path

from .views import (
    CreateCheckoutSessionAPIView,
    WorkspaceSubscriptionAPIView,
    StripeWebhookAPIView,
)

urlpatterns = [
    # Stripe webhook
    path(
        "webhook/",
        StripeWebhookAPIView.as_view(),
        name="stripe-webhook",
    ),

    # Create checkout session for a workspace
    path(
        "workspaces/<int:workspace_id>/checkout/",
        CreateCheckoutSessionAPIView.as_view(),
        name="create-checkout-session",
    ),

    # Get workspace subscription details
    path(
        "workspaces/<int:workspace_id>/subscription/",
        WorkspaceSubscriptionAPIView.as_view(),
        name="workspace-subscription",
    ),
]

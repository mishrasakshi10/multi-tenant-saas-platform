
from django.db import models
from workspaces.models import Workspace


class Subscription(models.Model):

    class Status(models.TextChoices):
        INCOMPLETE = "incomplete", "Incomplete"
        ACTIVE = "active", "Active"
        PAST_DUE = "past_due", "Past Due"
        CANCELED = "canceled", "Canceled"
        UNPAID = "unpaid", "Unpaid"
        TRIALING = "trialing", "Trialing"

    workspace = models.OneToOneField(
        Workspace,
        on_delete=models.CASCADE,
        related_name="subscription"
    )

    stripe_customer_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True
    )

    stripe_subscription_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True
    )

    stripe_price_id = models.CharField(
        max_length=255,
        blank=True
    )

    plan_name = models.CharField(
        max_length=100,
        default="Free"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INCOMPLETE
    )

    current_period_end = models.DateTimeField(
        blank=True,
        null=True
    )

    cancel_at_period_end = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.workspace.name} - {self.plan_name} ({self.status})"

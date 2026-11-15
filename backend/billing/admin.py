
from django.contrib import admin

from .models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):

    list_display = (
        "workspace",
        "plan_name",
        "status",
        "stripe_customer_id",
        "stripe_subscription_id",
        "created_at",
    )

    list_filter = (
        "status",
        "plan_name",
    )

    search_fields = (
        "workspace__name",
        "stripe_customer_id",
        "stripe_subscription_id",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

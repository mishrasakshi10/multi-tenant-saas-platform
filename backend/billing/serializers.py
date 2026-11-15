
from rest_framework import serializers

from .models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):

    workspace_name = serializers.CharField(
        source="workspace.name",
        read_only=True
    )

    class Meta:
        model = Subscription
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "plan_name",
            "status",
            "current_period_end",
            "cancel_at_period_end",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

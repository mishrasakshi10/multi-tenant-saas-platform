
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Workspace, Membership

User = get_user_model()


class WorkspaceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Workspace
        fields = [
            'id',
            'name',
            'slug',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
            'slug',
        ]

    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user

        name = validated_data['name']
        base_slug = slugify(name)[:160] or "workspace"

        slug = base_slug
        counter = 1

        while Workspace.objects.filter(slug=slug).exists():
            suffix = f"-{counter}"
            slug = f"{base_slug[:160 - len(suffix)]}{suffix}"
            counter += 1

        workspace = Workspace.objects.create(
            created_by=user,
            slug=slug,
            **validated_data
        )

        Membership.objects.create(
            workspace=workspace,
            user=user,
            role=Membership.Role.OWNER
        )

        return workspace


class MembershipSerializer(serializers.ModelSerializer):

    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all()
    )

    role = serializers.ChoiceField(
        choices=[
            (Membership.Role.ADMIN, 'Admin'),
            (Membership.Role.MEMBER, 'Member'),
        ]
    )

    class Meta:
        model = Membership
        fields = [
            'id',
            'user',
            'role',
            'joined_at',
        ]
        read_only_fields = [
            'id',
            'joined_at',
        ]

    def validate(self, attrs):

        request = self.context['request']
        workspace = self.context['workspace']

        current_membership = Membership.objects.filter(
            workspace=workspace,
            user=request.user
        ).first()

        if not current_membership:
            raise serializers.ValidationError(
                "You are not a workspace member."
            )

        requested_role = attrs['role']

        if (
            current_membership.role == Membership.Role.ADMIN
            and requested_role != Membership.Role.MEMBER
        ):
            raise serializers.ValidationError(
                "Admins can only add Members."
            )

        if current_membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise serializers.ValidationError(
                "You do not have permission to add members."
            )

        if Membership.objects.filter(
            workspace=workspace,
            user=attrs['user']
        ).exists():
            raise serializers.ValidationError(
                "This user is already a workspace member."
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        workspace = self.context['workspace']

        return Membership.objects.create(
            workspace=workspace,
            **validated_data
        )

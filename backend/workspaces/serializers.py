
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from rest_framework import serializers

from .models import Workspace, Membership

User = get_user_model()


# =========================
# WORKSPACE SERIALIZER
# =========================

class WorkspaceSerializer(serializers.ModelSerializer):

    current_user_role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id',
            'name',
            'slug',
            'created_by',
            'created_at',
            'updated_at',
            'current_user_role',
        ]

        read_only_fields = [
            'id',
            'created_by',
            'created_at',
            'updated_at',
            'slug',
            'current_user_role',
        ]

    def get_current_user_role(self, obj):

        request = self.context.get('request')

        if not request or not request.user.is_authenticated:
            return None

        membership = Membership.objects.filter(
            workspace=obj,
            user=request.user
        ).first()

        return membership.role if membership else None

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


# =========================
# MEMBERSHIP SERIALIZER
# =========================

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

        # =========================
        # UPDATE VALIDATION
        # =========================

        if self.instance:

            if current_membership.role != Membership.Role.OWNER:
                raise serializers.ValidationError(
                    "Only the workspace Owner can update member roles."
                )

            if self.instance.role == Membership.Role.OWNER:
                raise serializers.ValidationError(
                    "Owner membership cannot be changed."
                )

            return attrs

        # =========================
        # CREATE VALIDATION
        # =========================

        requested_role = attrs.get('role')
        requested_user = attrs.get('user')

        if current_membership.role == Membership.Role.ADMIN:

            if requested_role != Membership.Role.MEMBER:
                raise serializers.ValidationError(
                    "Admins can only add Members."
                )

        elif current_membership.role != Membership.Role.OWNER:

            raise serializers.ValidationError(
                "You do not have permission to add members."
            )

        if Membership.objects.filter(
            workspace=workspace,
            user=requested_user
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

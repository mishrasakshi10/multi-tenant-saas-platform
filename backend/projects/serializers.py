
from rest_framework import serializers

from .models import (
    Project,
    Board,
    Sprint,
    Issue,
    IssueComment,
    IssueAttachment,
    IssueActivity,
)


class ProjectSerializer(serializers.ModelSerializer):

    class Meta:
        model = Project
        fields = [
            'id', 'workspace', 'name', 'key', 'description',
            'status', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        workspace = attrs.get(
            'workspace',
            getattr(self.instance, 'workspace', None)
        )
        request = self.context['request']

        if workspace is None:
            raise serializers.ValidationError({
                'workspace': 'Workspace is required.'
            })

        membership = workspace.memberships.filter(
            user=request.user
        ).first()

        if not membership:
            raise serializers.ValidationError({
                'workspace': 'You are not a member of this workspace.'
            })

        if self.instance and workspace.id != self.instance.workspace_id:
            if membership.role not in ['OWNER', 'ADMIN']:
                raise serializers.ValidationError({
                    'workspace': 'Only workspace Owners and Admins can move projects.'
                })

        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class BoardSerializer(serializers.ModelSerializer):

    class Meta:
        model = Board
        fields = [
            'id', 'project', 'name', 'description', 'is_default',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        project = attrs.get(
            'project',
            getattr(self.instance, 'project', None)
        )
        request = self.context['request']

        if project and not project.workspace.memberships.filter(
            user=request.user
        ).exists():
            raise serializers.ValidationError({
                'project': 'You are not a member of this workspace.'
            })

        return attrs

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class SprintSerializer(serializers.ModelSerializer):

    class Meta:
        model = Sprint
        fields = [
            'id', 'project', 'name', 'goal', 'start_date',
            'end_date', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        project = attrs.get(
            'project',
            getattr(self.instance, 'project', None)
        )
        start_date = attrs.get(
            'start_date',
            getattr(self.instance, 'start_date', None)
        )
        end_date = attrs.get(
            'end_date',
            getattr(self.instance, 'end_date', None)
        )
        request = self.context['request']

        if project and not project.workspace.memberships.filter(
            user=request.user
        ).exists():
            raise serializers.ValidationError({
                'project': 'You are not a member of this workspace.'
            })

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })

        return attrs


class IssueSerializer(serializers.ModelSerializer):

    class Meta:
        model = Issue
        fields = [
            'id', 'project', 'board', 'sprint', 'title',
            'description', 'issue_type', 'priority', 'status',
            'reporter', 'assignee', 'due_date', 'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 'reporter', 'created_at', 'updated_at',
        ]

    def validate(self, attrs):
        project = attrs.get(
            'project',
            getattr(self.instance, 'project', None)
        )
        board = attrs.get(
            'board',
            getattr(self.instance, 'board', None)
        )
        sprint = attrs.get(
            'sprint',
            getattr(self.instance, 'sprint', None)
        )
        assignee = attrs.get(
            'assignee',
            getattr(self.instance, 'assignee', None)
        )
        request = self.context['request']

        if project and not project.workspace.memberships.filter(
            user=request.user
        ).exists():
            raise serializers.ValidationError({
                'project': 'You are not a member of this workspace.'
            })

        if project and board and board.project_id != project.id:
            raise serializers.ValidationError({
                'board': 'Board must belong to the selected project.'
            })

        if project and sprint and sprint.project_id != project.id:
            raise serializers.ValidationError({
                'sprint': 'Sprint must belong to the selected project.'
            })

        if project and assignee:
            is_member = project.workspace.memberships.filter(
                user=assignee
            ).exists()

            if not is_member:
                raise serializers.ValidationError({
                    'assignee': 'Assignee must be a member of this workspace.'
                })

        return attrs

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class IssueCommentSerializer(serializers.ModelSerializer):

    class Meta:
        model = IssueComment
        fields = [
            'id', 'issue', 'author', 'body', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'author', 'created_at', 'updated_at',
        ]

    def validate_issue(self, value):
        request = self.context['request']

        if not value.project.workspace.memberships.filter(
            user=request.user
        ).exists():
            raise serializers.ValidationError(
                "You are not a member of this workspace."
            )

        return value

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Comment cannot be empty."
            )
        return value

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class IssueAttachmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = IssueAttachment
        fields = [
            'id', 'issue', 'uploaded_by', 'file', 'caption', 'created_at',
        ]
        read_only_fields = [
            'id', 'uploaded_by', 'created_at',
        ]

    def validate_issue(self, value):
        request = self.context['request']

        if not value.project.workspace.memberships.filter(
            user=request.user
        ).exists():
            raise serializers.ValidationError(
                "You are not a member of this workspace."
            )

        return value

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class IssueActivitySerializer(serializers.ModelSerializer):

    class Meta:
        model = IssueActivity
        fields = [
            'id', 'issue', 'actor', 'action', 'field_name',
            'old_value', 'new_value', 'created_at',
        ]
        read_only_fields = [
            'id', 'issue', 'actor', 'action', 'field_name',
            'old_value', 'new_value', 'created_at',
        ]

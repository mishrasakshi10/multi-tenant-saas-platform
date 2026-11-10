
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import (
    Project,
    Board,
    Sprint,
    Issue,
    IssueComment,
    IssueAttachment,
    IssueActivity,
)

from .serializers import (
    ProjectSerializer,
    BoardSerializer,
    SprintSerializer,
    IssueSerializer,
    IssueCommentSerializer,
    IssueAttachmentSerializer,
    IssueActivitySerializer,
)

from workspaces.permissions import (
    IsWorkspaceMember,
    IsWorkspaceAdmin,
)


# =========================
# ACTIVITY HELPER
# =========================

def create_activity(
    issue,
    actor,
    action,
    field_name="",
    old_value="",
    new_value=""
):
    IssueActivity.objects.create(
        issue=issue,
        actor=actor,
        action=action,
        field_name=field_name,
        old_value=str(old_value),
        new_value=str(new_value),
    )


# =========================
# PROJECT APIs
# =========================

class ProjectListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(
            workspace__memberships__user=self.request.user
        ).select_related(
            'workspace', 'created_by'
        ).distinct()


class ProjectDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(
            workspace__memberships__user=self.request.user
        ).select_related(
            'workspace', 'created_by'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]


# =========================
# BOARD APIs
# =========================

class BoardListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Board.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'created_by', 'project__workspace'
        ).distinct()


class BoardDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = BoardSerializer

    def get_queryset(self):
        return Board.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'created_by', 'project__workspace'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]


# =========================
# SPRINT APIs
# =========================

class SprintListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = SprintSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Sprint.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'project__workspace'
        ).distinct()


class SprintDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = SprintSerializer

    def get_queryset(self):
        return Sprint.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'project__workspace'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]


# =========================
# ISSUE APIs
# =========================

class IssueListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = IssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Issue.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'board', 'sprint',
            'reporter', 'assignee', 'project__workspace'
        ).distinct()

    def perform_create(self, serializer):
        issue = serializer.save()

        create_activity(
            issue=issue,
            actor=self.request.user,
            action=IssueActivity.Action.CREATED,
            new_value=issue.title
        )


class IssueDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = IssueSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            project__workspace__memberships__user=self.request.user
        ).select_related(
            'project', 'board', 'sprint',
            'reporter', 'assignee', 'project__workspace'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]

    def perform_update(self, serializer):

        old_issue = self.get_object()

        old_status = old_issue.status
        old_assignee_id = old_issue.assignee_id
        old_title = old_issue.title
        old_description = old_issue.description
        old_priority = old_issue.priority

        issue = serializer.save()

        if old_status != issue.status:
            create_activity(
                issue,
                self.request.user,
                IssueActivity.Action.STATUS_CHANGED,
                'status',
                old_status,
                issue.status
            )

        if old_assignee_id != issue.assignee_id:
            create_activity(
                issue,
                self.request.user,
                IssueActivity.Action.ASSIGNED,
                'assignee',
                old_assignee_id,
                issue.assignee_id
            )

        if old_title != issue.title:
            create_activity(
                issue,
                self.request.user,
                IssueActivity.Action.UPDATED,
                'title',
                old_title,
                issue.title
            )

        if old_description != issue.description:
            create_activity(
                issue,
                self.request.user,
                IssueActivity.Action.UPDATED,
                'description',
                old_description,
                issue.description
            )

        if old_priority != issue.priority:
            create_activity(
                issue,
                self.request.user,
                IssueActivity.Action.UPDATED,
                'priority',
                old_priority,
                issue.priority
            )


# =========================
# ISSUE COMMENT APIs
# =========================

class IssueCommentListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = IssueCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IssueComment.objects.filter(
            issue__project__workspace__memberships__user=self.request.user
        ).select_related(
            'issue', 'author',
            'issue__project', 'issue__project__workspace'
        ).distinct()

    def perform_create(self, serializer):
        comment = serializer.save()

        create_activity(
            issue=comment.issue,
            actor=self.request.user,
            action=IssueActivity.Action.COMMENTED,
            new_value=comment.body
        )


class IssueCommentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = IssueCommentSerializer

    def get_queryset(self):
        return IssueComment.objects.filter(
            issue__project__workspace__memberships__user=self.request.user
        ).select_related(
            'issue', 'author',
            'issue__project', 'issue__project__workspace'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]


# =========================
# ISSUE ATTACHMENT APIs
# =========================

class IssueAttachmentListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = IssueAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return IssueAttachment.objects.filter(
            issue__project__workspace__memberships__user=self.request.user
        ).select_related(
            'issue',
            'uploaded_by',
            'issue__project',
            'issue__project__workspace'
        ).distinct()

    def perform_create(self, serializer):
        attachment = serializer.save()

        create_activity(
            issue=attachment.issue,
            actor=self.request.user,
            action=IssueActivity.Action.ATTACHMENT_ADDED,
            new_value=attachment.caption or attachment.file.name
        )


class IssueAttachmentDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = IssueAttachmentSerializer

    def get_queryset(self):
        return IssueAttachment.objects.filter(
            issue__project__workspace__memberships__user=self.request.user
        ).select_related(
            'issue',
            'uploaded_by',
            'issue__project',
            'issue__project__workspace'
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]
        return [IsWorkspaceMember()]


# =========================
# ISSUE ACTIVITY API
# =========================

class IssueActivityListAPIView(generics.ListAPIView):

    serializer_class = IssueActivitySerializer
    permission_classes = [IsAuthenticated, IsWorkspaceMember]

    def get_queryset(self):

        queryset = IssueActivity.objects.filter(
            issue__project__workspace__memberships__user=self.request.user
        ).select_related(
            'issue',
            'actor',
            'issue__project',
            'issue__project__workspace'
        ).distinct()

        issue_id = self.request.query_params.get('issue_id')

        if issue_id:
            queryset = queryset.filter(issue_id=issue_id)

        return queryset.order_by('-created_at')

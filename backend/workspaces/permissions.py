
from rest_framework.permissions import BasePermission
from .models import Membership, Workspace


def get_object_workspace(obj):

    if isinstance(obj, Workspace):
        return obj

    if hasattr(obj, 'workspace'):
        return obj.workspace

    if hasattr(obj, 'project'):
        return obj.project.workspace

    if hasattr(obj, 'issue'):
        return obj.issue.project.workspace

    return None


class IsWorkspaceMember(BasePermission):

    def has_permission(self, request, view):

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        workspace = get_object_workspace(obj)

        if workspace is None:
            return False

        return Membership.objects.filter(
            workspace=workspace,
            user=request.user
        ).exists()


class IsWorkspaceAdmin(BasePermission):

    def has_permission(self, request, view):

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        workspace = get_object_workspace(obj)

        if workspace is None:
            return False

        return Membership.objects.filter(
            workspace=workspace,
            user=request.user,
            role__in=[
                Membership.Role.OWNER,
                Membership.Role.ADMIN,
            ]
        ).exists()


class IsWorkspaceOwner(BasePermission):

    def has_permission(self, request, view):

        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        workspace = get_object_workspace(obj)

        if workspace is None:
            return False

        return Membership.objects.filter(
            workspace=workspace,
            user=request.user,
            role=Membership.Role.OWNER
        ).exists()

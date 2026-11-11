
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import Workspace, Membership
from .serializers import WorkspaceSerializer, MembershipSerializer
from .permissions import IsWorkspaceMember, IsWorkspaceAdmin


class WorkspaceListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Workspace.objects.filter(
            memberships__user=self.request.user
        ).distinct()


class WorkspaceDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = WorkspaceSerializer

    def get_queryset(self):
        return Workspace.objects.filter(
            memberships__user=self.request.user
        ).distinct()

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsWorkspaceAdmin()]

        return [IsWorkspaceMember()]


class MembershipListCreateAPIView(generics.ListCreateAPIView):

    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_workspace(self):

        if not hasattr(self, '_workspace'):
            self._workspace = generics.get_object_or_404(
                Workspace.objects.filter(
                    memberships__user=self.request.user
                ).distinct(),
                pk=self.kwargs['workspace_id']
            )

        return self._workspace

    def check_admin_permission(self):

        workspace = self.get_workspace()

        current_membership = Membership.objects.filter(
            workspace=workspace,
            user=self.request.user
        ).first()

        if not current_membership or current_membership.role not in [
            Membership.Role.OWNER,
            Membership.Role.ADMIN,
        ]:
            raise PermissionDenied(
                "Only workspace Owners and Admins can manage members."
            )

    def get_queryset(self):

        self.check_admin_permission()

        return Membership.objects.filter(
            workspace=self.get_workspace()
        ).select_related('user')

    def get_serializer_context(self):

        context = super().get_serializer_context()
        context['workspace'] = self.get_workspace()

        return context

    def create(self, request, *args, **kwargs):

        self.check_admin_permission()

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):

        serializer.save()


class MembershipDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]

    def get_workspace(self):

        return generics.get_object_or_404(
            Workspace.objects.filter(
                memberships__user=self.request.user
            ).distinct(),
            pk=self.kwargs['workspace_id']
        )

    def check_owner_permission(self):

        workspace = self.get_workspace()

        current_membership = Membership.objects.filter(
            workspace=workspace,
            user=self.request.user,
            role=Membership.Role.OWNER
        ).exists()

        if not current_membership:
            raise PermissionDenied(
                "Only the workspace Owner can update or remove members."
            )

    def get_queryset(self):

        self.check_owner_permission()

        return Membership.objects.filter(
            workspace=self.get_workspace()
        ).select_related('user')

    def get_serializer_context(self):

        context = super().get_serializer_context()
        context['workspace'] = self.get_workspace()

        return context

    def perform_update(self, serializer):

        membership = self.get_object()

        if membership.role == Membership.Role.OWNER:
            raise PermissionDenied(
                "Owner membership cannot be changed."
            )

        serializer.save()

    def perform_destroy(self, instance):

        if instance.role == Membership.Role.OWNER:
            raise PermissionDenied(
                "Owner membership cannot be removed."
            )

        instance.delete()


from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from .models import Workspace, Membership

User = get_user_model()


class WorkspaceAPITests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="workspace_owner",
            email="owner@example.com",
            password="TestPass@12345"
        )

        self.member = User.objects.create_user(
            username="workspace_member",
            email="member@example.com",
            password="TestPass@12345"
        )

        self.non_member = User.objects.create_user(
            username="workspace_nonmember",
            email="nonmember@example.com",
            password="TestPass@12345"
        )

        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace-auto",
            created_by=self.owner
        )

        Membership.objects.create(
            workspace=self.workspace,
            user=self.owner,
            role=Membership.Role.OWNER
        )

        Membership.objects.create(
            workspace=self.workspace,
            user=self.member,
            role=Membership.Role.MEMBER
        )

    def test_owner_can_list_workspace(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get("/api/workspaces/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_non_member_cannot_view_workspace(self):
        self.client.force_authenticate(user=self.non_member)

        response = self.client.get(
            f"/api/workspaces/{self.workspace.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_member_can_view_workspace(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.get(
            f"/api/workspaces/{self.workspace.id}/"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_member_cannot_update_workspace(self):
        self.client.force_authenticate(user=self.member)

        response = self.client.patch(
            f"/api/workspaces/{self.workspace.id}/",
            {"name": "Unauthorized Update"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN
        )

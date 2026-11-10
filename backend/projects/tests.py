
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from workspaces.models import Workspace, Membership
from .models import Project

User = get_user_model()


class ProjectAPITests(APITestCase):

    def setUp(self):
        self.owner = User.objects.create_user(
            username="project_owner",
            email="projectowner@example.com",
            password="TestPass@12345"
        )

        self.non_member = User.objects.create_user(
            username="project_nonmember",
            email="projectnonmember@example.com",
            password="TestPass@12345"
        )

        self.workspace = Workspace.objects.create(
            name="Project Test Workspace",
            slug="project-test-workspace",
            created_by=self.owner
        )

        Membership.objects.create(
            workspace=self.workspace,
            user=self.owner,
            role=Membership.Role.OWNER
        )

        self.project = Project.objects.create(
            workspace=self.workspace,
            name="Test Project",
            key="TEST",
            created_by=self.owner
        )

    def test_workspace_member_can_list_projects(self):
        self.client.force_authenticate(user=self.owner)

        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["key"], "TEST")

    def test_non_member_cannot_see_projects(self):
        self.client.force_authenticate(user=self.non_member)

        response = self.client.get("/api/projects/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_non_member_cannot_access_project_detail(self):
        self.client.force_authenticate(user=self.non_member)

        response = self.client.get(
            f"/api/projects/{self.project.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

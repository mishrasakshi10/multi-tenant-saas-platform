
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

User = get_user_model()


class AuthenticationAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="autotest_user",
            email="autotest@example.com",
            password="TestPass@12345"
        )

    def test_user_registration_success(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "newautotest",
                "email": "newautotest@example.com",
                "first_name": "Test",
                "last_name": "User",
                "password": "StrongTest@12345",
                "password2": "StrongTest@12345",
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="newautotest").exists()
        )

    def test_user_login_success(self):
        response = self.client.post(
            "/api/auth/token/",
            {
                "username": "autotest_user",
                "password": "TestPass@12345",
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_user_login_invalid_password(self):
        response = self.client.post(
            "/api/auth/token/",
            {
                "username": "autotest_user",
                "password": "WrongPassword123",
            },
            format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_api_without_token(self):
        response = self.client.get("/api/workspaces/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

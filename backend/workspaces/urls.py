
from django.urls import path

from .views import (
    WorkspaceListCreateAPIView,
    WorkspaceDetailAPIView,
    MembershipListCreateAPIView,
    MembershipDetailAPIView,
)

urlpatterns = [
    path(
        '',
        WorkspaceListCreateAPIView.as_view(),
        name='workspace-list-create'
    ),
    path(
        '<int:pk>/',
        WorkspaceDetailAPIView.as_view(),
        name='workspace-detail'
    ),
    path(
        '<int:workspace_id>/members/',
        MembershipListCreateAPIView.as_view(),
        name='workspace-members'
    ),
    path(
        '<int:workspace_id>/members/<int:pk>/',
        MembershipDetailAPIView.as_view(),
        name='membership-detail'
    ),
]

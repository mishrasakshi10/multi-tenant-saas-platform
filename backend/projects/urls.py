
from django.urls import path

from .views import (
    ProjectListCreateAPIView,
    ProjectDetailAPIView,
    BoardListCreateAPIView,
    BoardDetailAPIView,
    SprintListCreateAPIView,
    SprintDetailAPIView,
    IssueListCreateAPIView,
    IssueDetailAPIView,
    IssueCommentListCreateAPIView,
    IssueCommentDetailAPIView,
    IssueAttachmentListCreateAPIView,
    IssueAttachmentDetailAPIView,
    IssueActivityListAPIView,
    NotificationListAPIView,
    NotificationDetailAPIView,
)

urlpatterns = [

    # Project URLs
    path('', ProjectListCreateAPIView.as_view(), name='project-list-create'),
    path('<int:pk>/', ProjectDetailAPIView.as_view(), name='project-detail'),

    # Board URLs
    path('boards/', BoardListCreateAPIView.as_view(), name='board-list-create'),
    path('boards/<int:pk>/', BoardDetailAPIView.as_view(), name='board-detail'),

    # Sprint URLs
    path('sprints/', SprintListCreateAPIView.as_view(), name='sprint-list-create'),
    path('sprints/<int:pk>/', SprintDetailAPIView.as_view(), name='sprint-detail'),

    # Issue URLs
    path('issues/', IssueListCreateAPIView.as_view(), name='issue-list-create'),
    path('issues/<int:pk>/', IssueDetailAPIView.as_view(), name='issue-detail'),

    # Comment URLs
    path('comments/', IssueCommentListCreateAPIView.as_view(), name='issue-comment-list-create'),
    path('comments/<int:pk>/', IssueCommentDetailAPIView.as_view(), name='issue-comment-detail'),

    # Attachment URLs
    path('attachments/', IssueAttachmentListCreateAPIView.as_view(), name='issue-attachment-list-create'),
    path('attachments/<int:pk>/', IssueAttachmentDetailAPIView.as_view(), name='issue-attachment-detail'),

    # Activity URLs
    path('activities/', IssueActivityListAPIView.as_view(), name='issue-activity-list'),

    # Notification URLs
    path(
        'notifications/',
        NotificationListAPIView.as_view(),
        name='notification-list'
    ),

    path(
        'notifications/<int:pk>/',
        NotificationDetailAPIView.as_view(),
        name='notification-detail'
    ),

]

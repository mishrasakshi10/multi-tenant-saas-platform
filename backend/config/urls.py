
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)


urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication APIs
    path(
        'api/auth/token/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),
    path(
        'api/auth/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path(
        'api/auth/logout/',
        TokenBlacklistView.as_view(),
        name='token_blacklist'
    ),
    path(
        'api/auth/',
        include('accounts.urls')
    ),

    # Workspace APIs
    path(
        'api/workspaces/',
        include('workspaces.urls')
    ),

    # Project APIs
    path(
        'api/projects/',
        include('projects.urls')
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )

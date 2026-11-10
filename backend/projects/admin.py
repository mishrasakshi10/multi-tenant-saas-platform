
from django.contrib import admin
from .models import (
    Project,
    Board,
    Sprint,
    Issue,
    IssueComment,
    IssueAttachment,
    IssueActivity,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name", "key", "workspace", "status",
        "created_by", "created_at",
    )
    list_filter = ("status", "workspace")
    search_fields = ("name", "key", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = (
        "name", "project", "is_default", "created_by", "created_at",
    )
    list_filter = ("is_default", "project")
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Sprint)
class SprintAdmin(admin.ModelAdmin):
    list_display = (
        "name", "project", "start_date", "end_date",
        "status", "created_at",
    )
    list_filter = ("status", "project")
    search_fields = ("name", "goal")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = (
        "title", "project", "board", "sprint",
        "issue_type", "priority", "status",
        "assignee", "reporter", "created_at",
    )
    list_filter = (
        "issue_type", "priority", "status", "project", "sprint",
    )
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at")


@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = (
        "issue", "author", "created_at", "updated_at",
    )
    search_fields = ("body", "issue__title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(IssueAttachment)
class IssueAttachmentAdmin(admin.ModelAdmin):
    list_display = (
        "issue", "uploaded_by", "caption", "created_at",
    )
    search_fields = ("caption", "issue__title")
    readonly_fields = ("created_at",)


@admin.register(IssueActivity)
class IssueActivityAdmin(admin.ModelAdmin):
    list_display = (
        "issue", "actor", "action", "field_name", "created_at",
    )
    list_filter = ("action", "created_at")
    search_fields = (
        "issue__title", "actor__username",
        "field_name", "old_value", "new_value",
    )
    readonly_fields = ("created_at",)

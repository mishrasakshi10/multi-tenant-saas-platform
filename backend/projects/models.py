
from django.conf import settings
from django.db import models
from workspaces.models import Workspace


class Project(models.Model):

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="projects"
    )
    name = models.CharField(max_length=150)
    key = models.CharField(max_length=20)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_projects"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "key"],
                name="unique_project_key_per_workspace"
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.key} - {self.name}"


class Board(models.Model):

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="boards"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_boards"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="unique_board_name_per_project"
            )
        ]

    def __str__(self):
        return f"{self.project.key} - {self.name}"


class Sprint(models.Model):

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="sprints"
    )
    name = models.CharField(max_length=100)
    goal = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.project.key} - {self.name}"


class Issue(models.Model):

    class IssueType(models.TextChoices):
        TASK = "task", "Task"
        BUG = "bug", "Bug"
        STORY = "story", "Story"
        FEATURE = "feature", "Feature"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        IN_REVIEW = "in_review", "In Review"
        DONE = "done", "Done"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="issues"
    )
    board = models.ForeignKey(
        Board,
        on_delete=models.CASCADE,
        related_name="issues"
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issues"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    issue_type = models.CharField(
        max_length=20,
        choices=IssueType.choices,
        default=IssueType.TASK
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_issues"
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_issues"
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class IssueComment(models.Model):

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issue_comments"
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on {self.issue}"


class IssueAttachment(models.Model):

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="attachments"
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_issue_attachments"
    )
    file = models.FileField(
        upload_to="issue_attachments/"
    )
    caption = models.CharField(
        max_length=255,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attachment for {self.issue}"


class IssueActivity(models.Model):

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        STATUS_CHANGED = "status_changed", "Status Changed"
        ASSIGNED = "assigned", "Assigned"
        COMMENTED = "commented", "Commented"
        ATTACHMENT_ADDED = "attachment_added", "Attachment Added"

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issue_activities"
    )

    action = models.CharField(
        max_length=30,
        choices=Action.choices
    )

    field_name = models.CharField(
        max_length=100,
        blank=True
    )

    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor} - {self.action} - {self.issue}"


class Notification(models.Model):

    class NotificationType(models.TextChoices):
        ASSIGNED = "ASSIGNED", "Assigned"
        COMMENT = "COMMENT", "Comment"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )

    message = models.CharField(max_length=255)

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient} - {self.message}"


from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import Issue, Notification


@shared_task
def send_due_date_reminders():

    today = timezone.localdate()
    tomorrow = today + timedelta(days=1)

    issues = (
        Issue.objects
        .filter(
            due_date__in=[today, tomorrow],
            assignee__isnull=False
        )
        .exclude(status=Issue.Status.DONE)
        .select_related(
            "assignee",
            "project",
            "project__workspace"
        )
    )

    created_count = 0

    for issue in issues:

        due_date_text = issue.due_date.strftime("%d %b %Y")

        message = (
            f"Reminder: '{issue.title}' is due on {due_date_text}."
        )

        notification, created = Notification.objects.get_or_create(
            recipient=issue.assignee,
            workspace=issue.project.workspace,
            issue=issue,
            notification_type=(
                Notification.NotificationType.DUE_DATE_REMINDER
            ),
            reminder_for_date=issue.due_date,
            defaults={
                "message": message
            }
        )

        if created:
            created_count += 1

    return {
        "checked_date": str(today),
        "checked_issues": issues.count(),
        "reminders_created": created_count
    }

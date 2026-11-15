
import os
import ssl

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")

app.config_from_object("django.conf:settings", namespace="CELERY")

# Verify Redis TLS certificates
app.conf.broker_use_ssl = {
    "ssl_cert_reqs": ssl.CERT_REQUIRED
}

app.autodiscover_tasks()

app.conf.timezone = "Asia/Kolkata"

app.conf.beat_schedule = {
    "send-due-date-reminders-daily": {
        "task": "projects.tasks.send_due_date_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
}

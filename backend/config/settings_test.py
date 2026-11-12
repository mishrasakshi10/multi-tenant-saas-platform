
from .settings import *

# Use SQLite only for automated testing.
# The actual Neon PostgreSQL database remains untouched.

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "test_db.sqlite3",
    }
}

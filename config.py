"""Depta settings. Override with environment variables."""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()        # Depta's OWN database (Supabase/Postgres). Empty = local SQLite file.
TIMEZONE = os.environ.get("PV_TZ", "Africa/Nairobi")
DB_PATH = os.environ.get("DEPTA_DB", os.path.join(BASE, "instance", "depta.db"))
CURRENCY = os.environ.get("PV_CURRENCY", "KES")
PUBLIC_URL = os.environ.get("DEPTA_URL", "").strip().rstrip("/")  # this app's own web address (used when connecting to CTone)
CTONE_URL = os.environ.get("CTONE_URL", "").strip().rstrip("/")   # optional: pre-fills the CTone address in "Connect to CTone"
ALLOW_LOCAL = os.environ.get("DEPTA_ALLOW_LOCAL", "0") == "1"      # testing only: allow connecting to localhost / private addresses

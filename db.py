"""Depta's own database layer.
 - DATABASE_URL set  -> Supabase / PostgreSQL (permanent, lives outside Render)
 - not set           -> local SQLite file (handy for testing on your own computer)
Everything else in the app uses only q() and x(), so it does not care which one is running."""
import os, secrets, sqlite3, threading
from contextlib import contextmanager
from flask import g
import config

PG = bool(config.DATABASE_URL)
BACKEND = "postgres" if PG else "sqlite"
_pool, _ready, _lock = None, False, threading.Lock()

TABLES = ["dp_users", "dp_shops", "dp_app", "dp_outbox", "dp_debtors", "dp_debts", "dp_payments", "dp_followups", "dp_settings"]
SCHEMA = """
CREATE TABLE IF NOT EXISTS dp_users(
  id {PK}, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT DEFAULT '', password_hash TEXT NOT NULL,
  shop_id BIGINT, status TEXT NOT NULL DEFAULT 'active', created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_shops(
  id {PK}, name TEXT NOT NULL, currency TEXT NOT NULL, branches TEXT NOT NULL DEFAULT '["Main"]', status TEXT NOT NULL DEFAULT 'active', created_at BIGINT NOT NULL,
  ctone_url TEXT DEFAULT '', ctone_key TEXT DEFAULT '', ctone_shop BIGINT DEFAULT 0, ctone_name TEXT DEFAULT '', ctone_at BIGINT DEFAULT 0,
  sync_summary INTEGER DEFAULT 1, sync_pay INTEGER DEFAULT 1, last_sync BIGINT DEFAULT 0, last_msg TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS dp_app(name TEXT PRIMARY KEY, val TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_outbox(id {PK}, shop_id BIGINT NOT NULL, kind TEXT DEFAULT 'pay', payload TEXT NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_debtors(
  id {PK}, shop_id BIGINT NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', phone2 TEXT DEFAULT '', address TEXT DEFAULT '',
  id_no TEXT DEFAULT '', guarantor TEXT DEFAULT '', guarantor_phone TEXT DEFAULT '', credit_limit {REAL} DEFAULT 0,
  tag TEXT DEFAULT '', note TEXT DEFAULT '', blocked INTEGER DEFAULT 0, archived INTEGER DEFAULT 0, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_debts(
  id {PK}, shop_id BIGINT NOT NULL, debtor_id BIGINT NOT NULL, title TEXT DEFAULT '', principal {REAL} NOT NULL,
  interest_pct {REAL} DEFAULT 0, late_pct {REAL} DEFAULT 0, charges {REAL} DEFAULT 0, forgiven {REAL} DEFAULT 0, written_off {REAL} DEFAULT 0,
  given_at TEXT NOT NULL, due_at TEXT NOT NULL, plan TEXT DEFAULT '[]', collateral TEXT DEFAULT '', ref TEXT DEFAULT '',
  branch TEXT DEFAULT '', note TEXT DEFAULT '', status TEXT DEFAULT 'open', closed_note TEXT DEFAULT '',
  created_at BIGINT NOT NULL, closed_at BIGINT DEFAULT 0);
CREATE TABLE IF NOT EXISTS dp_payments(
  id {PK}, shop_id BIGINT NOT NULL, debt_id BIGINT NOT NULL, debtor_id BIGINT NOT NULL, amount {REAL} NOT NULL,
  method TEXT DEFAULT 'cash', ref TEXT DEFAULT '', note TEXT DEFAULT '', day TEXT NOT NULL, paid_at BIGINT NOT NULL,
  status TEXT DEFAULT 'ok', receipt TEXT DEFAULT '', verified TEXT DEFAULT '', created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_followups(
  id {PK}, shop_id BIGINT NOT NULL, debtor_id BIGINT NOT NULL, debt_id BIGINT DEFAULT 0, kind TEXT DEFAULT 'note', note TEXT DEFAULT '',
  promise_date TEXT DEFAULT '', promise_amount {REAL} DEFAULT 0, next_at TEXT DEFAULT '', done INTEGER DEFAULT 0, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS dp_settings(shop_id BIGINT PRIMARY KEY, data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS ix_dp_debts_shop ON dp_debts(shop_id, status);
CREATE INDEX IF NOT EXISTS ix_dp_pay_shop ON dp_payments(shop_id, day);
CREATE INDEX IF NOT EXISTS ix_dp_pay_debt ON dp_payments(debt_id);
CREATE INDEX IF NOT EXISTS ix_dp_debtors_shop ON dp_debtors(shop_id);
CREATE INDEX IF NOT EXISTS ix_dp_fu_shop ON dp_followups(shop_id, debtor_id)
"""

class Conn:
    """Same q()/x() calls for both databases."""
    def __init__(self, raw): self.raw = raw
    @staticmethod
    def _s(sql): return sql.replace("?", "%s") if PG else sql
    def q(self, sql, args=(), one=False):
        cur = self.raw.execute(self._s(sql), tuple(args)); rows = cur.fetchall(); cur.close()
        return (rows[0] if rows else None) if one else rows
    def x(self, sql, args=(), ret=True):
        s = self._s(sql); ins = ret and s.lstrip().upper().startswith("INSERT")
        try:
            if PG:
                cur = self.raw.execute(s + (" RETURNING id" if ins else ""), tuple(args))
                row = cur.fetchone() if ins else None; rid = row["id"] if row else None
            else:
                cur = self.raw.execute(s, tuple(args)); rid = cur.lastrowid if ins else None
            self.raw.commit(); return rid
        except Exception:
            self.raw.rollback(); raise

    def n(self, sql, args=()):
        """Run an UPDATE/DELETE and return how many rows it changed (used for race-free 'claim once' updates)."""
        try:
            cur = self.raw.execute(self._s(sql), tuple(args)); k = cur.rowcount; self.raw.commit(); return k
        except Exception:
            self.raw.rollback(); raise

def _sqlite():
    c = sqlite3.connect(config.DB_PATH, timeout=15)
    c.row_factory = sqlite3.Row; c.execute("PRAGMA journal_mode=WAL"); return c

@contextmanager
def session():
    """A connection outside of a web request (startup jobs)."""
    c = Conn(_pool.getconn() if PG else _sqlite())
    try: yield c
    finally: _pool.putconn(c.raw) if PG else c.raw.close()

def get():
    if "db" not in g: g.db = Conn(_pool.getconn() if PG else _sqlite())
    return g.db

def close(_=None):
    d = g.pop("db", None)
    if d: _pool.putconn(d.raw) if PG else d.raw.close()

def q(*a, **k): return get().q(*a, **k)
def x(*a, **k): return get().x(*a, **k)
def n(*a, **k): return get().n(*a, **k)

def init():
    """Connect and create the tables if they don't exist yet (safe to run every start)."""
    global _pool, _ready
    with _lock:
        if _ready: return
        if PG:
            from psycopg.rows import dict_row
            from psycopg_pool import ConnectionPool
            kw = {"row_factory": dict_row, "prepare_threshold": None, "connect_timeout": 15}   # works with Supabase poolers
            if "sslmode" not in config.DATABASE_URL: kw["sslmode"] = "require"
            _pool = ConnectionPool(config.DATABASE_URL, min_size=1, max_size=int(os.environ.get("PV_POOL", 8)), kwargs=kw,
                                   open=False, check=ConnectionPool.check_connection, name="depta")
            try: _pool.open(wait=True, timeout=30)
            except Exception as e:
                print("\n  !! Could not connect to Supabase. Check DATABASE_URL: use the *Session pooler* string, with your real\n"
                      "  !! password (letters/numbers only) in place of [YOUR-PASSWORD], no brackets.\n  !! Error:", e, "\n"); raise
        else:
            os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
        with session() as c:
            for st in SCHEMA.format(PK="BIGSERIAL PRIMARY KEY" if PG else "INTEGER PRIMARY KEY AUTOINCREMENT",
                                    REAL="DOUBLE PRECISION" if PG else "REAL").split(";\n"):
                if st.strip(): c.x(st, ret=False)
            if PG:   # lock the tables against Supabase's public API: only this server (direct login) can read them
                for t in TABLES: c.x(f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY", ret=False)
        _ready = True

def secret_key():
    """Login-cookie signing key, kept in the database so users stay signed in across restarts."""
    if os.environ.get("PV_SECRET_KEY"): return os.environ["PV_SECRET_KEY"]
    with session() as c:
        r = c.q("SELECT val FROM dp_app WHERE name='secret_key'", one=True)
        if not r:
            c.x("INSERT INTO dp_app(name,val) VALUES('secret_key',?) ON CONFLICT (name) DO NOTHING", (secrets.token_hex(32),), ret=False)
            r = c.q("SELECT val FROM dp_app WHERE name='secret_key'", one=True)
        return r["val"]

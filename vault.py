"""Keeps the CTone connection key encrypted in the database."""
import base64, hashlib, json, os
import db

_f = None
def _fernet():
    global _f
    if _f is None:
        from cryptography.fernet import Fernet
        k = os.environ.get("DEPTA_VAULT_KEY") or db.secret_key()
        _f = Fernet(base64.urlsafe_b64encode(hashlib.sha256(("depta-vault:" + k).encode()).digest()))
    return _f
def seal(d): return _fernet().encrypt(json.dumps(d).encode()).decode()
def unseal(t):
    try: return json.loads(_fernet().decrypt((t or "").encode()).decode())
    except Exception: return {}

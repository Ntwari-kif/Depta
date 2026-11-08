"""One-tap sign-in links between Depta and CTone (used by both apps).
A link is signed with the secret key the two apps share after you connect them. It works once, within 2 minutes."""
import base64, hashlib, hmac, json, secrets, time

_used = {}

def make(key, shop_id, to):
    body = base64.urlsafe_b64encode(json.dumps({"s": int(shop_id), "to": to, "ts": int(time.time()), "n": secrets.token_hex(6)}).encode()).decode().rstrip("=")
    return body + "." + hmac.new(key.encode(), body.encode(), hashlib.sha256).hexdigest()

def read(key, token, shop_id, to):
    try:
        body, sig = (token or "").split(".", 1)
        if not hmac.compare_digest(sig, hmac.new(key.encode(), body.encode(), hashlib.sha256).hexdigest()): return False
        d = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
    except Exception: return False
    now = time.time()
    for k in [k for k, t in _used.items() if now - t > 300]: _used.pop(k, None)
    if d.get("to") != to or d.get("s") != int(shop_id) or now - d.get("ts", 0) > 120 or d.get("n") in _used: return False
    _used[d["n"]] = now
    return True

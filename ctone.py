"""Talks to CTone (only used when the owner connects the two apps)."""
import ipaddress, json, socket, urllib.error, urllib.parse, urllib.request
import config

class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
_open = urllib.request.build_opener(_NoRedirect).open

def check_url(url):
    u = urllib.parse.urlparse(url or "")
    if u.scheme not in ("http", "https") or not u.hostname: return "Enter the CTone address, e.g. https://your-ctone.onrender.com"
    if (url or "").rstrip("/") == config.CTONE_URL or config.ALLOW_LOCAL: return ""
    try:
        for a in socket.getaddrinfo(u.hostname, None):
            ip = ipaddress.ip_address(a[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast: return "That address isn't allowed."
    except (OSError, ValueError): return "Couldn't find that address."
    return ""

def call(base, path, body, headers=None, timeout=8):
    req = urllib.request.Request(base.rstrip("/") + path, data=json.dumps(body).encode(), method="POST",
                                 headers=dict({"Content-Type": "application/json", "User-Agent": "Depta"}, **(headers or {})))
    try:
        with _open(req, timeout=timeout) as r: return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b"{}")
        except ValueError: return e.code, {}
    except Exception as e: return 0, {"error": "Couldn't reach CTone (" + str(e)[:60] + ")"}

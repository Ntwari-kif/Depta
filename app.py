"""Depta – debt collection for shops. A separate app with its own accounts and database (CTone link is optional).
Run:  python app.py        (then open http://localhost:5001)
"""
import csv, io, json, os, re, secrets, threading, time, calendar, datetime as dt
from functools import wraps
from flask import Flask, Response, abort, g, jsonify, redirect, render_template, request, send_from_directory, session
from jinja2 import ChoiceLoader, FileSystemLoader
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash
import config, db, sms, linkup, vault, ctone
from depta_core import num, pdate, add_months, r2, DEF_TPL, DEF, get_set, total_of, schedule_of, calc, BUCKETS, bucket, summary

os.environ["TZ"] = config.TIMEZONE
if hasattr(time, "tzset"): time.tzset()

app = Flask(__name__, static_folder=None)
app.jinja_loader = ChoiceLoader([FileSystemLoader(os.path.join(config.BASE, "templates")), FileSystemLoader(config.BASE)])
ASSETS = {"style.css", "common.js", "depta.js", "i18n.js", "theme.js", "pwa.js", "icon-192.png", "icon-512.png", "icon-maskable.png"}

def _find(name):
    for d in (os.path.join(config.BASE, "static"), config.BASE):
        if os.path.exists(os.path.join(d, name)): return d
    abort(404)

@app.get("/static/<filename>", endpoint="static")
def assets(filename):
    if filename not in ASSETS: abort(404)
    return send_from_directory(_find(filename), filename, max_age=0)

@app.get("/sw.js")
def service_worker():
    r = send_from_directory(_find("sw.js"), "sw.js", mimetype="application/javascript", max_age=0)
    r.headers["Service-Worker-Allowed"] = "/"; return r

@app.get("/manifest.webmanifest", endpoint="manifest")
def manifest():
    icon = lambda f, s, p: {"src": "/static/" + f, "sizes": f"{s}x{s}", "type": "image/png", "purpose": p}
    m = {"name": "Depta – Debt Collector", "short_name": "Depta", "description": "Record, track and collect your shop's debts.",
         "id": "/", "start_url": "/", "scope": "/", "display": "standalone", "orientation": "portrait",
         "background_color": "#f3f8f2", "theme_color": "#0a1a3f",
         "icons": [icon("icon-192.png", 192, "any"), icon("icon-512.png", 512, "any"), icon("icon-maskable.png", 512, "maskable")]}
    return Response(json.dumps(m), mimetype="application/manifest+json")

@app.get("/offline")
def offline(): return render_template("offline.html")

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
db.init()
app.secret_key = db.secret_key()
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax", SESSION_COOKIE_SECURE=bool(os.environ.get("RENDER")),
                  PERMANENT_SESSION_LIFETIME=dt.timedelta(days=30))
app.teardown_appcontext(db.close)

DAY = 86400000
now_ms = lambda: int(time.time() * 1000)
err = lambda m, code=400: (jsonify(error=m), code)
today = lambda: dt.date.today()
def clean(v, n=120): return (v or "").strip()[:n]
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ============================================================ settings (per shop)
def save_set(sid, d):
    cur = get_set(sid); new = {}
    for k in ("grace_days", "due_days", "due_soon_days", "remind_gap_days"): new[k] = int(num(d.get(k), cur[k], 0, 3650))
    for k in ("late_pct", "interest_pct"): new[k] = num(d.get(k), cur[k], 0, 1000)
    new["late_cap_pct"] = num(d.get("late_cap_pct"), cur["late_cap_pct"], 0, 1000)
    new["cc"] = re.sub(r"\D", "", d.get("cc") or "")[:4]
    for k, n in (("pay_info", 200), ("biz_phone", 30), ("receipt_footer", 160)): new[k] = clean(d.get(k), n)
    tpl = {k: clean(v, 400) for k, v in (d.get("tpl") or {}).items() if k in DEF_TPL and clean(v, 400)}
    new["tpl"] = {k: v for k, v in tpl.items() if v != DEF_TPL[k]}
    db.x("INSERT INTO dp_settings(shop_id,data) VALUES(?,?) ON CONFLICT (shop_id) DO UPDATE SET data=EXCLUDED.data", (sid, json.dumps(new)), ret=False)

def promise_outcome(f, pays, td):
    """kept / broken / pending – worked out from the payments made after the promise."""
    if f["kind"] != "promise": return ""
    got = sum(p["amount"] for p in pays if p["paid_at"] >= f["created_at"] and ((f["debt_id"] and p["debt_id"] == f["debt_id"]) or (not f["debt_id"] and p["debtor_id"] == f["debtor_id"])))
    need = f["promise_amount"] or 0.01
    if got >= need - 0.005: return "kept"
    pd_ = pdate(f["promise_date"])
    return "broken" if pd_ and pd_ < td else "pending"

# ============================================================ building the whole picture for one shop
def build(shop):
    sid = shop["id"]; S = get_set(sid); td = today(); tds = td.isoformat(); cur = shop["currency"]
    debtors = {r["id"]: dict(r) for r in db.q("SELECT * FROM dp_debtors WHERE shop_id=? AND archived=0", (sid,))}
    paid_by = {r["debt_id"]: r["t"] for r in db.q("SELECT debt_id, SUM(amount) t FROM dp_payments WHERE shop_id=? AND status='ok' GROUP BY debt_id", (sid,))}
    since = int((time.time() - 400 * 86400) * 1000)
    pays = [dict(r) for r in db.q("SELECT id,debt_id,debtor_id,amount,method,ref,note,day,paid_at,status,receipt,verified FROM dp_payments WHERE shop_id=? AND paid_at>=? ORDER BY paid_at DESC, id DESC", (sid, since))]
    fus = [dict(r) for r in db.q("SELECT * FROM dp_followups WHERE shop_id=? ORDER BY created_at DESC, id DESC LIMIT 500", (sid,))]
    okpays = [p for p in pays if p["status"] == "ok"]
    debts, by_debtor = [], {}
    for r in db.q("SELECT * FROM dp_debts WHERE shop_id=? ORDER BY created_at DESC", (sid,)):
        d = dict(r)
        if d["debtor_id"] not in debtors: continue
        c = calc(d, paid_by.get(d["id"], 0.0) or 0.0, S, td); o = debtors[d["debtor_id"]]
        d.update(c); d["name"] = o["name"]; d["phone"] = o["phone"]; d.pop("plan", None); debts.append(d)
        by_debtor.setdefault(d["debtor_id"], []).append(d)
    dby = {d["id"]: d for d in debts}
    for f in fus:
        f["outcome"] = promise_outcome(f, okpays, td); f["name"] = (debtors.get(f["debtor_id"]) or {}).get("name", "")
        f["title"] = (dby.get(f["debt_id"]) or {}).get("title", "")
    broken_by = {}
    for f in fus:
        if f["outcome"] == "broken" and (td - (pdate(f["promise_date"]) or td)).days < 180: broken_by[f["debtor_id"]] = broken_by.get(f["debtor_id"], 0) + 1
    # debtors with totals + a trust score
    out_debtors = []
    for did, o in debtors.items():
        ds = by_debtor.get(did, []); live = [x for x in ds if x["state"] not in ("paid", "written_off", "cancelled")]
        score = 100
        for x in live:
            if x["state"] == "overdue": score -= min(40, 10 + x["days_over"] / 3)
        score -= min(24, 8 * broken_by.get(did, 0)) + min(40, 30 * sum(1 for x in ds if x["state"] == "written_off"))
        score += min(15, 3 * sum(1 for x in ds if x["state"] == "paid")); score = int(max(0, min(100, score)))
        label = "new" if not ds else "good" if score >= 75 else "watch" if score >= 50 else "risky"
        bal = r2(sum(x["balance"] for x in live)); lp = [p["day"] for p in okpays if p["debtor_id"] == did]
        o.update(balance=bal, overdue=r2(sum(x["overdue"] for x in live)), open_n=len(live), lent=r2(sum(x["principal"] for x in ds if x["state"] != "cancelled")),
                 paid=r2(sum(x["paid"] for x in ds)), last_pay=max(lp) if lp else "", score=score, risk=label, broken=broken_by.get(did, 0),
                 last_contact=max([f["created_at"] for f in fus if f["debtor_id"] == did and f["kind"] != "note"] or [0]))
        out_debtors.append(o)
    live_debts = [d for d in debts if d["state"] not in ("paid", "written_off", "cancelled")]
    # dashboard numbers
    month = tds[:7]; wk0 = (td - dt.timedelta(days=6)).isoformat()
    col = lambda f: r2(sum(p["amount"] for p in okpays if f(p)))
    aging = {n: 0.0 for n, _, _ in BUCKETS}
    for d in live_debts:
        aging[bucket(d["days_over"])] += d["overdue"]; aging["current"] += d["balance"] - d["overdue"]
    nxt7 = (td + dt.timedelta(days=7)).isoformat()
    expected = r2(sum(i["left"] for d in live_debts for i in d["schedule"] if i["left"] > 0.005 and tds <= i["due"] <= nxt7))
    tot_paid, tot_lent = sum(d["paid"] for d in debts), sum(d["total"] for d in debts if d["state"] != "cancelled")
    months = {}
    for r in db.q("SELECT substr(given_at,1,7) m, SUM(principal) t FROM dp_debts WHERE shop_id=? AND status!='cancelled' GROUP BY 1", (sid,)): months.setdefault(r["m"], [0, 0])[0] = r["t"]
    for r in db.q("SELECT substr(day,1,7) m, SUM(amount) t FROM dp_payments WHERE shop_id=? AND status='ok' GROUP BY 1", (sid,)): months.setdefault(r["m"], [0, 0])[1] = r["t"]
    mlist = []
    for i in range(5, -1, -1):
        k = add_months(td.replace(day=1), -i).strftime("%Y-%m"); mlist.append({"m": k, "lent": r2(months.get(k, [0, 0])[0]), "paid": r2(months.get(k, [0, 0])[1])})
    kpis = dict(outstanding=r2(sum(d["balance"] for d in live_debts)), overdue=r2(sum(d["overdue"] for d in live_debts)),
                overdue_n=sum(d["state"] == "overdue" for d in live_debts), due_today=r2(sum(d["due_today"] for d in live_debts)),
                due_today_n=sum(d["state"] == "due_today" for d in live_debts), today=col(lambda p: p["day"] == tds), week=col(lambda p: p["day"] >= wk0),
                month=col(lambda p: p["day"][:7] == month), lent_month=r2(sum(d["principal"] for d in debts if d["given_at"][:7] == month and d["state"] != "cancelled")),
                recovery=round(100 * tot_paid / tot_lent, 1) if tot_lent else 0, debtors_owing=sum(1 for o in out_debtors if o["balance"] > 0.005),
                written_off=r2(sum(d["written_off"] for d in debts)), expected7=expected, active_debts=len(live_debts))
    # what to do today
    prom = [f for f in fus if f["kind"] == "promise" and f["outcome"] == "pending" and f["promise_date"] <= tds]
    broken = [f for f in fus if f["outcome"] == "broken" and (td - (pdate(f["promise_date"]) or td)).days <= 7]
    nexts = [f for f in fus if f["next_at"] and not f["done"] and f["next_at"] <= tds]
    prio = sorted([d for d in live_debts if d["state"] in ("overdue", "due_today")], key=lambda d: -(d["days_over"] * 500 + d["balance"] / 100 + (3000 if d["state"] == "due_today" else 0)))
    todo = dict(queue=[d["id"] for d in prio], promises=[f["id"] for f in prom], broken=[f["id"] for f in broken], follow=[f["id"] for f in nexts],
                soon=[d["id"] for d in live_debts if d["state"] == "due_soon"])
    names = {o["id"]: o["name"] for o in out_debtors}
    for p in pays:
        p["name"] = names.get(p["debtor_id"], ""); p["title"] = (dby.get(p["debt_id"]) or {}).get("title", "")
    return dict(settings=S, today=tds, currency=cur, debtors=sorted(out_debtors, key=lambda o: o["name"].lower()), debts=debts, payments=pays[:400], followups=fus,
                kpis=kpis, aging=[{"k": k, "v": r2(v)} for k, v in aging.items()], months=mlist, todo=todo)

# ============================================================ auth + pages
def shop_block(shop):
    return "This shop was suspended." if shop["status"] == "suspended" else ""

def auth(f):
    @wraps(f)
    def w(*a, **k):
        u = db.q("SELECT * FROM dp_users WHERE id=?", (session.get("uid"),), one=True) if session.get("uid") else None
        if not u: return err("Please sign in again.", 401)
        if u["status"] == "disabled": session.clear(); return err("This account is disabled.", 401)
        shop = db.q("SELECT * FROM dp_shops WHERE id=?", (u["shop_id"],), one=True)
        if not shop: return err("Shop not found.", 404)
        if shop_block(shop): return err(shop_block(shop), 402)
        g.user, g.shop = u, shop
        return f(*a, **k)
    return w

@app.errorhandler(Exception)
def on_error(e):
    if isinstance(e, HTTPException): return e
    app.logger.exception(e)
    return err("Server error. Please try again.", 500) if request.path.startswith("/api/") else ("Server error", 500)

def me():
    return db.q("SELECT * FROM dp_users WHERE id=?", (session.get("uid"),), one=True) if session.get("uid") else None

@app.get("/")
def home():
    return render_template("app.html") if me() else redirect("/login")
@app.get("/login")
def p_login(): return render_template("login.html", ctone_default=config.CTONE_URL)
@app.get("/register")
def p_register(): return render_template("register.html", currency=config.CURRENCY)

FAILS = {}
def throttled(key):
    t = time.time(); FAILS[key] = [x for x in FAILS.get(key, []) if t - x < 600]; return len(FAILS[key]) >= 8

def self_url(): return config.PUBLIC_URL or request.host_url.rstrip("/")

def link_shop(shop, url, email, pw):
    """Connect this shop to a CTone shop (asks CTone to confirm the owner's email + password). Returns an error text or ''."""
    bad = ctone.check_url(url)
    if bad: return bad
    st, j = ctone.call(url, "/api/depta/connect", {"email": email, "password": pw, "depta_url": self_url(), "depta_shop": shop["id"]})
    if st != 200 or not j.get("ok"): return j.get("error") or "Couldn't connect to CTone."
    db.x("UPDATE dp_shops SET ctone_url=?, ctone_key=?, ctone_shop=?, ctone_name=?, ctone_at=?, last_msg='' WHERE id=?",
         (url, vault.seal({"k": j["key"]}), j["ctone_shop"], j["shop"], now_ms(), shop["id"]), ret=False)
    return ""

def ctone_login(url, email, pw, u):
    """Sign in with a CTone account: Depta creates (or refreshes) the matching Depta account."""
    bad = ctone.check_url(url)
    if bad: return None, bad
    st, j = ctone.call(url, "/api/depta/connect", {"email": email, "password": pw, "verify_only": True})
    if st != 200 or not j.get("ok"): return None, j.get("error") or "Wrong email or password."
    if u:
        db.x("UPDATE dp_users SET password_hash=? WHERE id=?", (generate_password_hash(pw), u["id"]), ret=False)
        return u, ""
    uid = db.x("INSERT INTO dp_users(name,email,phone,password_hash,shop_id,status,created_at) VALUES(?,?,?,?,?,?,?)",
               (clean(j.get("name")) or email, email, clean(j.get("phone"), 30), generate_password_hash(pw), None, "active", now_ms()))
    sid = db.x("INSERT INTO dp_shops(name,currency,branches,created_at) VALUES(?,?,?,?)",
               (clean(j.get("shop")) or "My shop", clean(j.get("currency"), 4) or config.CURRENCY, json.dumps(j.get("branches") or ["Main"]), now_ms()))
    db.x("UPDATE dp_users SET shop_id=? WHERE id=?", (sid, uid), ret=False)
    link_shop(db.q("SELECT * FROM dp_shops WHERE id=?", (sid,), one=True), url, email, pw)
    return db.q("SELECT * FROM dp_users WHERE id=?", (uid,), one=True), ""

@app.post("/api/login")
def login():
    d = request.get_json(silent=True) or {}
    email, pw, key = clean(d.get("email")).lower(), d.get("password") or "", f"{request.remote_addr}|{clean(d.get('email')).lower()}"
    if throttled(key): return err("Too many attempts. Try again in 10 minutes.", 429)
    u = db.q("SELECT * FROM dp_users WHERE email=?", (email,), one=True)
    ok, msg = bool(u and check_password_hash(u["password_hash"], pw)), ""
    if not ok:
        url = clean(d.get("ctone_url"), 200).rstrip("/") or config.CTONE_URL
        sh = db.q("SELECT ctone_key FROM dp_shops WHERE id=?", (u["shop_id"],), one=True) if u else None
        if url and EMAIL.match(email) and (not u or (sh and sh["ctone_key"])):      # new person, or an account already linked to CTone
            u2, msg = ctone_login(url, email, pw, u)
            if u2: u, ok = u2, True
    if not ok:
        FAILS.setdefault(key, []).append(time.time()); return err(msg or "Wrong email or password.", 401)
    if u["status"] == "disabled": return err("This account is disabled.", 403)
    session.clear(); session["uid"] = u["id"]; session.permanent = True
    return jsonify(ok=True, redirect="/")

@app.post("/api/register")
def register():
    d = request.get_json(silent=True) or {}
    sname, name, email, pw = clean(d.get("shop_name")), clean(d.get("name")), clean(d.get("email")).lower(), d.get("password") or ""
    if not sname: return err("Enter your shop name.")
    if not name: return err("Enter your name.")
    if not EMAIL.match(email): return err("Enter a valid email.")
    if len(pw) < 6: return err("Password must be at least 6 characters.")
    if db.q("SELECT 1 FROM dp_users WHERE email=?", (email,), one=True): return err("That email is already registered. Sign in instead.")
    uid = db.x("INSERT INTO dp_users(name,email,phone,password_hash,shop_id,status,created_at) VALUES(?,?,?,?,?,?,?)",
               (name, email, clean(d.get("phone"), 30), generate_password_hash(pw), None, "active", now_ms()))
    sid = db.x("INSERT INTO dp_shops(name,currency,branches,created_at) VALUES(?,?,?,?)",
               (sname, (clean(d.get("currency"), 4) or config.CURRENCY).upper(), json.dumps(["Main"]), now_ms()))
    db.x("UPDATE dp_users SET shop_id=? WHERE id=?", (sid, uid), ret=False)
    session.clear(); session["uid"] = uid; session.permanent = True
    return jsonify(ok=True, redirect="/")

@app.post("/api/logout")
def logout(): session.clear(); return jsonify(ok=True)

@app.post("/api/password")
@auth
def change_pw():
    d = request.get_json(silent=True) or {}
    if not check_password_hash(g.user["password_hash"], d.get("old") or ""): return err("Current password is wrong.")
    if len(d.get("new") or "") < 6: return err("New password must be at least 6 characters.")
    db.x("UPDATE dp_users SET password_hash=? WHERE id=?", (generate_password_hash(d["new"]), g.user["id"]), ret=False)
    return jsonify(ok=True)

# ============================================================ optional link with CTone
def ckey(shop): return vault.unseal(shop["ctone_key"]).get("k", "") if shop["ctone_key"] else ""

def sync_now(sh):
    """Send waiting repayments + a fresh summary to CTone. Failures just wait for the next try."""
    key = ckey(sh)
    if not key: return
    pays = [(r["id"], json.loads(r["payload"])) for r in db.q("SELECT * FROM dp_outbox WHERE shop_id=? ORDER BY id LIMIT 200", (sh["id"],))]
    body = {"payments": [p for _, p in pays], "summary": summary(sh) if sh["sync_summary"] else None}
    st, j = ctone.call(sh["ctone_url"], "/api/depta/push", body, {"X-Depta-Shop": str(sh["ctone_shop"]), "X-Depta-Key": key})
    if st == 200 and j.get("ok"):
        for i, _ in pays: db.x("DELETE FROM dp_outbox WHERE id=?", (i,), ret=False)
        db.x("UPDATE dp_shops SET last_sync=?, last_msg='' WHERE id=?", (now_ms(), sh["id"]), ret=False)
    else:
        msg = "CTone no longer accepts this link – disconnect and connect again." if st in (401, 403) else (j.get("error") or "CTone is not reachable right now – will retry.")
        db.x("UPDATE dp_shops SET last_msg=? WHERE id=?", (msg[:160], sh["id"]), ret=False)

_last, _pend = {}, set()
def sync_bg(sid, every=0):
    """Send to CTone in the background. A burst of changes is combined into one final update."""
    t = time.time(); wait = max(2, every) - (t - _last.get(sid, 0))
    if wait > 0:
        if not every and sid not in _pend:
            _pend.add(sid); threading.Timer(wait + 0.2, lambda: (_pend.discard(sid), sync_bg(sid))).start()
        return
    _last[sid] = t
    def run():
        with app.app_context():
            try:
                sh = db.q("SELECT * FROM dp_shops WHERE id=?", (sid,), one=True)
                if sh and sh["ctone_key"]: sync_now(sh)
            except Exception: app.logger.exception("CTone sync")
    threading.Thread(target=run, daemon=True).start()

@app.after_request
def push_changes(resp):
    sh = g.get("shop")
    if sh is not None and sh["ctone_key"] and request.method == "POST" and resp.status_code == 200 and request.path.startswith(("/api/debt", "/api/debtor", "/api/payment")):
        sync_bg(sh["id"])
    return resp

def queue_pay(pid, debtor, debt, amount, method, ref, day, void=False):
    sh = g.shop
    if not (sh["ctone_key"] and sh["sync_pay"]): return
    db.x("INSERT INTO dp_outbox(shop_id,kind,payload,created_at) VALUES(?,?,?,?)", (sh["id"], "pay", json.dumps(
        {"id": pid, "void": void, "amount": amount, "method": method, "ref": ref, "payer": debtor["name"] if debtor else "", "phone": debtor["phone"] if debtor else "",
         "title": debt["title"] if debt else "", "day": day}), now_ms()), ret=False)

@app.post("/api/ctone/connect")
@auth
def ct_connect():
    d = request.get_json(silent=True) or {}; url = clean(d.get("url"), 200).rstrip("/")
    key = f"c|{request.remote_addr}"
    if throttled(key): return err("Too many attempts. Try again in 10 minutes.", 429)
    e = link_shop(g.shop, url, clean(d.get("email")).lower(), d.get("password") or "")
    if e: FAILS.setdefault(key, []).append(time.time()); return err(e)
    sync_now(db.q("SELECT * FROM dp_shops WHERE id=?", (g.shop["id"],), one=True))
    return jsonify(ok=True)

@app.post("/api/ctone/settings")
@auth
def ct_settings():
    d = request.get_json(silent=True) or {}
    db.x("UPDATE dp_shops SET sync_summary=?, sync_pay=? WHERE id=?", (1 if d.get("summary") else 0, 1 if d.get("pay") else 0, g.shop["id"]), ret=False)
    sync_bg(g.shop["id"]); return jsonify(ok=True)

@app.post("/api/ctone/sync")
@auth
def ct_sync():
    if not g.shop["ctone_key"]: return err("Not connected to CTone.")
    sync_now(g.shop); sh = db.q("SELECT last_msg FROM dp_shops WHERE id=?", (g.shop["id"],), one=True)
    return err(sh["last_msg"]) if sh["last_msg"] else jsonify(ok=True)

@app.post("/api/ctone/disconnect")
@auth
def ct_off():
    sh = g.shop
    if sh["ctone_key"]: ctone.call(sh["ctone_url"], "/api/depta/disconnect", {}, {"X-Depta-Shop": str(sh["ctone_shop"]), "X-Depta-Key": ckey(sh)}, timeout=5)
    db.x("UPDATE dp_shops SET ctone_url='', ctone_key='', ctone_shop=0, ctone_name='', ctone_at=0, last_msg='' WHERE id=?", (sh["id"],), ret=False)
    db.x("DELETE FROM dp_outbox WHERE shop_id=?", (sh["id"],), ret=False)
    return jsonify(ok=True)

@app.post("/api/ctone/link")
@auth
def to_ctone():
    sh = g.shop
    if not sh["ctone_key"]: return err("Connect to CTone first (Settings).")
    return jsonify(url=f"{sh['ctone_url']}/sso?s={sh['ctone_shop']}&t={linkup.make(ckey(sh), sh['ctone_shop'], 'ctone')}")

@app.get("/sso")
def sso():
    """CTone sends its owner here (signed link) -> signed in to the linked Depta account."""
    try: sid = int(request.args.get("s") or 0)
    except ValueError: sid = 0
    sh = db.q("SELECT * FROM dp_shops WHERE id=?", (sid,), one=True) if sid else None
    if not sh or not sh["ctone_key"] or not linkup.read(ckey(sh), request.args.get("t"), sid, "depta"): return redirect("/login")
    u = db.q("SELECT * FROM dp_users WHERE shop_id=? ORDER BY id LIMIT 1", (sid,), one=True)
    if not u or u["status"] == "disabled": return redirect("/login")
    session.clear(); session["uid"] = u["id"]; session.permanent = True
    return redirect("/")

# ============================================================ data
@app.get("/api/data")
@auth
def data():
    out = build(g.shop); sh = g.shop
    out.update(user={"name": g.user["name"], "email": g.user["email"]}, shop={"name": sh["name"], "branches": json.loads(sh["branches"]), "currency": sh["currency"]},
               ctone={"linked": bool(sh["ctone_key"]), "name": sh["ctone_name"], "last_sync": sh["last_sync"], "last_msg": sh["last_msg"], "sync_summary": bool(sh["sync_summary"]),
                      "sync_pay": bool(sh["sync_pay"]), "default_url": config.CTONE_URL})
    if sh["ctone_key"]: sync_bg(sh["id"], 90)
    return jsonify(out)

# ---------------------------------------------------------------- debtors
def own_debtor(did):
    return db.q("SELECT * FROM dp_debtors WHERE id=? AND shop_id=?", (did, g.shop["id"]), one=True)

@app.post("/api/debtor")
@auth
def debtor_save():
    d = request.get_json(silent=True) or {}; name = clean(d.get("name"))
    if not name: return err("Enter the customer's name.")
    f = dict(name=name, phone=clean(d.get("phone"), 30), phone2=clean(d.get("phone2"), 30), address=clean(d.get("address"), 160), id_no=clean(d.get("id_no"), 40),
             guarantor=clean(d.get("guarantor"), 80), guarantor_phone=clean(d.get("guarantor_phone"), 30), credit_limit=num(d.get("credit_limit"), 0, 0),
             tag=clean(d.get("tag"), 30), note=clean(d.get("note"), 400))
    if d.get("id"):
        if not own_debtor(d["id"]): return err("Customer not found.", 404)
        db.x(f"UPDATE dp_debtors SET {','.join(k + '=?' for k in f)} WHERE id=?", tuple(f.values()) + (d["id"],), ret=False); return jsonify(ok=True, id=d["id"])
    if f["phone"] and any(re.sub(r"\D", "", r["phone"])[-9:] == re.sub(r"\D", "", f["phone"])[-9:] for r in db.q("SELECT phone FROM dp_debtors WHERE shop_id=? AND archived=0", (g.shop["id"],)) if r["phone"]) and not d.get("force"):
        return jsonify(error="Someone with this phone number is already in your list. Save anyway?", confirm=True), 409
    f.update(shop_id=g.shop["id"], created_at=now_ms())
    return jsonify(ok=True, id=db.x(f"INSERT INTO dp_debtors({','.join(f)}) VALUES({','.join('?' * len(f))})", tuple(f.values())))

@app.post("/api/debtor/<int:did>/<action>")
@auth
def debtor_action(did, action):
    o = own_debtor(did)
    if not o: return err("Customer not found.", 404)
    if action in ("block", "unblock"): db.x("UPDATE dp_debtors SET blocked=? WHERE id=?", (1 if action == "block" else 0, did), ret=False)
    elif action in ("archive", "delete"):
        if db.q("SELECT 1 FROM dp_debts WHERE debtor_id=? AND status='open'", (did,), one=True) and build_balance(did) > 0.005: return err("This customer still owes money. Collect or write off the debt first.")
        if action == "delete" and db.q("SELECT 1 FROM dp_debts WHERE debtor_id=?", (did,), one=True): return err("This customer has debt history, so it can only be archived.")
        if action == "delete": db.x("DELETE FROM dp_debtors WHERE id=?", (did,), ret=False)
        else: db.x("UPDATE dp_debtors SET archived=1 WHERE id=?", (did,), ret=False)
    else: return err("Unknown action.")
    return jsonify(ok=True)

def build_balance(did):
    S = get_set(g.shop["id"]); td = today(); tot = 0.0
    for r in db.q("SELECT * FROM dp_debts WHERE debtor_id=? AND status='open'", (did,)):
        p = db.q("SELECT COALESCE(SUM(amount),0) t FROM dp_payments WHERE debt_id=? AND status='ok'", (r["id"],), one=True)["t"]
        tot += calc(dict(r), p, S, td)["balance"]
    return tot

# ---------------------------------------------------------------- debts
def make_plan(total, n, freq, first):
    if n < 2: return []
    whole = abs(total - round(total)) < 0.005
    each = (total // n) if whole else r2(total / n); out, acc = [], 0.0
    for i in range(n):
        due = first + dt.timedelta(days=7 * i) if freq == "weekly" else first + dt.timedelta(days=14 * i) if freq == "biweekly" else add_months(first, i)
        amt = r2(total - acc) if i == n - 1 else each; acc += amt
        out.append({"due": due.isoformat(), "amount": amt})
    return out

def log_fu(debtor_id, debt_id, kind, note, **k):
    return db.x("INSERT INTO dp_followups(shop_id,debtor_id,debt_id,kind,note,promise_date,promise_amount,next_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                (g.shop["id"], debtor_id, debt_id or 0, kind, clean(note, 400), k.get("promise_date", ""), k.get("promise_amount", 0), k.get("next_at", ""), now_ms()))

@app.post("/api/debt")
@auth
def debt_create():
    d = request.get_json(silent=True) or {}; sid = g.shop["id"]; S = get_set(sid)
    o = own_debtor(d.get("debtor_id"))
    if not o: return err("Pick a customer first.")
    amount = num(d.get("amount"), 0, 0)
    if amount <= 0: return err("Enter the amount owed.")
    td = today(); given = pdate(d.get("given_at")) or td; interest = num(d.get("interest_pct"), S["interest_pct"], 0, 1000); late = num(d.get("late_pct"), S["late_pct"], 0, 1000)
    n = int(num(d.get("installments"), 0, 0, 36)); freq = d.get("freq") if d.get("freq") in ("weekly", "biweekly", "monthly") else "monthly"
    due = pdate(d.get("due_at")) or given + dt.timedelta(days=S["due_days"])
    first = pdate(d.get("first_due")) or due
    total = r2(amount * (1 + interest / 100)); plan = make_plan(total, n, freq, first)
    if plan: due = pdate(plan[0]["due"])
    deposit = num(d.get("deposit"), 0, 0)
    if deposit > total + 0.005: return err("The deposit is more than the total owed.")
    if o["blocked"] and not d.get("force"): return jsonify(error=f"{o['name']} is blocked from new credit. Give credit anyway?", confirm=True), 409
    bal = build_balance(o["id"])
    if o["credit_limit"] > 0 and bal + total - deposit > o["credit_limit"] + 0.005 and not d.get("force"):
        return jsonify(error=f"{o['name']} would owe {g.shop['currency']} {bal + total - deposit:,.0f}, above the credit limit of {g.shop['currency']} {o['credit_limit']:,.0f}. Give credit anyway?", confirm=True), 409
    br = json.loads(g.shop["branches"]); branch = d.get("branch") if d.get("branch") in br else br[0]
    did = db.x("INSERT INTO dp_debts(shop_id,debtor_id,title,principal,interest_pct,late_pct,given_at,due_at,plan,collateral,ref,branch,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
               (sid, o["id"], clean(d.get("title"), 120), amount, interest, late, given.isoformat(), due.isoformat(), json.dumps(plan), clean(d.get("collateral"), 120),
                clean(d.get("ref"), 40), branch, clean(d.get("note"), 400), now_ms()))
    rec = None
    if deposit > 0: rec = add_payment(db.q("SELECT * FROM dp_debts WHERE id=?", (did,), one=True), deposit, d.get("deposit_method") or "cash", "", "Deposit paid when the debt was recorded", None, "", S)
    return jsonify(ok=True, id=did, payment=rec)

def own_debt(did): return db.q("SELECT * FROM dp_debts WHERE id=? AND shop_id=?", (did, g.shop["id"]), one=True)
def debt_calc(r):
    p = db.q("SELECT COALESCE(SUM(amount),0) t FROM dp_payments WHERE debt_id=? AND status='ok'", (r["id"],), one=True)["t"]
    return calc(dict(r), p, get_set(g.shop["id"]), today()), p

@app.post("/api/debt/<int:did>/<action>")
@auth
def debt_action(did, action):
    r = own_debt(did)
    if not r: return err("Debt not found.", 404)
    d = request.get_json(silent=True) or {}; c, paid = debt_calc(r); sid = g.shop["id"]; cur = g.shop["currency"]
    if action == "edit":
        f = dict(title=clean(d.get("title"), 120), note=clean(d.get("note"), 400), collateral=clean(d.get("collateral"), 120), ref=clean(d.get("ref"), 40),
                 late_pct=num(d.get("late_pct"), r["late_pct"], 0, 1000))
        if pdate(d.get("given_at")): f["given_at"] = pdate(d["given_at"]).isoformat()
        br = json.loads(g.shop["branches"])
        if d.get("branch") in br: f["branch"] = d["branch"]
        if paid <= 0:
            if num(d.get("amount"), 0) > 0: f["principal"] = num(d.get("amount"), r["principal"], 0.01)
            f["interest_pct"] = num(d.get("interest_pct"), r["interest_pct"], 0, 1000)
        db.x(f"UPDATE dp_debts SET {','.join(k + '=?' for k in f)} WHERE id=?", tuple(f.values()) + (did,), ret=False)
    elif action == "reschedule":
        nd = pdate(d.get("due_at"))
        if not nd: return err("Pick the new due date.")
        old = pdate(c["next_due"]) or nd; delta = (nd - old).days; plan = json.loads(r["plan"] or "[]")
        if plan:
            for i, row in zip(c["schedule"], plan):
                if i["left"] > 0.005: row["due"] = (pdate(row["due"]) + dt.timedelta(days=delta)).isoformat()
            db.x("UPDATE dp_debts SET plan=?, due_at=? WHERE id=?", (json.dumps(plan), plan[0]["due"], did), ret=False)
        else: db.x("UPDATE dp_debts SET due_at=? WHERE id=?", (nd.isoformat(), did), ret=False)
        log_fu(r["debtor_id"], did, "note", f"Due date moved from {old.isoformat()} to {nd.isoformat()}. {clean(d.get('reason'), 200)}".strip())
    elif action == "charge":
        a = num(d.get("amount"), 0, 0)
        if a <= 0: return err("Enter the extra amount.")
        db.x("UPDATE dp_debts SET charges=charges+? WHERE id=?", (a, did), ret=False)
        log_fu(r["debtor_id"], did, "note", f"Extra charge of {cur} {a:,.0f} added. {clean(d.get('reason'), 200)}".strip())
    elif action == "forgive":
        a = num(d.get("amount"), 0, 0)
        if a <= 0 or a > c["base"] + 0.005: return err(f"Enter an amount up to {cur} {c['base']:,.0f}.")
        db.x("UPDATE dp_debts SET forgiven=forgiven+? WHERE id=?", (a, did), ret=False)
        log_fu(r["debtor_id"], did, "note", f"Discount / forgiven {cur} {a:,.0f}. {clean(d.get('reason'), 200)}".strip())
    elif action == "writeoff":
        if c["base"] <= 0.005: return err("Nothing is owed on this debt.")
        db.x("UPDATE dp_debts SET status='written_off', written_off=?, closed_at=?, closed_note=? WHERE id=?", (c["base"], now_ms(), clean(d.get("reason"), 200), did), ret=False)
        log_fu(r["debtor_id"], did, "note", f"Written off as a loss: {cur} {c['base']:,.0f}. {clean(d.get('reason'), 200)}".strip())
    elif action == "reopen":
        if r["status"] != "written_off": return err("Only written-off debts can be reopened.")
        db.x("UPDATE dp_debts SET status='open', written_off=0, closed_at=0 WHERE id=?", (did,), ret=False)
    elif action == "cancel":
        if paid > 0: return err("This debt already has payments. Void them first, or write it off.")
        db.x("UPDATE dp_debts SET status='cancelled', closed_at=?, closed_note=? WHERE id=?", (now_ms(), clean(d.get("reason"), 200) or "Recorded by mistake", did), ret=False)
    else: return err("Unknown action.")
    return jsonify(ok=True)

# ---------------------------------------------------------------- payments
def add_payment(debt, amount, method, ref, note, day, receipt, S, verified="", group=None):
    method = method if method in ("cash", "mobile", "bank", "card") else "cash"; t = now_ms()
    dd = pdate(day) or today(); receipt = receipt or "R" + str(t)[-8:]
    pid = db.x("INSERT INTO dp_payments(shop_id,debt_id,debtor_id,amount,method,ref,note,day,paid_at,status,receipt,verified,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
               (g.shop["id"], debt["id"], debt["debtor_id"], amount, method, ref, clean(note, 200), dd.isoformat(), t if dd == today() else int(dt.datetime.combine(dd, dt.time(12)).timestamp() * 1000), "ok", receipt, verified, t))
    o = db.q("SELECT * FROM dp_debtors WHERE id=?", (debt["debtor_id"],), one=True)
    queue_pay(pid, o, debt, amount, method, ref, dd.isoformat())
    c, _ = debt_calc(debt)
    return {"id": pid, "receipt": receipt, "amount": amount, "balance": c["balance"], "debt_id": debt["id"], "debtor": o["name"], "phone": o["phone"], "method": method, "day": dd.isoformat()}

def check_ref(method, ref, amount):
    """Mobile-money / bank codes can never be used twice. Returns ("", error, None)."""
    ref = (ref or "").strip().upper()
    if ref and method in ("mobile", "bank") and db.q("SELECT 1 FROM dp_payments WHERE shop_id=? AND ref=? AND status='ok'", (g.shop["id"], ref), one=True):
        return "", "That transaction code was already used for another payment.", None
    return "", None, None

def pay_args(d):
    method = d.get("method") if d.get("method") in ("cash", "mobile", "bank", "card") else "cash"
    amount, ref = num(d.get("amount"), 0, 0), clean(d.get("ref"), 40).upper(); ver = ""
    raw = clean(d.get("sms"), 1000)
    if method == "mobile" and raw:
        p = sms.parse(raw, "Mobile money", extra=shop_templates())
        if p["ok"] and not p["failed"]:
            ref = ref or p["code"]; amount = amount or p["amt"]; ver = "sms"
    return method, amount, ref, ver

def shop_templates(): return []

@app.post("/api/debt/<int:did>/pay")
@auth
def debt_pay(did):
    r = own_debt(did)
    if not r or r["status"] != "open": return err("Debt not found or already closed.", 404)
    d = request.get_json(silent=True) or {}; S = get_set(g.shop["id"]); c, _ = debt_calc(r)
    method, amount, ref, ver = pay_args(d)
    if amount <= 0: return err("Enter the amount received.")
    if amount > c["balance"] + 0.5: return err(f"That is more than the balance ({g.shop['currency']} {c['balance']:,.0f}).")
    tag, e, ct = check_ref(method, ref, amount)
    if e: return err(e)
    out = add_payment(r, amount, method, ref, d.get("note"), d.get("day"), "", S, ver)
    return jsonify(ok=True, **out, shop=g.shop["name"], verified=ver)

@app.post("/api/debtor/<int:did>/pay")
@auth
def debtor_pay(did):
    """One payment from a customer, shared over their debts – oldest due date first."""
    o = own_debtor(did)
    if not o: return err("Customer not found.", 404)
    d = request.get_json(silent=True) or {}; S = get_set(g.shop["id"]); td = today()
    method, amount, ref, ver = pay_args(d)
    if amount <= 0: return err("Enter the amount received.")
    live = []
    for r in db.q("SELECT * FROM dp_debts WHERE debtor_id=? AND shop_id=? AND status='open'", (did, g.shop["id"])):
        c, _ = debt_calc(r)
        if c["balance"] > 0.005: live.append((r, c))
    owed = sum(c["balance"] for _, c in live)
    if not live: return err("This customer owes nothing.")
    if amount > owed + 0.5: return err(f"That is more than the total owed ({g.shop['currency']} {owed:,.0f}).")
    tag, e, ct = check_ref(method, ref, amount)
    if e: return err(e)
    live.sort(key=lambda x: (x[1]["next_due"], x[0]["id"])); left = amount; receipt = "R" + str(now_ms())[-8:]; recs = []
    for r, c in live:
        if left <= 0.004: break
        a = r2(min(left, c["balance"])); left = r2(left - a)
        recs.append(add_payment(r, a, method, ref if not recs else "", d.get("note"), d.get("day"), receipt, S, ver if not recs else ("ctone-part" if ver == "ctone" else ver)))
    return jsonify(ok=True, receipt=receipt, amount=amount, parts=recs, debtor=o["name"], phone=o["phone"], balance=r2(owed - amount), shop=g.shop["name"], method=method, verified=ver)

@app.post("/api/payment/<int:pid>/void")
@auth
def pay_void(pid):
    p = db.q("SELECT * FROM dp_payments WHERE id=? AND shop_id=?", (pid, g.shop["id"]), one=True)
    if not p or p["status"] != "ok": return err("Payment not found.", 404)
    why = clean((request.get_json(silent=True) or {}).get("reason"), 150) or "no reason"
    db.x("UPDATE dp_payments SET status='void', note=? WHERE id=?", ((p["note"] + " · " if p["note"] else "") + "Voided: " + why, pid), ret=False)
    queue_pay(pid, db.q("SELECT * FROM dp_debtors WHERE id=?", (p["debtor_id"],), one=True), None, p["amount"], p["method"], p["ref"], p["day"], void=True)
    return jsonify(ok=True)

@app.post("/api/sms/read")
@auth
def sms_read():
    d = request.get_json(silent=True) or {}
    p = sms.parse(clean(d.get("sms"), 1000), "Mobile money", extra=shop_templates())
    if not p["ok"]: return err(p["why"])
    if p["failed"]: return err("That message says the payment failed.")
    tag, e, ct = check_ref("mobile", p["code"], p["amt"])
    return jsonify(ok=True, amount=p["amt"], code=p["code"], payer=p["payer"], provider=p["prov"], dup=bool(e), ctone=False, warn=e or "")

# ---------------------------------------------------------------- follow-ups
@app.post("/api/followup")
@auth
def fu_create():
    d = request.get_json(silent=True) or {}; o = own_debtor(d.get("debtor_id"))
    if not o: return err("Customer not found.", 404)
    kind = d.get("kind") if d.get("kind") in ("call", "visit", "sms", "whatsapp", "promise", "note") else "note"
    debt_id = d.get("debt_id") or 0
    if debt_id and not own_debt(debt_id): return err("Debt not found.", 404)
    pdt = pdate(d.get("promise_date")); pa = num(d.get("promise_amount"), 0, 0)
    if kind == "promise" and not pdt: return err("Pick the date the customer promised to pay.")
    nxt = pdate(d.get("next_at"))
    log_fu(o["id"], debt_id, kind, d.get("note") or "", promise_date=pdt.isoformat() if pdt else "", promise_amount=pa if kind == "promise" else 0, next_at=nxt.isoformat() if nxt else "")
    return jsonify(ok=True)

@app.post("/api/followup/<int:fid>/done")
@auth
def fu_done(fid):
    db.x("UPDATE dp_followups SET done=1 WHERE id=? AND shop_id=?", (fid, g.shop["id"]), ret=False); return jsonify(ok=True)

@app.post("/api/settings")
@auth
def settings_save(): save_set(g.shop["id"], request.get_json(silent=True) or {}); return jsonify(ok=True)

# ---------------------------------------------------------------- reports + exports
@app.get("/api/report")
@auth
def report():
    td = today(); a = pdate(request.args.get("from")) or td.replace(day=1); b = pdate(request.args.get("to")) or td
    if b < a: a, b = b, a
    sid = g.shop["id"]; A, B = a.isoformat(), b.isoformat()
    pays = [dict(r) for r in db.q("SELECT * FROM dp_payments WHERE shop_id=? AND status='ok' AND day>=? AND day<=?", (sid, A, B))]
    meth, daily = {}, {}
    for p in pays: meth[p["method"]] = meth.get(p["method"], 0) + p["amount"]; daily[p["day"]] = daily.get(p["day"], 0) + p["amount"]
    given = db.q("SELECT COALESCE(SUM(principal),0) t, COUNT(*) n FROM dp_debts WHERE shop_id=? AND status!='cancelled' AND given_at>=? AND given_at<=?", (sid, A, B), one=True)
    wo = db.q("SELECT COALESCE(SUM(written_off),0) t FROM dp_debts WHERE shop_id=? AND status='written_off' AND closed_at>=? AND closed_at<?", (sid, int(dt.datetime.combine(a, dt.time()).timestamp() * 1000), int(dt.datetime.combine(b + dt.timedelta(days=1), dt.time()).timestamp() * 1000)), one=True)
    return jsonify(frm=A, to=B, collected=r2(sum(p["amount"] for p in pays)), payments=len(pays), lent=r2(given["t"]), new_debts=given["n"], written_off=r2(wo["t"]),
                   by_method=[{"k": k, "v": r2(v)} for k, v in sorted(meth.items(), key=lambda x: -x[1])], daily=[{"k": k, "v": r2(v)} for k, v in sorted(daily.items())])

def csv_resp(name, head, rows):
    buf = io.StringIO(); w = csv.writer(buf); w.writerow(head); w.writerows(rows)
    return Response("\ufeff" + buf.getvalue(), mimetype="text/csv", headers={"Content-Disposition": f"attachment; filename={name}-{today().isoformat()}.csv"})

@app.get("/api/export/<kind>")
@auth
def export(kind):
    D = build(g.shop); cur = g.shop["currency"]
    if kind == "debts":
        return csv_resp("depta-debts", ["Customer", "Phone", "Item", "Given", "Due / next due", "Principal", "Interest %", "Total", "Paid", "Balance", "Late fee", "Days overdue", "Status", "Branch", "Collateral", "Note"],
                        [[d["name"], d["phone"], d["title"], d["given_at"], d["next_due"], d["principal"], d["interest_pct"], d["total"], d["paid"], d["balance"], d["late"], d["days_over"], d["state"], d["branch"], d["collateral"], d["note"]] for d in D["debts"]])
    if kind == "payments":
        return csv_resp("depta-payments", ["Date", "Receipt", "Customer", "Item", "Amount", "Method", "Reference", "Checked by", "Status", "Note"],
                        [[p["day"], p["receipt"], p["name"], p["title"], p["amount"], p["method"], p["ref"], p["verified"], p["status"], p["note"]] for p in D["payments"]])
    if kind == "debtors":
        return csv_resp("depta-customers", ["Name", "Phone", "Phone 2", "Address", "ID no.", "Guarantor", "Guarantor phone", "Credit limit", "Owes", "Overdue", "Total lent", "Total paid", "Trust score", "Risk", "Blocked"],
                        [[o["name"], o["phone"], o["phone2"], o["address"], o["id_no"], o["guarantor"], o["guarantor_phone"], o["credit_limit"], o["balance"], o["overdue"], o["lent"], o["paid"], o["score"], o["risk"], "yes" if o["blocked"] else ""] for o in D["debtors"]])
    return err("Unknown export.", 404)

@app.get("/api/backup")
@auth
def backup():
    sid = g.shop["id"]; t = lambda n: [dict(r) for r in db.q(f"SELECT * FROM {n} WHERE shop_id=?", (sid,))]
    body = json.dumps(dict(shop=g.shop["name"], exported=now_ms(), settings=get_set(sid), debtors=t("dp_debtors"), debts=t("dp_debts"), payments=t("dp_payments"), followups=t("dp_followups")), indent=1)
    return Response(body, mimetype="application/json", headers={"Content-Disposition": f"attachment; filename=depta-backup-{today().isoformat()}.json"})

@app.get("/healthz")
def healthz(): return "ok"

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    try:
        from waitress import serve
        print(f"Depta running on port {port}  ·  database: {db.BACKEND}"); serve(app, host="0.0.0.0", port=port, threads=8)
    except ImportError:
        app.run(host="0.0.0.0", port=port)

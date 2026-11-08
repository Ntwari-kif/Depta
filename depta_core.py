"""Depta's money maths. The SAME file is used by Depta and CTone, so both always show identical numbers."""
import calendar, json, re, datetime as dt
import db

today = lambda: dt.date.today()
def num(v, default=0.0, lo=None, hi=None):
    try: x = float(v)
    except (TypeError, ValueError): return default
    if x != x or x in (float("inf"), float("-inf")): return default
    if lo is not None: x = max(lo, x)
    if hi is not None: x = min(hi, x)
    return x
def pdate(s):
    try: return dt.date.fromisoformat((s or "")[:10])
    except ValueError: return None
def add_months(d, n):
    m = d.month - 1 + n; y = d.year + m // 12; m = m % 12 + 1
    return dt.date(y, m, min(d.day, calendar.monthrange(y, m)[1]))
r2 = lambda x: round(float(x) + 1e-9, 2)

DEF_TPL = {
    "friendly": "Hello {name}, a friendly reminder from {shop}: your balance is {balance}, due {due}. {pay} Thank you 🙏",
    "firm": "Dear {name}, your payment of {balance} to {shop} is overdue since {due} ({days} days). Please pay today. {pay}",
    "final": "FINAL NOTICE – {name}, {balance} owed to {shop} is {days} days overdue. Please settle today or call {phone} to agree a plan. {pay}",
    "thanks": "Thank you {name}! We received {paid}. Your balance with {shop} is now {balance}. 🙏",
}
DEF = dict(grace_days=3, late_pct=0.0, late_cap_pct=50.0, due_days=30, interest_pct=0.0, due_soon_days=3, cc="", pay_info="",
           biz_phone="", receipt_footer="Thank you for your payment.", remind_gap_days=3)

def get_set(sid):
    d = dict(DEF); d["tpl"] = dict(DEF_TPL)
    r = db.q("SELECT data FROM dp_settings WHERE shop_id=?", (sid,), one=True)
    try: sv = json.loads(r["data"]) if r else {}
    except ValueError: sv = {}
    d["tpl"].update({k: v for k, v in (sv.pop("tpl", None) or {}).items() if k in DEF_TPL and isinstance(v, str) and v.strip()})
    d.update({k: v for k, v in sv.items() if k in DEF})
    return d


# ============================================================ the money maths (one place)
def total_of(d): return r2(d["principal"] * (1 + d["interest_pct"] / 100) + d["charges"])

def schedule_of(d, total):
    try: plan = json.loads(d["plan"] or "[]")
    except ValueError: plan = []
    sched = [{"due": p["due"], "amount": float(p["amount"])} for p in plan if pdate(p.get("due"))] or [{"due": d["due_at"], "amount": total}]
    diff = total - sum(i["amount"] for i in sched)
    if abs(diff) > 0.005: sched[-1]["amount"] = r2(sched[-1]["amount"] + diff)      # a later charge lands on the last instalment
    return sched

def calc(d, paid, S, td):
    """Everything about one debt: total, balance, late fee, instalment table, state."""
    total = total_of(d); settled = paid + d["forgiven"]
    sched = schedule_of(d, total); rem = settled; over = 0.0; oldest = None; first_open = None; today_amt = 0.0; rows = []
    for i in sched:
        part = min(i["amount"], rem); rem -= part; left = r2(i["amount"] - part)
        due = pdate(i["due"]) or td
        if left > 0.005:
            if due < td: over += left; oldest = oldest or due
            elif due == td: today_amt += left
            if first_open is None: first_open = due
        rows.append({"due": i["due"], "amount": i["amount"], "paid": r2(part), "left": max(0, left)})
    base = max(0.0, r2(total - settled))
    days_over = (td - oldest).days if oldest else 0
    late = 0.0
    if d["status"] == "open" and over > 0.005 and d["late_pct"] > 0 and days_over > S["grace_days"]:
        late = r2(min(over * d["late_pct"] / 100 * (days_over - S["grace_days"]) / 30, d["principal"] * S["late_cap_pct"] / 100))
    if d["status"] in ("written_off", "cancelled"): state, base, late, over, days_over = d["status"], 0.0, 0.0, 0.0, 0
    elif base <= 0.005: state, base, late, over, days_over = "paid", 0.0, 0.0, 0.0, 0
    elif over > 0.005: state = "overdue"
    elif today_amt > 0.005: state = "due_today"
    elif first_open and (first_open - td).days <= S["due_soon_days"]: state = "due_soon"
    else: state = "partial" if paid > 0 else "open"
    nd = first_open or pdate(d["due_at"])
    return dict(total=total, paid=r2(paid), base=base, late=late, balance=r2(base + late), overdue=r2(over + late if over > 0 else 0), days_over=days_over,
                state=state, next_due=nd.isoformat() if nd else d["due_at"], schedule=rows, due_today=r2(today_amt))

BUCKETS = [("current", 0, 0), ("1-7", 1, 7), ("8-30", 8, 30), ("31-60", 31, 60), ("61-90", 61, 90), ("90+", 91, 99999)]
def bucket(days):
    for n, a, b in BUCKETS:
        if a <= days <= b: return n
    return "90+"


def summary(shop):
    """Short debt picture for one shop (shown inside CTone's owner panel)."""
    sid, S, td = shop["id"], get_set(shop["id"]), today(); tds = td.isoformat()
    paid = {r["debt_id"]: r["t"] for r in db.q("SELECT debt_id, SUM(amount) t FROM dp_payments WHERE shop_id=? AND status='ok' GROUP BY debt_id", (sid,))}
    names = {r["id"]: r["name"] for r in db.q("SELECT id,name FROM dp_debtors WHERE shop_id=? AND archived=0", (sid,))}
    out = dict(outstanding=0.0, overdue=0.0, overdue_n=0, due_today=0.0, due_today_n=0, customers=0, top=[]); owing, over = set(), []
    for r in db.q("SELECT * FROM dp_debts WHERE shop_id=? AND status='open'", (sid,)):
        d = dict(r)
        if d["debtor_id"] not in names: continue
        c = calc(d, paid.get(d["id"], 0.0) or 0.0, S, td)
        if c["state"] in ("paid", "written_off", "cancelled"): continue
        out["outstanding"] += c["balance"]; owing.add(d["debtor_id"])
        if c["state"] == "overdue": out["overdue"] += c["overdue"]; out["overdue_n"] += 1; over.append({"name": names[d["debtor_id"]], "balance": c["balance"], "days": c["days_over"]})
        if c["due_today"] > 0: out["due_today"] += c["due_today"]; out["due_today_n"] += 1
    mon = tds[:7]
    out["collected_month"] = r2(db.q("SELECT COALESCE(SUM(amount),0) t FROM dp_payments WHERE shop_id=? AND status='ok' AND day>=? AND day<=?", (sid, mon + "-01", mon + "-31"), one=True)["t"])
    out["collected_today"] = r2(db.q("SELECT COALESCE(SUM(amount),0) t FROM dp_payments WHERE shop_id=? AND status='ok' AND day=?", (sid, tds), one=True)["t"])
    out["customers"] = len(owing); out["total_customers"] = len(names)
    out["top"] = sorted(over, key=lambda x: -x["days"] * 500 - x["balance"] / 100)[:3]
    for k in ("outstanding", "overdue", "due_today"): out[k] = r2(out[k])
    return out

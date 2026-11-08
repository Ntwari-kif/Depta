/* Depta – debt collector UI. Uses the same shared helpers as CTone (common.js). */
$('#bar').innerHTML = topbar('Depta');

let D = null, tab = 'today', REP = null;
const F = { debt: 'open', dq: '', dsort: 'prio', pf: 'all', pq: '', all: false };
const m = n => fmt(n, D ? D.currency : '');
const byDebtor = id => D.debtors.find(o => o.id == id);
const byDebt = id => D.debts.find(o => o.id == id);
const ini = s => (s || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ST = { overdue: 'Overdue', due_today: 'Due today', due_soon: 'Due soon', partial: 'Part-paid', open: 'Open', paid: 'Paid', written_off: 'Written off', cancelled: 'Cancelled' };
const RK = { good: 'Good payer', watch: 'Watch', risky: 'High risk', new: 'New' };
const METH = { cash: 'Cash', mobile: 'Mobile money', bank: 'Bank', card: 'Card' };
const KIND = { call: '📞 Call', visit: '🚶 Visit', sms: '💬 SMS', whatsapp: '💬 WhatsApp', promise: '🤝 Promise', note: '📝 Note' };
const LIVE = s => !['paid', 'written_off', 'cancelled'].includes(s);
const D8 = s => { if (!s) return '—'; const d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); const y = d.getFullYear() !== new Date().getFullYear(); if (I18N.lang === 'rw') return I18N.rwDate(d, { day: 1, year: y }); const o = { day: 'numeric', month: 'short' }; if (y) o.year = 'numeric'; return d.toLocaleDateString(I18N.loc, o); };
const daysTo = s => Math.round((new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) - new Date(+D.today.slice(0, 4), +D.today.slice(5, 7) - 1, +D.today.slice(8, 10))) / 864e5);
const addDays = (n, from) => { const d = from ? new Date(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10)) : new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const pct = (a, b) => b > 0 ? Math.max(0, Math.min(100, a / b * 100)) : 0;
const val = id => { const e = $('#' + id); return e ? e.value : ''; };
const riskOf = id => { const o = byDebtor(id); return o ? o.risk : ''; };

function dueText(d) {
  if (d.state === 'paid') return 'Fully paid';
  if (d.state === 'written_off') return 'Written off';
  if (d.state === 'cancelled') return 'Cancelled';
  if (d.state === 'overdue') return `Overdue ${d.days_over} day${d.days_over === 1 ? '' : 's'}`;
  if (d.state === 'due_today') return 'Due today';
  const n = daysTo(d.next_due); return n === 1 ? 'Due tomorrow' : n > 0 && n <= 14 ? `Due in ${n} days` : 'Due ' + D8(d.next_due);
}
const meterOf = d => d.paid > 0 && LIVE(d.state) ? `<div class="meter ${d.state === 'overdue' ? 'bad' : ''}"><i style="width:${pct(d.paid, d.total)}%"></i></div>` : '';

/* ---------------------------------------------------------------- phones & messages */
function tplText(kind) { const v = D.settings.tpl[kind], x = I18N.tpl(kind); return x && v === I18N.enTpl[kind] ? x : v; }
function dial(phone) {
  let n = String(phone || '').replace(/[^\d+]/g, ''); if (!n) return '';
  if (n.startsWith('+')) return n.slice(1);
  if (n.startsWith('00')) return n.slice(2);
  const cc = D.settings.cc || '';
  if (n.startsWith('0') && cc) return cc + n.slice(1);
  return n;
}
const waLink = (phone, text) => 'https://wa.me/' + dial(phone) + '?text=' + encodeURIComponent(text);
const smsLink = (phone, text) => 'sms:' + String(phone || '').replace(/[^\d+]/g, '') + '?body=' + encodeURIComponent(text);
function fill(tpl, v) { return tpl.replace(/\{(\w+)\}/g, (_, k) => v[k] === undefined ? '' : v[k]).replace(/\s{2,}/g, ' ').trim(); }
function vars(d, extra) {
  const S = D.settings;
  return Object.assign({ name: d.name, balance: m(d.balance), due: D8(d.next_due), days: d.days_over, shop: D.shop.name, pay: S.pay_info, phone: S.biz_phone, paid: '' }, extra || {});
}
const suggest = d => d.days_over > 14 ? 'final' : d.state === 'overdue' ? 'firm' : 'friendly';
async function logFu(debtorId, debtId, kind, note) { try { await api('/api/followup', { debtor_id: debtorId, debt_id: debtId || 0, kind, note }); } catch (e) { } }

/* ---------------------------------------------------------------- sheets */
function sheet(html) { $('#sbody').innerHTML = html; $('#sheet').classList.add('show'); $('#sbody').scrollTop = 0; }
function closeSheet() { $('#sheet').classList.remove('show'); }
$('#sheet').onclick = e => { if (e.target.id === 'sheet') closeSheet(); };
const head = (title, back) => `<div class="sheet-h"><h2>${title}</h2><button onclick="${back || 'closeSheet()'}">${back ? '‹ Back' : 'Close'}</button></div>`;
const kv = (a, b) => `<div class="kv"><span>${a}</span><b>${b}</b></div>`;
const field = (id, label, v = '', ph = '', mode = '') => `<label for="${id}">${label}</label><input class="in" id="${id}" value="${esc(v)}" placeholder="${esc(ph)}" ${mode ? `inputmode="${mode}"` : ''} autocomplete="off">`;
const dateField = (id, label, v) => `<label for="${id}">${label}</label><input class="in" type="date" id="${id}" value="${v || ''}">`;
function seg(id, opts, cur, fn) { return `<div class="seg" id="${id}">${opts.map(([k, t]) => `<button type="button" data-k="${k}" class="${k === cur ? 'on' : ''}" onclick="segPick('${id}','${k}'${fn ? ',' + fn : ''})">${t}</button>`).join('')}</div>`; }
function segPick(id, k, fn) { $$('#' + id + ' button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); if (fn) fn(k); }
const segVal = id => { const b = $('#' + id + ' button.on'); return b ? b.dataset.k : ''; };
async function postC(url, body) {      // asks "are you sure?" when the server warns (credit limit, blocked, duplicate phone)
  try { return await api(url, body); }
  catch (e) { if (e.status === 409 && e.data && e.data.confirm) { if (confirm(e.message)) return await api(url, Object.assign({}, body, { force: 1 })); return null; } throw e; }
}
function mini(o) {
  sheet(head(o.title, o.back) + (o.intro ? `<p class="hint" style="margin-bottom:6px">${o.intro}</p>` : '') +
    o.fields.map(f => f.type === 'area' ? `<label for="mf_${f.id}">${f.label}</label><textarea class="in" id="mf_${f.id}" placeholder="${esc(f.ph || '')}">${esc(f.value || '')}</textarea>`
      : f.type === 'date' ? dateField('mf_' + f.id, f.label, f.value) : field('mf_' + f.id, f.label, f.value ?? '', f.ph || '', f.mode || '')).join('') +
    `<button class="btn ${o.cls || 'n'} block" id="mfGo" style="margin-top:14px">${o.ok}</button>`);
  $('#mfGo').onclick = async () => { const v = {}; o.fields.forEach(f => v[f.id] = val('mf_' + f.id)); const b = $('#mfGo'); b.disabled = true; try { await o.run(v); } catch (e) { toast(e.message); } b.disabled = false; };
}
async function done(msg, reopen) { toast(msg); await load(); if (reopen) reopen(); else closeSheet(); }
function printHTML(html) { $('#pa').innerHTML = html; document.body.classList.add('printing'); setTimeout(() => window.print(), 60); }
addEventListener('afterprint', () => document.body.classList.remove('printing'));

/* ---------------------------------------------------------------- data */
async function load() { D = await api('/api/data'); render(); }
function render() {
  $('#who').textContent = D.user.name + ' · ' + D.shop.name;
  $('#ctBtn').hidden = !(D.ctone && D.ctone.linked);
  const t = D.kpis; const sw = $('#tabs button[data-t=today]'); sw.textContent = 'Today' + (D.todo.queue.length ? ' · ' + D.todo.queue.length : '');
  if (tab === 'settings' || tab === 'reports') return;        // never redraw while the owner is typing in forms
  VIEWS[tab]();
}
$$('#tabs button').forEach(b => b.onclick = () => go(b.dataset.t));
function go(t) { tab = t; $$('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t)); window.scrollTo(0, 0); if (!D) return; if (t === 'settings') vSettings(); else if (t === 'reports') vReports(); else VIEWS[t](); }
const VIEWS = { today: vToday, debts: vDebts, people: vPeople };
function setF(k, v) { F[k] = v; VIEWS[tab](); }

/* ---------------------------------------------------------------- TODAY */
function qCard(d) {
  const o = byDebtor(d.debtor_id) || {};
  return `<div class="pc" onclick="openDebt(${d.id})"><div class="pt"><div class="who2"><div class="avatar ${o.risk || ''}">${esc(ini(d.name))}</div><div><b>${esc(d.name)}</b><div class="mini">${esc(d.title || 'Credit')} · ${dueText(d)}</div></div></div><span class="num" style="font-size:19px">${m(d.balance)}</span></div>
    <div class="acts" onclick="event.stopPropagation()">${d.phone ? `<a class="btn sm" href="tel:${esc(d.phone)}" onclick="logFu(${d.debtor_id},${d.id},'call','Called from the collection list')">📞 Call</a>` : ''}<button class="btn wa sm" onclick="remind(${d.id})">💬 Remind</button><button class="btn p sm" onclick="openPay(${d.id})">✅ Collect</button></div></div>`;
}
function fuCard(f) {
  const d = byDebt(f.debt_id), o = byDebtor(f.debtor_id); if (!o) return '';
  const tag = f.kind === 'promise' ? `Promised ${m(f.promise_amount)} by ${D8(f.promise_date)}` : f.note || KIND[f.kind];
  return `<div class="row" onclick="openDebtor(${f.debtor_id})"><div class="avatar ${o.risk}">${esc(ini(o.name))}</div><div class="m"><b>${esc(o.name)}</b><small>${esc(tag)}${f.next_at && f.kind !== 'promise' ? ' · follow up ' + D8(f.next_at) : ''}</small></div>${f.outcome ? `<span class="st ${f.outcome === 'pending' ? 'partial' : f.outcome}">${f.outcome === 'pending' ? 'today' : f.outcome}</span>` : `<button class="btn sm" onclick="event.stopPropagation();fuDone(${f.id})">Done</button>`}</div>`;
}
async function fuDone(id) { await api('/api/followup/' + id + '/done', {}); toast('Marked done'); load(); }
function vToday() {
  const k = D.kpis, T = D.todo, fus = id => D.followups.find(f => f.id === id);
  if (!D.debtors.length) {
    $('#v').innerHTML = `<div class="card ctr" style="padding:26px 18px"><img class="hero-logo" src="/static/icon-192.png" alt="" style="width:84px;height:84px"><h2 style="font-size:20px">Welcome to Depta 👋</h2><p class="hint" style="margin:6px 0 14px">Record who owes your shop, remind them, and collect every shilling. Start with your first customer.</p><button class="btn n block" onclick="openDebtorForm()">➕ Add first customer</button><button class="btn block" style="margin-top:8px" onclick="openNewDebt()">🧾 Record a debt</button></div>`;
    return;
  }
  const q = T.queue.map(byDebt).filter(Boolean), qShow = F.all ? q : q.slice(0, 8);
  const prom = T.promises.map(fus).filter(Boolean), brk = T.broken.map(fus).filter(Boolean), nxt = T.follow.map(fus).filter(Boolean), soon = T.soon.map(byDebt).filter(Boolean);
  const mx = Math.max(1, ...D.aging.map(a => a.v)), mm = Math.max(1, ...D.months.map(x => Math.max(x.lent, x.paid)));
  const top = D.debtors.filter(o => o.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);
  $('#v').innerHTML = `
  <div class="total"><small>Total owed to you</small><span class="num">${m(k.outstanding)}</span><div class="s"><span>${k.debtors_owing} customer${k.debtors_owing === 1 ? '' : 's'} owe you</span><span>${k.recovery}% recovered so far</span><span><span class="live"></span>Live</span></div></div>
  <div class="tools"><button class="btn" onclick="shareDay()">📤 Share today's summary</button><button class="btn" onclick="go('debts');setF('debt','overdue')">⚠ Overdue (${k.overdue_n})</button></div>
  <div class="kpis">${[['Collected today', m(k.today)], ['Due today', m(k.due_today) + (k.due_today_n ? ` <span class="mini">(${k.due_today_n})</span>` : '')], ['Overdue', m(k.overdue)], ['Collected this month', m(k.month)], ['Expected next 7 days', m(k.expected7)], ['Lent this month', m(k.lent_month)]].map(([a, b]) => `<div class="kpi"><small>${a}</small><span class="num" style="font-size:22px">${b}</span></div>`).join('')}</div>
  <div class="grid"><div>
    <div class="card"><h2>📋 Collect today${q.length ? ` (${q.length})` : ''}</h2>${qShow.map(qCard).join('') || '<p class="empty">Nothing is due or overdue. 🎉 Enjoy the day.</p>'}${q.length > 8 ? `<button class="btn block" onclick="F.all=!F.all;vToday()">${F.all ? 'Show less' : 'Show all ' + q.length}</button>` : ''}</div>
    ${prom.length || brk.length ? `<div class="card"><h2>🤝 Promises to pay</h2>${prom.map(fuCard).join('')}${brk.map(fuCard).join('')}</div>` : ''}
    ${nxt.length ? `<div class="card"><h2>🔔 Follow-ups for today</h2>${nxt.map(fuCard).join('')}</div>` : ''}
    ${soon.length ? `<div class="card"><h2>⏳ Due soon</h2>${soon.slice(0, 8).map(d => `<div class="row" onclick="openDebt(${d.id})"><div class="avatar ${riskOf(d.debtor_id)}">${esc(ini(d.name))}</div><div class="m"><b>${esc(d.name)}</b><small>${dueText(d)}${d.title ? ' · ' + esc(d.title) : ''}</small></div><span class="num">${m(d.balance)}</span></div>`).join('')}</div>` : ''}
    <div class="card"><h2>💵 Recent payments</h2>${D.payments.filter(p => p.status === 'ok').slice(0, 8).map(payRow).join('') || '<p class="empty">No payments yet.</p>'}</div>
  </div><div>
    <div class="card"><h2>Age of debts</h2><div class="agew">${D.aging.map((a, i) => `<div><b class="num">${a.v ? fmt(a.v) : ''}</b><i class="${i > 2 ? 'r' : i > 0 ? 'w' : ''}" style="height:${a.v / mx * 100}%"></i><small>${a.k}${i ? 'd' : ''}</small></div>`).join('')}</div><p class="hint" style="margin-top:6px">How many days past the due date. “current” is not yet due.</p></div>
    <div class="card"><h2>Lent vs collected</h2><div class="dual">${D.months.map(x => `<div><div class="pr"><i title="Lent ${fmt(x.lent)}" style="height:${x.lent / mm * 100}%"></i><i class="g" title="Collected ${fmt(x.paid)}" style="height:${x.paid / mm * 100}%"></i></div><small>${(I18N.lang === 'rw' ? I18N.rwDate(new Date(x.m + '-15'), {}) : new Date(x.m + '-15').toLocaleDateString(I18N.loc, { month: 'short' }))}</small></div>`).join('')}</div><div class="lg"><span><i></i>Lent</span><span><i class="g"></i>Collected</span></div></div>
    <div class="card"><h2>🏆 Biggest balances</h2>${top.map(o => `<div class="row" onclick="openDebtor(${o.id})"><div class="avatar ${o.risk}">${esc(ini(o.name))}</div><div class="m"><b>${esc(o.name)}</b><small>${RK[o.risk]} · ${o.open_n} debt${o.open_n === 1 ? '' : 's'}</small></div><span class="num">${m(o.balance)}</span></div>`).join('') || '<p class="empty">Nobody owes you right now.</p>'}</div>
  </div></div>`;
}
const payRow = p => `<div class="row" onclick="openDebtor(${p.debtor_id})"><div class="m"><b>${esc(p.name)}</b><small>${D8(p.day)} · ${METH[p.method] || p.method}${p.ref ? ' · ' + esc(p.ref) : ''}${p.status === 'void' ? ' · VOID' : ''}</small></div><span class="num" style="${p.status === 'void' ? 'text-decoration:line-through;opacity:.5' : ''}">${m(p.amount)}</span></div>`;
function shareDay() {
  const k = D.kpis, top = D.todo.queue.map(byDebt).filter(Boolean).slice(0, 3);
  shareText(`📊 ${D.shop.name} – ${D8(D.today)}\n${T('Collected today')}: ${m(k.today)}\n${T('Owed to us')}: ${m(k.outstanding)}\n${T('Overdue')}: ${m(k.overdue)} (${k.overdue_n})\n${T('Due today')}: ${m(k.due_today)} (${k.due_today_n})` + (top.length ? '\n' + top.map(d => `${d.name} ${m(d.balance)}`).join(', ') : '') + '\nDepta');
}

/* ---------------------------------------------------------------- DEBTS */
const ORDER = { overdue: 0, due_today: 1, due_soon: 2, partial: 3, open: 4, paid: 5, written_off: 6, cancelled: 7 };
function vDebts() {
  const chips = [['open', 'Open'], ['overdue', 'Overdue'], ['due_today', 'Due today'], ['due_soon', 'Due soon'], ['partial', 'Part-paid'], ['paid', 'Paid'], ['written_off', 'Written off'], ['all', 'All']];
  const q = F.dq.trim().toLowerCase();
  let l = D.debts.filter(d => d.state !== 'cancelled' || F.debt === 'all').filter(d => F.debt === 'all' ? true : F.debt === 'open' ? LIVE(d.state) : d.state === F.debt)
    .filter(d => !q || (d.name + ' ' + d.title + ' ' + d.phone + ' ' + d.ref).toLowerCase().includes(q));
  const S = { prio: (a, b) => ORDER[a.state] - ORDER[b.state] || b.days_over - a.days_over || (a.next_due > b.next_due ? 1 : -1), big: (a, b) => b.balance - a.balance, due: (a, b) => a.next_due > b.next_due ? 1 : -1, new: (a, b) => b.created_at - a.created_at }[F.dsort];
  l.sort(S); const tot = l.reduce((s, d) => s + d.balance, 0);
  $('#v').innerHTML = `<div class="tools"><div class="srch" style="flex:1;min-width:180px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input class="in" id="dq" placeholder="Search name, item, phone" value="${esc(F.dq)}"></div>
    <select class="in" style="width:auto" onchange="setF('dsort',this.value)">${[['prio', 'Most urgent'], ['big', 'Biggest'], ['due', 'Due date'], ['new', 'Newest']].map(([k, t]) => `<option value="${k}" ${F.dsort === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
    <div class="chips">${chips.map(([k, t]) => `<button class="chip ${F.debt === k ? 'on' : ''}" onclick="setF('debt','${k}')">${t}</button>`).join('')}</div>
    <p class="hint" style="margin:4px 2px 8px">${l.length} debt${l.length === 1 ? '' : 's'} · balance ${m(tot)}</p>
    ${l.slice(0, 150).map(d => `<div class="row tall" onclick="openDebt(${d.id})"><div class="avatar ${riskOf(d.debtor_id)}">${esc(ini(d.name))}</div><div class="m"><b>${esc(d.name)}</b><small class="line2">${esc(d.title || 'Credit')} · ${dueText(d)}</small>${meterOf(d)}</div><div><span class="num" style="font-size:19px">${m(LIVE(d.state) ? d.balance : d.total)}</span><span class="st ${d.state}">${ST[d.state]}</span></div></div>`).join('') || '<p class="empty">No debts match. Tap ＋ to record one.</p>'}`;
  const e = $('#dq'); e.oninput = () => { F.dq = e.value; const p = e.selectionStart; vDebts(); const n = $('#dq'); n.focus(); n.setSelectionRange(p, p); };
}

/* ---------------------------------------------------------------- CUSTOMERS */
function vPeople() {
  const chips = [['all', 'All'], ['owing', 'Owing'], ['overdue', 'Overdue'], ['good', 'Good payers'], ['risky', 'High risk'], ['blocked', 'Blocked']];
  const q = F.pq.trim().toLowerCase();
  let l = D.debtors.filter(o => F.pf === 'all' ? true : F.pf === 'owing' ? o.balance > 0 : F.pf === 'overdue' ? o.overdue > 0 : F.pf === 'blocked' ? o.blocked : o.risk === F.pf)
    .filter(o => !q || (o.name + ' ' + o.phone + ' ' + o.tag + ' ' + o.address).toLowerCase().includes(q)).sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
  $('#v').innerHTML = `<div class="tools"><div class="srch" style="flex:1;min-width:180px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input class="in" id="pq" placeholder="Search name, phone, area" value="${esc(F.pq)}"></div><button class="btn n" onclick="openDebtorForm()">➕ Customer</button></div>
    <div class="chips">${chips.map(([k, t]) => `<button class="chip ${F.pf === k ? 'on' : ''}" onclick="setF('pf','${k}')">${t}</button>`).join('')}</div>
    <p class="hint" style="margin:4px 2px 8px">${l.length} customer${l.length === 1 ? '' : 's'}</p>
    ${l.slice(0, 200).map(o => `<div class="row" onclick="openDebtor(${o.id})"><div class="avatar ${o.risk}">${esc(ini(o.name))}</div><div class="m"><b>${esc(o.name)}${o.blocked ? ' 🚫' : ''}</b><small>${esc(o.phone || 'no phone')}${o.tag ? ' · ' + esc(o.tag) : ''}</small></div><div><span class="num" style="font-size:19px">${o.balance > 0 ? m(o.balance) : '—'}</span><span class="st ${o.risk}">${RK[o.risk]}</span></div></div>`).join('') || '<p class="empty">No customers yet.</p>'}`;
  const e = $('#pq'); e.oninput = () => { F.pq = e.value; const p = e.selectionStart; vPeople(); const n = $('#pq'); n.focus(); n.setSelectionRange(p, p); };
}

/* ---------------------------------------------------------------- DEBT DETAIL */
function openDebt(id) {
  const d = byDebt(id); if (!d) return toast('Debt not found');
  const o = byDebtor(d.debtor_id) || {}, live = LIVE(d.state);
  const pays = D.payments.filter(p => p.debt_id === id), fus = D.followups.filter(f => f.debt_id === id);
  const tl = [...pays.map(p => ({ t: p.paid_at, h: `<div class="pay"><b>${m(p.amount)} received</b>${p.status === 'void' ? ' <span class="st void">void</span>' : ''}<small>${D8(p.day)} · ${METH[p.method] || p.method}${p.ref ? ' · ' + esc(p.ref) : ''}${p.verified === 'sms' ? ' · SMS read' : ''}${p.note ? ' · ' + esc(p.note) : ''}</small>${p.status === 'ok' ? `<button class="lnk" onclick="voidPay(${p.id},${id})">Undo</button> <button class="lnk" onclick="openReceipt(${p.id})">Receipt</button>` : ''}</div>` })),
  ...fus.map(f => ({ t: f.created_at, h: `<div><b>${KIND[f.kind]}</b>${f.outcome ? ` <span class="st ${f.outcome === 'pending' ? 'partial' : f.outcome}">${f.outcome}</span>` : ''}<small>${dtm(f.created_at)}${f.kind === 'promise' ? ` · ${m(f.promise_amount)} by ${D8(f.promise_date)}` : ''}${f.note ? ' · ' + esc(f.note) : ''}</small></div>` }))].sort((a, b) => b.t - a.t);
  sheet(`${head(esc(d.title || 'Debt'))}
    <div class="who2" style="margin-bottom:8px" onclick="openDebtor(${d.debtor_id})"><div class="avatar ${o.risk || ''}">${esc(ini(d.name))}</div><div style="flex:1"><b>${esc(d.name)}</b><div class="mini">${esc(d.phone || 'no phone')} · ${RK[o.risk] || ''}</div></div><span class="st ${d.state}">${ST[d.state]}</span></div>
    <div class="total" style="margin-bottom:10px"><small>${live ? 'Balance to collect' : ST[d.state]}</small><span class="num" style="font-size:38px">${m(d.balance)}</span><div class="s"><span>${live ? dueText(d) : ''}</span>${d.late > 0 ? `<span>incl. late fee ${m(d.late)}</span>` : ''}</div></div>
    <div class="meter"><i style="width:${pct(d.paid, d.total)}%"></i></div><p class="mini" style="margin-bottom:8px">${m(d.paid)} paid of ${m(d.total)} (${Math.round(pct(d.paid, d.total))}%)</p>
    ${live ? `<div class="g2"><button class="btn p" onclick="openPay(${id})">✅ Collect payment</button><button class="btn wa" onclick="remind(${id})">💬 Remind</button><button class="btn" onclick="openFollow(${d.debtor_id},${id},'promise')">🤝 Promise to pay</button><button class="btn" onclick="openFollow(${d.debtor_id},${id},'call')">📞 Log call / visit</button></div>` : ''}
    ${d.schedule.length > 1 ? `<h2 style="margin:14px 0 4px;font-size:15px">Instalments</h2>${d.schedule.map((s, i) => `<div class="seq ${s.left <= 0.005 ? 'done' : s.due < D.today ? 'late' : ''}"><span>${i + 1}</span><span class="d">${D8(s.due)}</span><span>${m(s.left > 0.005 ? s.left : s.amount)}</span></div>`).join('')}` : ''}
    <h2 style="margin:14px 0 4px;font-size:15px">Details</h2>
    ${kv('Given', D8(d.given_at))}${kv(d.schedule.length > 1 ? 'Next due' : 'Due', D8(d.next_due))}${kv('Amount lent', m(d.principal))}${d.interest_pct ? kv('Interest', d.interest_pct + '%') : ''}${d.charges ? kv('Extra charges', m(d.charges)) : ''}${d.forgiven ? kv('Discount given', m(d.forgiven)) : ''}${d.late_pct ? kv('Late fee', d.late_pct + '% a month' + (d.late ? ' · now ' + m(d.late) : '')) : ''}${kv('Total', m(d.total))}${d.collateral ? kv('Security / pledge', esc(d.collateral)) : ''}${d.ref ? kv('Reference', esc(d.ref)) : ''}${D.shop.branches.length > 1 ? kv('Branch', esc(d.branch)) : ''}${d.note ? kv('Note', esc(d.note)) : ''}${d.written_off ? kv('Written off', m(d.written_off)) : ''}
    ${live ? `<h2 style="margin:14px 0 4px;font-size:15px">More</h2><div class="g2"><button class="btn sm" onclick="doResched(${id})">📅 Move due date</button><button class="btn sm" onclick="doCharge(${id})">➕ Add charge</button><button class="btn sm" onclick="doForgive(${id})">🎁 Give discount</button><button class="btn sm" onclick="doEdit(${id})">✏️ Edit</button><button class="btn sm d" onclick="doWriteoff(${id})">🗑 Write off</button>${d.paid <= 0 ? `<button class="btn sm d" onclick="doCancel(${id})">↩ Entered by mistake</button>` : ''}</div>` : ''}
    ${d.state === 'written_off' ? `<button class="btn block" style="margin-top:12px" onclick="doReopen(${id})">Reopen this debt</button>` : ''}
    <h2 style="margin:14px 0 4px;font-size:15px">History</h2><div class="tl">${tl.map(x => x.h).join('') || '<p class="empty">Nothing yet.</p>'}</div>`);
}
const back = id => () => openDebt(id);
function doResched(id) { const d = byDebt(id); mini({ title: '📅 Move due date', back: `openDebt(${id})`, intro: d.schedule.length > 1 ? 'All unpaid instalments move by the same number of days.' : '', fields: [{ id: 'd', label: 'New due date', type: 'date', value: addDays(7, d.next_due > D.today ? d.next_due : D.today) }, { id: 'r', label: 'Reason (optional)', ph: 'e.g. customer asked for a week' }], ok: 'Save new date', run: async v => { await api(`/api/debt/${id}/reschedule`, { due_at: v.d, reason: v.r }); done('Due date moved', back(id)); } }); }
function doCharge(id) { mini({ title: '➕ Add a charge', back: `openDebt(${id})`, intro: 'Adds money to what the customer owes (e.g. delivery, penalty).', fields: [{ id: 'a', label: 'Amount', mode: 'decimal' }, { id: 'r', label: 'Reason' }], ok: 'Add charge', run: async v => { await api(`/api/debt/${id}/charge`, { amount: v.a, reason: v.r }); done('Charge added', back(id)); } }); }
function doForgive(id) { const d = byDebt(id); mini({ title: '🎁 Give a discount', back: `openDebt(${id})`, intro: `Reduces what is owed (up to ${m(d.base)}). Not counted as a loss.`, fields: [{ id: 'a', label: 'Amount to forgive', mode: 'decimal' }, { id: 'r', label: 'Reason' }], ok: 'Give discount', run: async v => { await api(`/api/debt/${id}/forgive`, { amount: v.a, reason: v.r }); done('Discount given', back(id)); } }); }
function doWriteoff(id) { const d = byDebt(id); mini({ title: '🗑 Write off as a loss', back: `openDebt(${id})`, intro: `You will stop chasing ${m(d.base)}. You can reopen it later if the customer pays.`, cls: 'd', fields: [{ id: 'r', label: 'Reason', ph: 'e.g. customer moved away' }], ok: 'Write off', run: async v => { await api(`/api/debt/${id}/writeoff`, { reason: v.r }); done('Written off', back(id)); } }); }
function doCancel(id) { if (!confirm('Remove this debt? Use this only if it was entered by mistake.')) return; api(`/api/debt/${id}/cancel`, {}).then(() => done('Debt removed')).catch(e => toast(e.message)); }
function doReopen(id) { api(`/api/debt/${id}/reopen`, {}).then(() => done('Debt reopened', back(id))).catch(e => toast(e.message)); }
function doEdit(id) {
  const d = byDebt(id), canAmt = d.paid <= 0;
  mini({ title: '✏️ Edit debt', back: `openDebt(${id})`, fields: [{ id: 't', label: 'Item / reason', value: d.title }, ...(canAmt ? [{ id: 'a', label: 'Amount lent', value: d.principal, mode: 'decimal' }, { id: 'i', label: 'Interest %', value: d.interest_pct, mode: 'decimal' }] : []), { id: 'l', label: 'Late fee % per month', value: d.late_pct, mode: 'decimal' }, { id: 'g', label: 'Date given', type: 'date', value: d.given_at }, { id: 'c', label: 'Security / pledge', value: d.collateral }, { id: 'rf', label: 'Reference', value: d.ref }, { id: 'n', label: 'Note', type: 'area', value: d.note }], ok: 'Save changes',
    run: async v => { await api(`/api/debt/${id}/edit`, { title: v.t, amount: v.a, interest_pct: v.i, late_pct: v.l, given_at: v.g, collateral: v.c, ref: v.rf, note: v.n }); done('Saved', back(id)); }
  });
}
async function voidPay(pid, debtId) { const r = prompt('Why undo this payment?'); if (r === null) return; try { await api(`/api/payment/${pid}/void`, { reason: r }); done('Payment undone', debtId ? back(debtId) : null); } catch (e) { toast(e.message); } }

/* ---------------------------------------------------------------- REMINDERS */
function remind(id, kind) {
  const d = byDebt(id); if (!d) return; kind = kind || suggest(d);
  const text = () => fill(tplText(segVal('rk')) || '', vars(d));
  sheet(`${head('💬 Remind ' + esc(d.name), `openDebt(${id})`)}<p class="hint">Pick a tone, edit if you like, then send. It opens WhatsApp or your SMS app – you press send.</p>
    ${seg('rk', [['friendly', '😊 Friendly'], ['firm', '😐 Firm'], ['final', '⚠ Final notice']], kind, 'remindTone')}
    <textarea class="in" id="rm" style="min-height:130px"></textarea>
    <div class="g2" style="margin-top:10px"><button class="btn wa" id="rwa">💬 WhatsApp</button><button class="btn n" id="rsm">✉️ SMS</button></div>
    <button class="btn block" id="rcp" style="margin-top:8px">📋 Copy message</button>
    ${d.phone ? '' : '<p class="hint" style="margin-top:8px">No phone saved – WhatsApp will ask you to pick a contact.</p>'}`);
  window.remindTone = () => { $('#rm').value = text(); }; remindTone();
  $('#rwa').onclick = () => { window.open(waLink(d.phone, $('#rm').value), '_blank'); logFu(d.debtor_id, id, 'whatsapp', 'Reminder sent (' + segVal('rk') + ')').then(load); };
  $('#rsm').onclick = () => { location.href = smsLink(d.phone, $('#rm').value); logFu(d.debtor_id, id, 'sms', 'Reminder sent (' + segVal('rk') + ')').then(load); };
  $('#rcp').onclick = async () => { try { await navigator.clipboard.writeText($('#rm').value); toast('Copied'); } catch (e) { $('#rm').select(); toast('Select and copy'); } };
}

/* ---------------------------------------------------------------- FOLLOW-UPS */
function openFollow(debtorId, debtId, kind) {
  const o = byDebtor(debtorId), d = debtId ? byDebt(debtId) : null, bal = d ? d.balance : o.balance;
  const back = debtId ? `openDebt(${debtId})` : `openDebtor(${debtorId})`;
  sheet(`${head('Log for ' + esc(o.name), back)}${seg('fk', [['call', '📞 Call'], ['visit', '🚶 Visit'], ['sms', '💬 Message'], ['promise', '🤝 Promise'], ['note', '📝 Note']], kind || 'call', 'fkPick')}
    <div id="fp" ${kind === 'promise' ? '' : 'hidden'}>${dateField('fd', 'Promised to pay on', addDays(3))}${field('fa', 'Promised amount', bal || '', '', 'decimal')}</div>
    <label for="fn">What happened?</label><textarea class="in" id="fn" placeholder="e.g. Said he will pay after market day"></textarea>
    ${dateField('fx', 'Remind me to follow up on (optional)', '')}
    <button class="btn n block" id="fgo" style="margin-top:14px">Save</button>`);
  window.fkPick = k => { $('#fp').hidden = k !== 'promise'; };
  $('#fgo').onclick = async () => { const b = $('#fgo'); b.disabled = true; try { const k = segVal('fk'); await api('/api/followup', { debtor_id: debtorId, debt_id: debtId || 0, kind: k, note: val('fn'), promise_date: val('fd'), promise_amount: val('fa'), next_at: val('fx') }); done(k === 'promise' ? 'Promise saved – I will tell you if it is kept' : 'Saved', () => debtId ? openDebt(debtId) : openDebtor(debtorId)); } catch (e) { toast(e.message); } b.disabled = false; };
}

/* ---------------------------------------------------------------- COLLECT A PAYMENT */
function openPay(debtId, debtorId) {
  const d = debtId ? byDebt(debtId) : null, o = byDebtor(d ? d.debtor_id : debtorId); if (!o) return;
  const bal = d ? d.balance : o.balance; if (bal <= 0) return toast('Nothing is owed here');
  const backTo = d ? `openDebt(${d.id})` : `openDebtor(${o.id})`;
  sheet(`${head('✅ Collect from ' + esc(o.name), backTo)}<p class="hint">${d ? esc(d.title || 'Credit') + ' · ' : 'Spread over their debts, oldest due date first · '}owes <b>${m(bal)}</b></p>
    <label for="pa_">Amount received</label><input class="in big-in" id="pa_" inputmode="decimal" value="${bal}">
    <div class="seg" style="margin-top:6px"><button type="button" onclick="$('#pa_').value=${bal}">Full ${fmt(bal)}</button><button type="button" onclick="$('#pa_').value=${Math.round(bal / 2)}">Half</button></div>
    <label>Paid by</label>${seg('pm', [['cash', '💵 Cash'], ['mobile', '📱 Mobile'], ['bank', '🏦 Bank'], ['card', '💳 Card']], 'cash', 'pmPick')}
    <div id="pmob" hidden>${field('pr', 'Transaction code', '', 'e.g. QJK4X7LM2P')}<label for="ps">Or paste the payment SMS</label><textarea class="in" id="ps" placeholder="Paste the message – I read the amount and code for you"></textarea>
      <button class="btn sm" id="prd" style="margin-top:6px">🔎 Read &amp; check SMS</button><p class="hint" id="pres"></p></div>
    <div id="pbk" hidden>${field('pr2', 'Reference / slip number')}</div>
    ${field('pn', 'Note (optional)')}
    <details style="margin-top:8px"><summary class="hint" style="cursor:pointer">Paid on a different day?</summary>${dateField('pd', 'Date received', D.today)}</details>
    <button class="btn p block" id="pgo" style="margin-top:14px">Record payment</button>`);
  window.pmPick = k => { $('#pmob').hidden = k !== 'mobile'; $('#pbk').hidden = !(k === 'bank' || k === 'card'); };
  $('#prd').onclick = async () => {
    const b = $('#prd'); b.disabled = true;
    try { const r = await api('/api/sms/read', { sms: val('ps') }); if (r.code) $('#pr').value = r.code; if (r.amount) $('#pa_').value = Math.min(r.amount, bal);
      $('#pres').innerHTML = (r.dup ? '⚠ ' + esc(r.warn) : `✅ Read ${m(r.amount)}${r.code ? ' · code ' + esc(r.code) : ''}${r.payer ? ' · from ' + esc(r.payer) : ''}`); }
    catch (e) { $('#pres').textContent = '⚠ ' + e.message; } b.disabled = false;
  };
  $('#pgo').onclick = async () => {
    const b = $('#pgo'); b.disabled = true; const k = segVal('pm');
    const body = { amount: val('pa_'), method: k, ref: k === 'mobile' ? val('pr') : val('pr2'), sms: k === 'mobile' ? val('ps') : '', note: val('pn'), day: val('pd') };
    try { const r = await api(d ? `/api/debt/${d.id}/pay` : `/api/debtor/${o.id}/pay`, body); await load(); openReceipt(null, r); }
    catch (e) { toast(e.message); } b.disabled = false;
  };
}
let LASTRC = null;
function receiptText(r) {
  return `🧾 ${T('Receipt')} ${r.receipt}\n${r.shop || D.shop.name}\n${T('Customer:')} ${r.debtor}\n${T('Received:')} ${m(r.amount)} (${T(METH[r.method] || r.method)})\n${T('Date:')} ${D8(r.day || D.today)}\n${T('Balance left:')} ${m(r.balance)}\n${T(D.settings.receipt_footer || '')}`.trim();
}
function openReceipt(pid, r) {
  if (pid) { const p = D.payments.find(x => x.id === pid), d = byDebt(p.debt_id); r = { receipt: p.receipt, amount: p.amount, method: p.method, debtor: p.name, phone: (byDebtor(p.debtor_id) || {}).phone, day: p.day, balance: d ? d.balance : 0, debtor_id: p.debtor_id, debt_id: p.debt_id }; }
  else { r.day = r.day || D.today; r.debtor_id = r.debtor_id || (r.parts && r.parts[0] ? r.parts[0].debtor_id : 0); }
  LASTRC = r; const txt = receiptText(r);
  sheet(`${head('Payment recorded ✅', 'closeSheet()')}<div class="rcpt"><h3>🧾 ${esc(r.receipt)} · ${esc(D.shop.name)}</h3><div class="big">${m(r.amount)}</div><p>${esc(r.debtor)} · ${METH[r.method] || r.method} · ${D8(r.day)}</p><p class="hint">Balance left: <b>${m(r.balance)}</b></p></div>
    <div class="g2" style="margin-top:12px"><button class="btn wa" onclick="window.open(waLink(LASTRC.phone,receiptText(LASTRC)),'_blank')">💬 Send to customer</button><button class="btn n" onclick="shareText(receiptText(LASTRC))">📤 Share</button><button class="btn" onclick="printReceipt()">🖨 Print</button><button class="btn" onclick="closeSheet()">Done</button></div>`);
}
function printReceipt() { const r = LASTRC; printHTML(`<h1>${esc(D.shop.name)}</h1><p>Payment receipt ${esc(r.receipt)} · ${D8(r.day)}</p><h2>${m(r.amount)}</h2><p>Received from <b>${esc(r.debtor)}</b> by ${METH[r.method] || r.method}</p><p>Balance remaining: <b>${m(r.balance)}</b></p><p>${esc(D.settings.receipt_footer || '')}</p>`); }

/* ---------------------------------------------------------------- NEW DEBT */
function openNewDebt(debtorId) {
  if (!D.debtors.length && !debtorId) { openDebtorForm(0, true); return; }
  const S = D.settings, br = D.shop.branches;
  sheet(`${head('🧾 New debt')}
    <label for="nw">Customer</label><select class="in" id="nw"><option value="">— choose —</option>${D.debtors.map(o => `<option value="${o.id}" ${o.id == debtorId ? 'selected' : ''}>${esc(o.name)}${o.balance > 0 ? ' · owes ' + fmt(o.balance) : ''}</option>`).join('')}<option value="new">➕ New customer…</option></select>
    <div id="nwb" hidden>${field('nwn', 'Customer name')}${field('nwp', 'Phone', '', '07…', 'tel')}</div>
    ${field('nt', 'What was taken? (item / reason)', '', 'e.g. 2 bags of rice')}
    <label for="na">Amount owed</label><input class="in big-in" id="na" inputmode="decimal" placeholder="0">
    ${field('nd', 'Paid now as deposit (optional)', '', '0', 'decimal')}
    <div class="g2">${dateField('ng', 'Date given', D.today)}${dateField('nu', 'Due date', addDays(S.due_days))}</div>
    <div class="seg" style="margin-top:6px">${[[7, '+7 days'], [14, '+14'], [30, '+30'], [60, '+60']].map(([n, t]) => `<button type="button" onclick="$('#nu').value=addDays(${n},$('#ng').value);nPrev()">${t}</button>`).join('')}</div>
    <label for="nplan">How will they pay?</label><select class="in" id="nplan">${[[1, 'One payment on the due date'], [2, '2 instalments'], [3, '3 instalments'], [4, '4 instalments'], [6, '6 instalments'], [8, '8 instalments'], [12, '12 instalments']].map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select>
    <div id="nplb" hidden class="g2">${`<div><label for="nf">Every</label><select class="in" id="nf"><option value="weekly">Week</option><option value="biweekly">2 weeks</option><option value="monthly" selected>Month</option></select></div>`}${dateField('n1', 'First instalment', addDays(S.due_days))}</div>
    <div class="g2">${field('ni', 'Interest % (once)', S.interest_pct || '', '0', 'decimal')}${field('nl', 'Late fee % / month', S.late_pct || '', '0', 'decimal')}</div>
    <div class="banner" id="nprev" style="margin-top:10px;background:var(--chip);color:var(--ink)"></div>
    <details><summary class="hint" style="cursor:pointer">More details</summary>${field('nc', 'Security / pledge (optional)', '', 'e.g. TV, land title')}${field('nr', 'Reference / invoice no.')}${br.length > 1 ? `<label for="nb">Branch</label><select class="in" id="nb">${br.map(b => `<option>${esc(b)}</option>`).join('')}</select>` : ''}<label for="nn">Note</label><textarea class="in" id="nn"></textarea></details>
    <button class="btn n block" id="ngo" style="margin-top:14px">Save debt</button>`);
  window.nPrev = () => {
    const a = parseFloat(val('na')) || 0, i = parseFloat(val('ni')) || 0, n = +val('nplan'), tot = a * (1 + i / 100), dep = parseFloat(val('nd')) || 0, o = byDebtor(val('nw'));
    $('#nplb').hidden = n < 2; $('#nwb').hidden = val('nw') !== 'new';
    let t = a ? `Total to collect: <b>${m(tot)}</b>${dep ? ` · after deposit <b>${m(tot - dep)}</b>` : ''}${n > 1 ? ` · about <b>${m(tot / n)}</b> each` : ''}` : 'Enter the amount to see the total.';
    if (o && o.credit_limit > 0) t += `<br>Credit limit ${m(o.credit_limit)} · already owes ${m(o.balance)}`;
    if (o && o.blocked) t += '<br>🚫 This customer is blocked from credit.';
    $('#nprev').innerHTML = t;
  };
  $$('#sbody input,#sbody select').forEach(e => { e.oninput = nPrev; e.onchange = nPrev; }); nPrev();
  $('#ngo').onclick = async () => {
    const b = $('#ngo'); b.disabled = true;
    try {
      let who = val('nw'); if (!who) throw new Error('Choose the customer first.');
      if (who === 'new') { const r = await postC('/api/debtor', { name: val('nwn'), phone: val('nwp') }); if (!r) { b.disabled = false; return; } who = r.id; }
      const n = +val('nplan');
      const r = await postC('/api/debt', { debtor_id: who, title: val('nt'), amount: val('na'), deposit: val('nd'), given_at: val('ng'), due_at: val('nu'), installments: n > 1 ? n : 0, freq: val('nf'), first_due: val('n1'), interest_pct: val('ni'), late_pct: val('nl'), collateral: val('nc'), ref: val('nr'), branch: val('nb'), note: val('nn') });
      if (!r) { b.disabled = false; return; }
      await load(); toast('Debt saved'); openDebt(r.id);
    } catch (e) { toast(e.message); } b.disabled = false;
  };
}

/* ---------------------------------------------------------------- CUSTOMER */
function openDebtorForm(id, thenDebt) {
  const o = id ? byDebtor(id) : {};
  sheet(`${head(id ? '✏️ Edit customer' : '➕ New customer', id ? `openDebtor(${id})` : '')}${field('cn', 'Name', o.name)}${field('cp', 'Phone', o.phone, '07…', 'tel')}${field('cp2', 'Second phone (optional)', o.phone2, '', 'tel')}${field('ca', 'Home / shop address', o.address)}${field('ci', 'ID number (optional)', o.id_no)}
    <div class="g2">${field('cg', 'Guarantor name', o.guarantor)}${field('cgp', 'Guarantor phone', o.guarantor_phone, '', 'tel')}</div>
    <div class="g2">${field('cl', 'Credit limit (0 = none)', o.credit_limit || '', '0', 'decimal')}${field('ct', 'Group / tag', o.tag, 'e.g. school, taxi')}</div>
    <label for="cno">Note</label><textarea class="in" id="cno">${esc(o.note || '')}</textarea>
    <button class="btn n block" id="cgo" style="margin-top:14px">${id ? 'Save changes' : 'Save customer'}</button>`);
  $('#cgo').onclick = async () => {
    const b = $('#cgo'); b.disabled = true;
    try { const r = await postC('/api/debtor', { id, name: val('cn'), phone: val('cp'), phone2: val('cp2'), address: val('ca'), id_no: val('ci'), guarantor: val('cg'), guarantor_phone: val('cgp'), credit_limit: val('cl'), tag: val('ct'), note: val('cno') }); if (r) { await load(); toast('Saved'); if (thenDebt) openNewDebt(r.id); else openDebtor(r.id); } }
    catch (e) { toast(e.message); } b.disabled = false;
  };
}
function openDebtor(id) {
  const o = byDebtor(id); if (!o) return toast('Customer not found');
  const ds = D.debts.filter(d => d.debtor_id === id && d.state !== 'cancelled'), live = ds.filter(d => LIVE(d.state)), fus = D.followups.filter(f => f.debtor_id === id).slice(0, 8);
  const bad = live.filter(d => d.state === 'overdue').sort((a, b) => b.days_over - a.days_over)[0], rem = bad || live[0];
  sheet(`${head(esc(o.name) + (o.blocked ? ' 🚫' : ''))}
    <div class="who2" style="margin-bottom:8px"><div class="avatar ${o.risk}">${esc(ini(o.name))}</div><div style="flex:1"><div class="mini">${esc(o.phone || 'no phone')}${o.phone2 ? ' · ' + esc(o.phone2) : ''}</div><div class="mini">${esc(o.address || '')}${o.tag ? ' · ' + esc(o.tag) : ''}</div></div><span class="st ${o.risk}">${RK[o.risk]}</span></div>
    <div class="kpis" style="grid-template-columns:1fr 1fr;gap:8px">${[['Owes', m(o.balance)], ['Overdue', m(o.overdue)], ['Total lent', m(o.lent)], ['Total paid', m(o.paid)]].map(([a, b]) => `<div class="kpi" style="padding:10px"><small>${a}</small><span class="num" style="font-size:18px">${b}</span></div>`).join('')}</div>
    <p class="mini">Trust score <b>${o.score}/100</b>${o.broken ? ` · ${o.broken} broken promise${o.broken > 1 ? 's' : ''}` : ''}${o.last_pay ? ` · last paid ${D8(o.last_pay)}` : ''}</p>
    <div class="meter ${o.score < 50 ? 'bad' : o.score < 75 ? 'warn' : ''}"><i style="width:${o.score}%"></i></div>
    ${o.credit_limit > 0 ? `<p class="mini">Credit used ${m(o.balance)} of ${m(o.credit_limit)}</p><div class="meter ${o.balance > o.credit_limit ? 'bad' : ''}"><i style="width:${pct(o.balance, o.credit_limit)}%"></i></div>` : ''}
    <div class="qbtns">${o.phone ? `<a class="btn" href="tel:${esc(o.phone)}">📞 Call</a><a class="btn wa" target="_blank" href="${waLink(o.phone, '')}">💬 Chat</a>` : ''}${o.balance > 0 ? `<button class="btn p" onclick="openPay(0,${id})">✅ Collect</button>` : ''}</div>
    <div class="g2" style="margin-top:8px"><button class="btn n" onclick="openNewDebt(${id})">🧾 New debt</button>${rem ? `<button class="btn" onclick="remind(${rem.id})">🔔 Remind</button>` : '<span></span>'}<button class="btn" onclick="openFollow(${id},0,'call')">📝 Log contact</button><button class="btn" onclick="openStatement(${id})">📄 Statement</button></div>
    ${o.guarantor ? `<h2 style="margin:14px 0 4px;font-size:15px">Guarantor</h2>${kv(esc(o.guarantor), o.guarantor_phone ? `<a href="tel:${esc(o.guarantor_phone)}">${esc(o.guarantor_phone)}</a>` : '—')}` : ''}${o.id_no ? kv('ID number', esc(o.id_no)) : ''}${o.note ? kv('Note', esc(o.note)) : ''}
    <h2 style="margin:14px 0 6px;font-size:15px">Debts</h2>${ds.map(d => `<div class="row" onclick="openDebt(${d.id})"><div class="m"><b>${esc(d.title || 'Credit')}</b><small>${D8(d.given_at)} · ${dueText(d)}</small></div><div><span class="num" style="font-size:18px">${m(LIVE(d.state) ? d.balance : d.total)}</span><span class="st ${d.state}">${ST[d.state]}</span></div></div>`).join('') || '<p class="empty">No debts yet.</p>'}
    ${fus.length ? `<h2 style="margin:14px 0 4px;font-size:15px">Recent contact</h2><div class="tl">${fus.map(f => `<div><b>${KIND[f.kind]}</b>${f.outcome ? ` <span class="st ${f.outcome === 'pending' ? 'partial' : f.outcome}">${f.outcome}</span>` : ''}<small>${dtm(f.created_at)}${f.kind === 'promise' ? ` · ${m(f.promise_amount)} by ${D8(f.promise_date)}` : ''}${f.note ? ' · ' + esc(f.note) : ''}</small></div>`).join('')}</div>` : ''}
    <div class="g2" style="margin-top:14px"><button class="btn sm" onclick="openDebtorForm(${id})">✏️ Edit</button><button class="btn sm ${o.blocked ? '' : 'd'}" onclick="doBlock(${id},${o.blocked ? 0 : 1})">${o.blocked ? '✅ Allow credit again' : '🚫 Block new credit'}</button><button class="btn sm" onclick="doArchive(${id})">🗂 Archive</button></div>`);
}
async function doBlock(id, on) { try { await api(`/api/debtor/${id}/${on ? 'block' : 'unblock'}`, {}); done(on ? 'Customer blocked from new credit' : 'Credit allowed again', () => openDebtor(id)); } catch (e) { toast(e.message); } }
async function doArchive(id) { if (!confirm('Archive this customer? They disappear from your lists (history is kept).')) return; try { await api(`/api/debtor/${id}/archive`, {}); done('Archived'); } catch (e) { toast(e.message); } }
function statementData(id) {
  const o = byDebtor(id), ds = D.debts.filter(d => d.debtor_id === id && d.state !== 'cancelled' && (LIVE(d.state) || d.paid > 0)), pays = D.payments.filter(p => p.debtor_id === id && p.status === 'ok').slice(0, 15);
  return { o, ds, pays, owed: ds.filter(d => LIVE(d.state)).reduce((s, d) => s + d.balance, 0) };
}
function statementText(id) {
  const { o, ds, owed } = statementData(id);
  return `📄 ${T('Statement')} – ${D.shop.name}\n${T('Customer:')} ${o.name}\n${T('Date:')} ${D8(D.today)}\n\n` + ds.filter(d => LIVE(d.state)).map(d => `• ${d.title || T('Credit')} (${D8(d.given_at)}): ${T('Total')} ${m(d.total)}, ${T('Paid')} ${m(d.paid)}, ${T('Balance')} ${m(d.balance)}, ${T('Due')} ${D8(d.next_due)}`).join('\n') + `\n\n${T('Total owed:')} ${m(owed)}\n${D.settings.pay_info || ''}`.trim();
}
function openStatement(id) {
  const { o, ds, pays, owed } = statementData(id);
  sheet(`${head('📄 Statement · ' + esc(o.name), `openDebtor(${id})`)}<div class="tw"><table><tr><th>Item</th><th>Total</th><th>Paid</th><th>Balance</th></tr>${ds.map(d => `<tr><td>${esc(d.title || 'Credit')}<br><small class="mini">${D8(d.given_at)} · ${ST[d.state]}</small></td><td>${fmt(d.total)}</td><td>${fmt(d.paid)}</td><td><b>${fmt(d.balance)}</b></td></tr>`).join('')}</table></div>
    <div class="total" style="margin:12px 0"><small>Total owed</small><span class="num" style="font-size:34px">${m(owed)}</span></div>
    ${pays.length ? `<h2 style="font-size:15px">Payments</h2>${pays.map(p => kv(D8(p.day) + ' · ' + (METH[p.method] || p.method), m(p.amount))).join('')}` : ''}
    <div class="g2" style="margin-top:12px"><button class="btn n" onclick="shareText(statementText(${id}))">📤 Share</button><button class="btn" onclick="printStatement(${id})">🖨 Print</button></div>`);
}
function printStatement(id) {
  const { o, ds, pays, owed } = statementData(id);
  printHTML(`<h1>${esc(D.shop.name)}</h1><p>Statement of account · ${D8(D.today)}</p><h2>${esc(o.name)} ${o.phone ? '· ' + esc(o.phone) : ''}</h2><table><tr><th>Date</th><th>Item</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due</th></tr>${ds.map(d => `<tr><td>${D8(d.given_at)}</td><td>${esc(d.title || 'Credit')}</td><td>${fmt(d.total)}</td><td>${fmt(d.paid)}</td><td>${fmt(d.balance)}</td><td>${LIVE(d.state) ? D8(d.next_due) : ST[d.state]}</td></tr>`).join('')}</table><h2>Total owed: ${m(owed)}</h2>${pays.length ? '<h2>Payments received</h2><table>' + pays.map(p => `<tr><td>${D8(p.day)}</td><td>${METH[p.method] || p.method}</td><td>${p.receipt}</td><td>${fmt(p.amount)}</td></tr>`).join('') + '</table>' : ''}<p>${esc(D.settings.pay_info || '')}</p>`);
}

/* ---------------------------------------------------------------- quick-add menu */
$('#fab').onclick = () => sheet(`${head('Add')}<button class="btn n block" onclick="openNewDebt()">🧾 Record a debt</button><button class="btn p block" style="margin-top:8px" onclick="pickCustomer()">✅ Collect a payment</button><button class="btn block" style="margin-top:8px" onclick="openDebtorForm()">➕ New customer</button>`);
function pickCustomer() {
  const draw = q => { q = (q || '').toLowerCase(); $('#pcl').innerHTML = D.debtors.filter(o => o.balance > 0 && (!q || (o.name + o.phone).toLowerCase().includes(q))).sort((a, b) => b.overdue - a.overdue || b.balance - a.balance).slice(0, 40).map(o => `<div class="row" onclick="openPay(0,${o.id})"><div class="avatar ${o.risk}">${esc(ini(o.name))}</div><div class="m"><b>${esc(o.name)}</b><small>${esc(o.phone || '')}</small></div><span class="num" style="font-size:18px">${m(o.balance)}</span></div>`).join('') || '<p class="empty">Nobody owes you money.</p>'; };
  sheet(`${head('Who paid?', '$(\'#fab\').click()')}<input class="in" id="pcq" placeholder="Search customer" autocomplete="off"><div id="pcl" style="margin-top:10px"></div>`); draw(); $('#pcq').oninput = e => draw(e.target.value);
}

/* ---------------------------------------------------------------- REPORTS */
function vReports() {
  const t = D.today, ms = t.slice(0, 8) + '01';
  $('#v').innerHTML = `<div class="card"><h2>Report period</h2><div class="g2">${dateField('rf', 'From', REP ? REP.frm : ms)}${dateField('rt', 'To', REP ? REP.to : t)}</div>
    <div class="chips"><button class="chip" onclick="rangeSet(0)">Today</button><button class="chip" onclick="rangeSet(6)">7 days</button><button class="chip" onclick="rangeSet('m')">This month</button><button class="chip" onclick="rangeSet(89)">90 days</button><button class="chip" onclick="rangeSet('y')">This year</button></div><button class="btn n block" onclick="loadReport()">Show report</button></div>
    <div id="rep"></div>
    <div class="card"><h2>Age of debts</h2><div class="tw"><table><tr><th>Days overdue</th><th>Amount</th><th>Share</th></tr>${(() => { const tot = D.aging.reduce((s, a) => s + a.v, 0) || 1; return D.aging.map(a => `<tr><td>${a.k === 'current' ? 'Not yet due' : a.k + ' days'}</td><td>${m(a.v)}</td><td>${Math.round(a.v / tot * 100)}%</td></tr>`).join(''); })()}</table></div></div>
    <div class="card"><h2>Download &amp; print</h2><div class="shbtn"><a class="btn n" href="/api/export/debts">⬇ Debts (CSV)</a><a class="btn n" href="/api/export/payments">⬇ Payments (CSV)</a><a class="btn n" href="/api/export/debtors">⬇ Customers (CSV)</a><a class="btn" href="/api/backup">💾 Full backup</a><button class="btn" onclick="printReport()">🖨 Print report</button></div><p class="hint">CSV files open in Excel and Google Sheets.</p></div>`;
  loadReport();
}
function rangeSet(n) {
  const t = D.today; let a = t;
  if (n === 'm') a = t.slice(0, 8) + '01'; else if (n === 'y') a = t.slice(0, 4) + '-01-01'; else a = addDays(-n, t);
  $('#rf').value = a; $('#rt').value = t; loadReport();
}
async function loadReport() {
  try {
    REP = await api(`/api/report?from=${val('rf')}&to=${val('rt')}`); const mx = Math.max(1, ...REP.daily.map(x => x.v)), mm = Math.max(1, ...REP.by_method.map(x => x.v));
    $('#rep').innerHTML = `<div class="kpis">${[['Collected', m(REP.collected)], ['Payments', REP.payments], ['New debts lent', m(REP.lent) + ` <span class="mini">(${REP.new_debts})</span>`], ['Written off', m(REP.written_off)]].map(([a, b]) => `<div class="kpi"><small>${a}</small><span class="num" style="font-size:22px">${b}</span></div>`).join('')}</div>
    <div class="cols"><div class="card"><h2>Collected by day</h2><div class="hr">${REP.daily.map(x => `<i title="${D8(x.k)} – ${fmt(x.v)}" style="height:${x.v / mx * 100}%"></i>`).join('') || ''}</div>${REP.daily.length ? '' : '<p class="empty">No payments in this period.</p>'}</div>
    <div class="card"><h2>How customers paid</h2>${REP.by_method.map(x => `<div class="brow"><span>${METH[x.k] || x.k}</span><i style="width:${x.v / mm * 50}%"></i><b class="num">${fmt(x.v)}</b></div>`).join('') || '<p class="empty">No data.</p>'}</div></div>`;
  } catch (e) { toast(e.message); }
}
function printReport() {
  if (!REP) return; const k = D.kpis;
  printHTML(`<h1>${esc(D.shop.name)} – debt report</h1><p>${D8(REP.frm)} to ${D8(REP.to)}</p><h2>Period</h2>${kv('Collected', m(REP.collected))}${kv('Payments', REP.payments)}${kv('Lent', m(REP.lent))}${kv('Written off', m(REP.written_off))}<h2>Right now</h2>${kv('Total owed to you', m(k.outstanding))}${kv('Overdue', m(k.overdue))}${kv('Customers owing', k.debtors_owing)}${kv('Recovered', k.recovery + '%')}<h2>Age of debts</h2>${D.aging.map(a => kv(a.k + (a.k === 'current' ? '' : ' days'), m(a.v))).join('')}<h2>Biggest balances</h2>${D.debtors.filter(o => o.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 15).map(o => kv(esc(o.name), m(o.balance))).join('')}`);
}

/* ---------------------------------------------------------------- SETTINGS */
function vSettings() {
  const S = D.settings;
  $('#v').innerHTML = `<div class="cols">
  ${ctCard()}
  <div class="card"><h2>⚙️ Collection rules</h2><div class="fgrid">${field('s_due', 'Default days until due', S.due_days, '', 'numeric')}${field('s_int', 'Default interest % (once)', S.interest_pct, '', 'decimal')}${field('s_late', 'Late fee % per month', S.late_pct, '', 'decimal')}${field('s_grace', 'Grace days before late fee', S.grace_days, '', 'numeric')}${field('s_cap', 'Late fee cap (% of amount lent)', S.late_cap_pct, '', 'decimal')}${field('s_soon', '“Due soon” means within (days)', S.due_soon_days, '', 'numeric')}</div><p class="hint">Late fee is charged only on the part that is overdue, after the grace days, and never above the cap. Leave 0 for no late fee.</p></div>
  <div class="card"><h2>📱 Contact details</h2>${field('s_cc', 'Country dial code (e.g. 256, 254, 255)', S.cc, '256', 'numeric')}<p class="hint">Turns 0772… into +256772… so WhatsApp works.</p>${field('s_phone', 'Your shop phone (shown in messages)', S.biz_phone, '', 'tel')}${field('s_pay', 'How customers should pay you', S.pay_info, 'e.g. Pay MTN 0772 000 000 (Mama Joy)')}${field('s_foot', 'Receipt footer', S.receipt_footer)}</div>
  <div class="card"><h2>💬 Reminder messages</h2><p class="hint">Use {name} {balance} {due} {days} {shop} {pay} {phone} {paid}. Clear a box to go back to the default.</p>${[['friendly', '😊 Friendly'], ['firm', '😐 Firm'], ['final', '⚠ Final notice'], ['thanks', '🙏 Thank you']].map(([k, t]) => `<label for="t_${k}">${t}</label><textarea class="in" id="t_${k}">${esc(tplText(k))}</textarea>`).join('')}</div>
  <div class="card"><h2>🔒 Lock this device</h2><p class="hint">Ask for a PIN every time Depta is opened on this phone (protects your customers' data).</p>${LockUI()}</div>
  </div><button class="btn n block" id="s_save" style="margin:12px 0 4px">Save settings</button>`;
  $('#s_save').onclick = async () => {
    const tpl = {}; ['friendly', 'firm', 'final', 'thanks'].forEach(k => tpl[k] = val('t_' + k));
    try { await api('/api/settings', { due_days: val('s_due'), interest_pct: val('s_int'), late_pct: val('s_late'), grace_days: val('s_grace'), late_cap_pct: val('s_cap'), due_soon_days: val('s_soon'), cc: val('s_cc'), biz_phone: val('s_phone'), pay_info: val('s_pay'), receipt_footer: val('s_foot'), tpl }); await load(); toast('Settings saved'); vSettings(); } catch (e) { toast(e.message); }
  };
}


/* ---------------------------------------------------------------- optional link with CTone */
function ctCard() {
  const c = D.ctone;
  if (c.linked) return `<div class="card"><h2>🔗 Connected to CTone</h2><p class="hint">Linked to your CTone shop <b>${esc(c.name)}</b>. Depta still works on its own – this only shares your debts with CTone.</p>
    <p class="mini" style="margin:6px 0">${c.last_sync ? 'Last synced ' + dtm(c.last_sync) : 'Not synced yet'}${c.last_msg ? ' · <span style="color:var(--bad)">' + esc(c.last_msg) + '</span>' : ''}</p>
    <label class="chk"><input type="checkbox" id="ct_sum" ${c.sync_summary ? 'checked' : ''} onchange="ctSet()"> Show my debts summary inside CTone</label>
    <label class="chk"><input type="checkbox" id="ct_pay" ${c.sync_pay ? 'checked' : ''} onchange="ctSet()"> Add repayments I collect to CTone's ledger</label>
    <div class="g2" style="margin-top:10px"><button class="btn n" onclick="openCTone()">Open CTone ↗</button><button class="btn" onclick="ctSync()">⟳ Sync now</button></div>
    <button class="btn d block" style="margin-top:8px" onclick="ctOff()">Disconnect from CTone</button></div>`;
  return `<div class="card"><h2>🔗 Connect to CTone <span class="pill">optional</span></h2><p class="hint">Depta works fine on its own. If you also use CTone, connect it to see your debts inside CTone. You enter your CTone email and password once – they are not saved here.</p>
    ${field('ct_url', 'CTone address', c.default_url, 'https://your-ctone.onrender.com')}${field('ct_em', 'CTone email', '', '', 'email')}<label for="ct_pw">CTone password</label><input class="in" id="ct_pw" type="password" autocomplete="off">
    <button class="btn n block" id="ct_go" style="margin-top:10px" onclick="ctConnect()">Connect</button><p class="hint" id="ct_msg"></p></div>`;
}
async function ctConnect() {
  const b = $('#ct_go'); b.disabled = true; $('#ct_msg').textContent = 'Connecting…';
  try { await api('/api/ctone/connect', { url: val('ct_url'), email: val('ct_em'), password: val('ct_pw') }); await load(); toast('Connected to CTone ✅'); vSettings(); }
  catch (e) { $('#ct_msg').textContent = '⚠ ' + e.message; b.disabled = false; }
}
async function ctSet() { try { await api('/api/ctone/settings', { summary: $('#ct_sum').checked, pay: $('#ct_pay').checked }); toast('Saved'); load(); } catch (e) { toast(e.message); } }
async function ctSync() { try { await api('/api/ctone/sync', {}); toast('Synced with CTone'); await load(); vSettings(); } catch (e) { toast(e.message); } }
async function ctOff() { if (!confirm('Disconnect from CTone? Your Depta data stays. CTone will stop showing your debts.')) return; try { await api('/api/ctone/disconnect', {}); await load(); toast('Disconnected'); vSettings(); } catch (e) { toast(e.message); } }

/* ---------------------------------------------------------------- device PIN lock */
const LK = 'dp_lock';
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('depta:' + s)))].map(x => x.toString(16).padStart(2, '0')).join('');
const lockOn = () => { try { return !!localStorage.getItem(LK) && window.crypto && crypto.subtle; } catch (e) { return false; } };
function LockUI() {
  if (!(window.crypto && crypto.subtle)) return '<p class="hint">PIN lock needs a secure (https) connection.</p>';
  return lockOn() ? '<button class="btn d" onclick="lockOff()">Turn PIN lock off</button>' : `${field('lk1', 'Choose a PIN (4–8 digits)', '', '', 'numeric')}<button class="btn n" style="margin-top:8px" onclick="lockSet()">Turn PIN lock on</button>`;
}
async function lockSet() { const p = val('lk1').replace(/\D/g, ''); if (p.length < 4) return toast('Use at least 4 digits'); localStorage.setItem(LK, await sha(p)); toast('PIN lock is on'); vSettings(); }
function lockOff() { const p = prompt('Enter your PIN to turn the lock off'); if (p === null) return; sha(p.replace(/\D/g, '')).then(h => { if (h === localStorage.getItem(LK)) { localStorage.removeItem(LK); toast('PIN lock off'); vSettings(); } else toast('Wrong PIN'); }); }
function showLock() {
  if (!lockOn() || $('#lockov')) return;
  const o = document.createElement('div'); o.id = 'lockov'; o.style.cssText = 'position:fixed;inset:0;z-index:200;background:linear-gradient(135deg,#0a1a3f,#16358a);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center';
  o.innerHTML = '<img src="/static/icon-192.png" alt="" style="width:84px;height:84px;border-radius:22px"><h2>Depta is locked</h2><input id="lkp" class="in big-in" type="password" inputmode="numeric" autocomplete="off" placeholder="PIN" style="max-width:220px"><button class="btn" id="lkg" style="min-width:160px">Unlock</button><p id="lkm" style="color:#ffb4b4;min-height:20px"></p>';
  document.body.appendChild(o);
  const tryIt = async () => { if (await sha($('#lkp').value.replace(/\D/g, '')) === localStorage.getItem(LK)) o.remove(); else { $('#lkm').textContent = 'Wrong PIN'; $('#lkp').value = ''; } };
  $('#lkg').onclick = tryIt; $('#lkp').onkeydown = e => e.key === 'Enter' && tryIt(); setTimeout(() => $('#lkp') && $('#lkp').focus(), 50);
}
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt && Date.now() - hiddenAt > 120000) showLock(); });
showLock();

/* ---------------------------------------------------------------- start */
live(load, 12000);

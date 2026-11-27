/* Chemistry with Yusuf: study planner (#plan) and interactive periodic table (#ptable). Uses window.CY-style api from index.html. */
(function () {
'use strict';
const CSS = `
.pl-count{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:10px 0}
.pl-count div{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;text-align:center}
.pl-count b{display:block;font:800 clamp(30px,5vw,46px) Poppins;color:var(--cyan2);line-height:1.1}
.pl-week{border:1px solid var(--line);border-radius:16px;background:var(--card);margin:10px 0;overflow:hidden}
.pl-week>summary{list-style:none;cursor:pointer;display:flex;gap:12px;align-items:center;padding:12px 16px;font-weight:700}
.pl-week>summary::-webkit-details-marker{display:none}
.pl-week.now{border:2px solid var(--yel);box-shadow:0 6px 20px rgba(255,210,63,.25)}
.pl-week .wk{flex:none;background:var(--navy);color:#fff;border-radius:10px;padding:3px 10px;font-size:13px}
.pl-week.rev .wk{background:#a16207}
.pl-week .pb{margin-left:auto;width:110px;flex:none;display:grid;gap:4px;text-align:right}
.pl-tasks{padding:0 16px 14px;display:grid;gap:6px}
.pl-task{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:10px;background:var(--bg)}
.pl-task input{width:22px;height:22px;flex:none;margin-top:1px;accent-color:#0b7ea3}
.pl-task.done span{text-decoration:line-through;color:var(--mute)}
.pl-task a{font-weight:700}
.pl-tag{font-size:12px;font-weight:700;border-radius:999px;padding:1px 8px;background:var(--tip);color:var(--cyan2);margin-left:6px;white-space:nowrap}
.pl-tag.soon{background:var(--warn);color:var(--warnl)}.pl-tag.weak{background:var(--badbg);color:var(--bad)}
.pt-wrap{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}
@media (max-width:1000px){.pt-wrap{grid-template-columns:1fr}}
.pt-scroll{overflow-x:auto;padding-bottom:6px}
.pt-grid{display:grid;grid-template-columns:repeat(18,minmax(36px,1fr));gap:4px;min-width:700px;max-width:1180px}
.pt-el{aspect-ratio:1/1.1;border:0;border-radius:7px;padding:3px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;color:#0b1636;cursor:pointer;position:relative;transition:transform .1s,box-shadow .1s;font-family:Inter}
.pt-el:hover,.pt-el:focus-visible{transform:scale(1.12);z-index:2;box-shadow:0 6px 16px rgba(0,0,0,.25)}
.pt-el .z{font-size:clamp(8px,.7vw,10px);opacity:.75;position:absolute;top:2px;left:4px}
.pt-el .s{font:700 clamp(14px,1.5vw,21px) Poppins}
.pt-el .v{font-size:clamp(8px,.75vw,10px);margin-top:2px;opacity:.85;white-space:nowrap}
.pt-el.sel{outline:3px solid var(--ink);outline-offset:1px;z-index:3}
.pt-el.as{box-shadow:inset 0 0 0 2px rgba(10,26,68,.55)}
.pt-el.na{opacity:.35}
.pt-gap{grid-column:1/-1;height:10px}
.pt-lab{font-size:10px;color:var(--mute);display:flex;align-items:center;justify-content:center;text-align:center}
.pt-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:13px;margin:10px 0;align-items:center}
.pt-legend i{display:inline-block;width:14px;height:14px;border-radius:4px;vertical-align:-2px;margin-right:5px}
.pt-grad{height:12px;flex:1 1 200px;border-radius:6px;max-width:320px}
.pt-card{position:sticky;top:84px}
.pt-swipe{display:none;font-size:13px;color:var(--mute);margin:0 0 6px}
@media (max-width:640px){.pt-grid{min-width:580px;grid-template-columns:repeat(18,minmax(29px,1fr));gap:2px}.pt-el .v{display:none}.pt-el .z{font-size:7px;top:1px;left:2px}.pt-swipe{display:block}}
.pt-big{display:flex;gap:14px;align-items:center}
.pt-big .tile{width:86px;height:92px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0b1636;flex:none}
.pt-big .tile b{font:800 34px Poppins}.pt-big .tile span{font-size:12px}
.pt-props{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14.5px;margin-top:10px}
.pt-props dt{color:var(--mute)}.pt-props dd{margin:0;font-weight:600}
.pt-note{background:var(--tip);border-radius:12px;padding:10px 12px;font-size:14px;margin-top:10px}
.pt-chips{display:flex;gap:6px;flex-wrap:wrap}
.pt-chips button{border:2px solid var(--line);background:var(--card);border-radius:999px;padding:6px 12px;font-weight:700;font-size:14px;min-height:38px}
.pt-chips button.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.pt-cmp{display:grid;grid-template-columns:auto 1fr 1fr;gap:4px 12px;font-size:14px}
.pt-cmp .h{font-weight:800}
`;
let A, P, save, esc, app;
const $ = s => document.querySelector(s);
const inject = () => { if (!document.getElementById('ex-css')) { const s = document.createElement('style'); s.id = 'ex-css'; s.textContent = CSS; document.head.appendChild(s) } };

/* =================== STUDY PLANNER =================== */
const DAY = 864e5;
function PL() { P.plan = P.plan || { date: '', series: 'May/June 2027', hrs: 5, done: {} }; return P.plan }
function daysTo(d) { if (!d) return null; const t = new Date(d + 'T09:00:00'); return Math.ceil((t - new Date()) / DAY) }
function weakTopics() {
  const by = {};
  for (const c of Object.values(A.D)) for (const x of c.pp) { if (!(x.id in P.att)) continue; const k = x.lo; by[k] = by[k] || [0, 0, c.n]; by[k][1]++; if (P.att[x.id]) by[k][0]++ }
  return Object.entries(by).filter(([, [r, t]]) => t >= 2 && r / t < 0.6).map(([lo, [r, t, ch]]) => ({ lo, pct: Math.round(r / t * 100), ch })).sort((a, b) => a.pct - b.pct);
}
function buildPlan(pl) {
  const left = daysTo(pl.date); if (left == null || left < 1) return null;
  const weeks = Math.max(1, Math.ceil(left / 7));
  const revW = weeks >= 12 ? 4 : weeks >= 6 ? 2 : weeks >= 3 ? 1 : 0;
  const studyW = Math.max(1, weeks - revW);
  const CH = A.CHAPTERS.map(c => c[0]);
  const perW = CH.length / studyW;
  const plan = [];
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday this week
  const weak = weakTopics();
  for (let w = 0; w < weeks; w++) {
    const from = new Date(+start + w * 7 * DAY), to = new Date(+from + 6 * DAY);
    const tasks = [];
    if (w < studyW) {
      const chs = CH.slice(Math.round(w * perW), Math.round((w + 1) * perW));
      for (const n of chs) {
        const live = A.AVAILABLE.includes(n), t = A.CHAPTERS[n - 1][1], pc = String(n).padStart(2, '0');
        tasks.push({ k: `c${n}n`, h: `Study <a href="#ch${pc}">Chapter ${n}: ${esc(t)}</a> notes and slides`, tag: live ? '' : 'soon' });
        tasks.push({ k: `c${n}f`, h: `Learn the Chapter ${n} <a href="#flash">flashcards</a> and try the <a href="#quiz">topic quiz</a>`, tag: live ? '' : 'soon' });
        if (live) tasks.push({ k: `c${n}c`, h: `Pass the <a href="#game-cert">Chapter ${n} certificate test</a> (7/10 or more)` });
      }
      if (pl.hrs >= 4 && w > 0) tasks.push({ k: `rv${w}`, h: `Review last week's chapter with a <a href="#game-clock">Beat the Clock</a> round` });
    } else {
      const r = w - studyW;
      tasks.push({ k: `m${w}`, h: `Sit a full <a href="#mock">timed Paper 1 mock</a> and review every mistake` });
      tasks.push({ k: `wk${w}`, h: `Revise your <a href="#progress">weak topics</a>, then retake the quiz on them` });
      tasks.push({ k: `pp${w}`, h: `Do one official past paper from your school under exam conditions` });
      if (r === revW - 1) tasks.push({ k: 'final', h: `Final week: flashcards every day, early nights, and check your exam room and time` });
    }
    if (w === 0) weak.slice(0, 3).forEach(x => tasks.unshift({ k: `wk-${x.lo}`, h: `Revise topic ${x.lo} (Chapter ${x.ch}): you're scoring ${x.pct}% on it`, tag: 'weak' }));
    tasks.push({ k: `d${w}`, h: `Do the <a href="#game-daily">daily challenge</a> every day this week` });
    plan.push({ w, from, to, rev: w >= studyW, tasks });
  }
  return { weeks, revW, plan };
}
const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
function planner() {
  const pl = PL();
  const settings = `<div class="card"><h3 style="margin-top:0">Your exam</h3>
    <div class="row"><label class="small">Exam series<br><select class="sel" id="ps">${['Feb/March 2027', 'May/June 2027', 'Oct/Nov 2027', 'Feb/March 2028', 'May/June 2028'].map(s => `<option${pl.series === s ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
    <label class="small">Date of your first AS Chemistry paper<br><input type="date" class="sel" id="pd" value="${pl.date}"></label>
    <label class="small">Study hours per week<br><select class="sel" id="ph">${[2, 3, 4, 5, 6, 8, 10, 12, 15].map(h => `<option${+pl.hrs === h ? ' selected' : ''}>${h}</option>`).join('')}</select></label></div>
    <p class="small muted" style="margin:8px 0 0">Get the exact date from your school's Cambridge exam timetable. Your plan is saved in this browser only.</p></div>`;
  const P2 = buildPlan(pl);
  let body = '';
  if (!pl.date) body = `<div class="card" style="text-align:center"><div style="font-size:48px">📅</div><h2 style="margin-top:6px">Set your exam date to build your plan</h2><p class="muted">Choose your series and the date of your first AS Chemistry paper above.</p></div>`;
  else if (!P2) body = `<div class="card"><h2 style="margin-top:0">Your exam date has passed</h2><p class="muted">Choose your next exam date above to build a new plan.</p></div>`;
  else {
    const left = daysTo(pl.date); const all = P2.plan.flatMap(w => w.tasks.map(t => w.w + ':' + t.k)); const dn = all.filter(k => pl.done[k]).length;
    body = `<div class="pl-count"><div><b>${left}</b>days to go</div><div><b>${P2.weeks}</b>weeks</div><div><b>${P2.weeks - P2.revW}</b>study weeks</div><div><b>${P2.revW}</b>revision weeks</div><div><b>${all.length ? Math.round(dn / all.length * 100) : 0}%</b>of plan done</div></div>
      <p class="muted">Chapters marked <span class="pl-tag soon">coming soon</span> are added to the site one by one, so they'll be ready when you reach them. The last ${P2.revW || 'few'} week${P2.revW === 1 ? '' : 's'} are for mocks, past papers and weak topics.</p>
      ${P2.plan.map(w => { const ks = w.tasks.map(t => w.w + ':' + t.k), d = ks.filter(k => pl.done[k]).length, now = w.w === 0;
        return `<details class="pl-week ${now ? 'now' : ''} ${w.rev ? 'rev' : ''}" ${now ? 'open' : ''}><summary><span class="wk">Week ${w.w + 1}</span><span>${fmt(w.from)} – ${fmt(w.to)}${now ? ' · this week' : ''}${w.rev ? ' · revision' : ''}</span><span class="pb"><span class="small muted">${d}/${ks.length}</span><span class="bar"><i style="width:${ks.length ? d / ks.length * 100 : 0}%"></i></span></span></summary>
          <div class="pl-tasks">${w.tasks.map(t => { const k = w.w + ':' + t.k; return `<label class="pl-task ${pl.done[k] ? 'done' : ''}"><input type="checkbox" data-k="${k}" ${pl.done[k] ? 'checked' : ''}><span>${t.h}${t.tag === 'soon' ? '<span class="pl-tag soon">coming soon</span>' : t.tag === 'weak' ? '<span class="pl-tag weak">weak topic</span>' : ''}</span></label>` }).join('')}</div></details>` }).join('')}`;
  }
  app.innerHTML = `<h1>Exam countdown and study planner</h1><p class="muted">A week-by-week plan to cover all 22 chapters before your exam, with your weak topics added automatically.</p>${settings}<div id="plbody" style="margin-top:14px">${body}</div>`;
  const upd = () => { pl.series = $('#ps').value; pl.date = $('#pd').value; pl.hrs = +$('#ph').value; save(); setTimeout(planner) };
  ['#ps', '#pd', '#ph'].forEach(s => $(s).onchange = upd);
  app.querySelectorAll('.pl-task input').forEach(c => c.onchange = () => { if (c.checked) pl.done[c.dataset.k] = 1; else delete pl.done[c.dataset.k]; save(); c.closest('.pl-task').classList.toggle('done', c.checked);
    const wk = c.closest('.pl-week'); const ins = wk.querySelectorAll('input'); const d = [...ins].filter(i => i.checked).length; wk.querySelector('.pb .small').textContent = `${d}/${ins.length}`; wk.querySelector('.pb i').style.width = d / ins.length * 100 + '%' });
}
function countdownPill() { const pl = P.plan; const d = pl && daysTo(pl.date); if (d == null || d < 0) return `<a class="pill" href="#plan" style="text-decoration:none">📅 Set your exam date and get a study plan</a>`; return `<a class="pill" href="#plan" style="text-decoration:none;background:var(--yel);color:#0a1a44">📅 ${d} day${d === 1 ? '' : 's'} to your exam · open your plan</a>` }

/* =================== PERIODIC TABLE =================== */
let PT = null, cur = 6, mode = 'cat', cmp = [];
const CATC = { 'Alkali metals': '#ffb4a2', 'Alkaline earth metals': '#ffd6a5', 'Transition metals': '#fdffb6', 'Poor metals': '#caffbf', 'Metalloids': '#9bf6ff', 'Nonmetals': '#a0c4ff', 'Halogens': '#bdb2ff', 'Noble gases': '#ffc6ff', 'Lanthanides': '#e9d5ff', 'Actinides': '#d8b4fe' };
const BLKC = { s: '#ffb4a2', p: '#a0c4ff', d: '#fdffb6', f: '#caffbf' };
const PROPS = {
  ie: { l: 'First ionisation energy', u: 'kJ mol⁻¹', f: v => v },
  en: { l: 'Electronegativity (Pauling)', u: '', f: v => v.toFixed(2) },
  r: { l: 'Atomic radius', u: 'pm', f: v => v },
  mp: { l: 'Melting point', u: 'K', f: v => v },
  bp: { l: 'Boiling point', u: 'K', f: v => v },
  d: { l: 'Density', u: 'g cm⁻³', f: v => v < 0.1 ? v.toFixed(4) : v.toFixed(2) },
  ar: { l: 'Relative atomic mass', u: '', f: v => v.toFixed(1) },
};
const heat = t => { const s = [[34, 200, 242], [253, 255, 182], [255, 120, 90]]; const k = t < .5 ? 0 : 1, u = t < .5 ? t * 2 : (t - .5) * 2; const a = s[k], b = s[k + 1]; return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * u)).join(',')})` };
const cfgHTML = ec => (ec || '').split(' ').map(p => { const m = p.match(/^(\[\w+\]|\d[spdf])(\d*)$/); return m ? m[1] + '<sup>' + (m[2] || (m[1][0] === '[' ? '' : '1')) + '</sup>' : p }).join(' ').replace(/<sup><\/sup>/g, '');
function pos(e) {
  if (e.z >= 57 && e.z <= 71) return [e.z - 57 + 3, 9];
  if (e.z >= 89 && e.z <= 103) return [e.z - 89 + 3, 10];
  return [e.g, e.p];
}
function asNote(e) {
  const n = [];
  if (e.p === 3) n.push('Period 3: trends in properties and reactions are in the AS syllabus (topic 9).');
  if (e.g === 2 && e.z >= 12 && e.z <= 56) n.push('Group 2: reactions and trends are in the AS syllabus (topic 10).');
  if (e.g === 17 && e.z >= 17 && e.z <= 53) n.push('Group 17: halogens and halides are in the AS syllabus (topic 11).');
  if (e.z <= 36) n.push('You need to write electronic configurations for elements up to krypton (topic 1).');
  if (e.z === 7 || e.z === 16) n.push('Nitrogen and sulfur compounds are in topic 12.');
  return n;
}
function color(e) {
  if (mode === 'cat') return CATC[e.c] || '#e5e7eb';
  if (mode === 'blk') return BLKC[e.b] || '#e5e7eb';
  const v = e[mode]; if (v == null) return null;
  const vs = PT.map(x => x[mode]).filter(x => x != null); let lo = Math.min(...vs), hi = Math.max(...vs);
  const t = mode === 'd' ? Math.log(v / lo) / Math.log(hi / lo) : (v - lo) / (hi - lo);
  return heat(Math.max(0, Math.min(1, t)));
}
function legend() {
  if (mode === 'cat') return Object.entries(CATC).map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`).join('');
  if (mode === 'blk') return Object.entries(BLKC).map(([k, c]) => `<span><i style="background:${c}"></i>${k}-block</span>`).join('');
  const vs = PT.map(x => x[mode]).filter(x => x != null); const p = PROPS[mode];
  return `<span>${p.f(Math.min(...vs))}</span><span class="pt-grad" style="background:linear-gradient(90deg,${heat(0)},${heat(.5)},${heat(1)})"></span><span>${p.f(Math.max(...vs))} ${p.u}</span><span class="muted">Grey: no data</span>`;
}
function detail(e) {
  const p = (k, s) => e[k] == null ? '–' : s;
  const notes = asNote(e);
  return `<div class="card pt-card" aria-live="polite"><div class="pt-big"><div class="tile" style="background:${CATC[e.c] || '#e5e7eb'}"><span>${e.z}</span><b>${e.s}</b><span>${e.ar ?? ''}</span></div><div><h2 style="margin:0">${e.n}</h2><div class="muted small">${e.c} · ${e.b}-block · ${e.g ? 'Group ' + e.g + ' · ' : ''}Period ${e.p}</div></div></div>
    <dl class="pt-props"><dt>Electronic configuration</dt><dd>${cfgHTML(e.ec)}</dd>
    <dt>Relative atomic mass</dt><dd>${p('ar', e.ar)}</dd>
    <dt>1st ionisation energy</dt><dd>${p('ie', e.ie + ' kJ mol⁻¹')}</dd>
    <dt>Electronegativity</dt><dd>${p('en', e.en)}</dd>
    <dt>Atomic radius</dt><dd>${p('r', e.r + ' pm')}</dd>
    <dt>Melting point</dt><dd>${p('mp', e.mp + ' K (' + Math.round(e.mp - 273) + ' °C)')}</dd>
    <dt>Boiling point</dt><dd>${p('bp', e.bp + ' K (' + Math.round(e.bp - 273) + ' °C)')}</dd>
    <dt>Density</dt><dd>${p('d', PROPS.d.f(e.d || 0) + ' g cm⁻³')}</dd></dl>
    ${notes.length ? `<div class="pt-note"><b>For AS Chemistry</b><br>${notes.join('<br>')}</div>` : ''}
    <div class="row" style="margin-top:10px"><button class="btn alt" id="ptc">${cmp.includes(e.z) ? '✓ In compare' : '+ Compare'}</button></div>
    ${cmp.length === 2 ? cmpHTML() : cmp.length === 1 ? '<p class="small muted">Pick a second element and press Compare.</p>' : ''}</div>`;
}
function cmpHTML() {
  const [a, b] = cmp.map(z => PT[z - 1]);
  const rows = [['Configuration', x => cfgHTML(x.ec)], ['A<sub>r</sub>', x => x.ar], ['1st IE / kJ mol⁻¹', x => x.ie ?? '–'], ['Electronegativity', x => x.en ?? '–'], ['Atomic radius / pm', x => x.r ?? '–'], ['Melting point / K', x => x.mp ?? '–'], ['Density / g cm⁻³', x => x.d == null ? '–' : PROPS.d.f(x.d)]];
  return `<h3>Compare</h3><div class="pt-cmp"><span></span><span class="h">${a.s}</span><span class="h">${b.s}</span>${rows.map(([l, f]) => `<span class="muted">${l}</span><span>${f(a)}</span><span>${f(b)}</span>`).join('')}</div><button class="btn alt" id="ptx" style="margin-top:8px">Clear compare</button>`;
}
const SETS = { 'Period 2': e => e.p === 2, 'Period 3': e => e.p === 3, 'Group 1': e => e.g === 1 && e.z > 1, 'Group 2': e => e.g === 2, 'Group 17': e => e.g === 17, 'Elements 1–36': e => e.z <= 36 };
let tset = 'Period 3', tprop = 'ie';
function trendSVG() {
  const els = PT.filter(SETS[tset]).filter(e => e[tprop] != null); if (els.length < 2) return '<p class="muted">Not enough data.</p>';
  const W = 760, H = 300, m = { l: 56, r: 16, t: 20, b: 42 }; const vs = els.map(e => e[tprop]); let lo = Math.min(...vs), hi = Math.max(...vs); const pad = (hi - lo) * .1 || 1; lo = Math.max(0, lo - pad); hi += pad;
  const x = i => m.l + (W - m.l - m.r) * (els.length === 1 ? .5 : i / (els.length - 1)), y = v => H - m.b - (H - m.t - m.b) * (v - lo) / (hi - lo);
  let g = ''; for (let k = 0; k <= 4; k++) { const v = lo + (hi - lo) * k / 4; g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="var(--mute)">${PROPS[tprop].f(+v.toFixed(tprop === 'en' || tprop === 'd' ? 2 : 0))}</text>` }
  g += `<polyline fill="none" stroke="var(--cyan)" stroke-width="3" points="${els.map((e, i) => x(i) + ',' + y(e[tprop])).join(' ')}"/>`;
  els.forEach((e, i) => { g += `<circle cx="${x(i)}" cy="${y(e[tprop])}" r="6" fill="var(--navy)" stroke="var(--cyan)" stroke-width="2"><title>${e.n}: ${PROPS[tprop].f(e[tprop])} ${PROPS[tprop].u}</title></circle>`; if (els.length <= 12) g += `<text x="${x(i)}" y="${y(e[tprop]) - 12}" text-anchor="middle" font-size="11" fill="var(--mute)">${PROPS[tprop].f(e[tprop])}</text>`;
    if (els.length <= 12 || i % 3 === 0) g += `<text x="${x(i)}" y="${H - m.b + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">${e.s}</text>` });
  g += `<text x="${m.l}" y="12" font-size="12" fill="var(--mute)">${PROPS[tprop].l}${PROPS[tprop].u ? ' / ' + PROPS[tprop].u : ''}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${PROPS[tprop].l} across ${tset}">${g}</svg>`;
}
function ptRender() {
  const cells = []; const at = {}; PT.forEach(e => { const [c, r] = pos(e); at[r + ',' + c] = e });
  for (let r = 1; r <= 10; r++) {
    if (r === 8) { cells.push('<div class="pt-gap"></div>'); continue }
    for (let c = 1; c <= 18; c++) {
      const e = at[r + ',' + c];
      if (e) { const col = color(e); const v = mode in PROPS && e[mode] != null ? PROPS[mode].f(e[mode]) : ''; cells.push(`<button class="pt-el ${e.z === cur ? 'sel' : ''} ${e.z <= 36 ? 'as' : ''} ${col ? '' : 'na'}" style="background:${col || '#e5e7eb'}" data-z="${e.z}" aria-label="${e.n}, atomic number ${e.z}"><span class="z">${e.z}</span><span class="s">${e.s}</span><span class="v">${v}</span></button>`) }
      else if (r === 6 && c === 3) cells.push('<div class="pt-lab">57–71</div>');
      else if (r === 7 && c === 3) cells.push('<div class="pt-lab">89–103</div>');
      else if ((r === 9 || r === 10) && c < 3) cells.push(c === 2 ? `<div class="pt-lab">${r === 9 ? 'La–Lu' : 'Ac–Lr'}</div>` : '<div></div>');
      else cells.push('<div></div>');
    }
  }
  const modes = { cat: 'Category', blk: 'Block', ie: '1st IE', en: 'Electronegativity', r: 'Atomic radius', mp: 'Melting point', d: 'Density' };
  app.innerHTML = `<h1>Interactive periodic table</h1><p class="muted">Tap any element for its data. Colour the table by a property to see the trends. Elements 1–36 (outlined) are the ones you need for electronic configurations at AS.</p>
    <div class="pt-chips" role="group" aria-label="Colour by">${Object.entries(modes).map(([k, l]) => `<button data-mode="${k}" class="${mode === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="pt-legend">${legend()}</div>
    <p class="pt-swipe">👉 Swipe sideways to see the whole table.</p><div class="pt-scroll"><div class="pt-grid">${cells.join('')}</div></div>
    <div class="pt-wrap" style="margin-top:16px"><div>
    <div class="card"><h2 style="margin-top:0">Trends</h2><div class="pt-chips" style="margin-bottom:6px">${Object.keys(SETS).map(k => `<button data-s="${k}" class="${tset === k ? 'on' : ''}">${k}</button>`).join('')}</div>
    <div class="pt-chips">${Object.entries(PROPS).map(([k, p]) => `<button data-p="${k}" class="${tprop === k ? 'on' : ''}">${p.l}</button>`).join('')}</div><div id="ptt" style="margin-top:8px">${trendSVG()}</div></div></div>
    <div id="ptd">${detail(PT[cur - 1])}</div></div>
    <p class="small muted">Data: mendeleev Python package (NIST ionisation energies, Pauling electronegativities, empirical atomic radii). Values may differ slightly from your Data Booklet; always use the Data Booklet values in exams.</p>`;
  app.querySelectorAll('.pt-el').forEach(b => b.onclick = () => { cur = +b.dataset.z; app.querySelectorAll('.pt-el.sel').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); $('#ptd').innerHTML = detail(PT[cur - 1]); wireDetail(); if (innerWidth < 1000) $('#ptd').scrollIntoView({ behavior: 'smooth', block: 'start' }) });
  app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { mode = b.dataset.mode; setTimeout(ptRender) });
  app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { tset = b.dataset.s; app.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b)); $('#ptt').innerHTML = trendSVG() });
  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { tprop = b.dataset.p; app.querySelectorAll('[data-p]').forEach(x => x.classList.toggle('on', x === b)); $('#ptt').innerHTML = trendSVG() });
  wireDetail();
}
function wireDetail() {
  const c = $('#ptc'); if (c) c.onclick = () => { if (cmp.includes(cur)) cmp = cmp.filter(z => z !== cur); else { cmp.push(cur); if (cmp.length > 2) cmp.shift() } $('#ptd').innerHTML = detail(PT[cur - 1]); wireDetail() };
  const x = $('#ptx'); if (x) x.onclick = () => { cmp = []; $('#ptd').innerHTML = detail(PT[cur - 1]); wireDetail() };
}
async function ptable() {
  if (!PT) PT = (typeof EMBPT !== 'undefined') ? EMBPT : await (await fetch('ptable.json')).json();
  ptRender();
}

window.EXTRAS = async function (h, api) {
  A = api; P = api.P; save = api.save; esc = api.esc; app = api.app; inject();
  if (h === 'plan') { await api.loadAll(); return planner() }
  if (h === 'ptable') return ptable();
};
window.EXTRAS.countdownPill = api => { P = api.P; return countdownPill() };
})();

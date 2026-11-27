/* Chemistry with Yusuf: game arcade (Beat the Clock, Chemistry Millionaire, Match-Up, Head-to-Head) + XP, levels, badges.
   Uses the site's own question data through window.CY (exposed by index.html). */
(function () {
'use strict';
const CSS = `
.gm-hero{background:linear-gradient(135deg,#0a1a44,#13306f 60%,#0b7ea3);color:#fff;border-radius:22px;padding:clamp(18px,3vw,32px);display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center}
.gm-hero h1{color:#fff;margin:0 0 6px}.gm-hero p{margin:0;color:#cfe2ff}
.gm-lvl{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:14px 18px;min-width:230px}
.gm-lvl b{font:700 30px Poppins;color:var(--yel)}.gm-xpbar{height:12px;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden;margin-top:8px}
.gm-xpbar i{display:block;height:100%;background:linear-gradient(90deg,var(--cyan),var(--yel));transition:width .6s}
.gm-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:18px}
.gm-card{display:flex;flex-direction:column;gap:6px;text-decoration:none;color:var(--ink);position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
.gm-card:hover{transform:translateY(-3px);box-shadow:0 12px 30px rgba(10,26,68,.14)}
.gm-card .ic{font-size:40px;line-height:1}.gm-card h3{margin:4px 0 0}.gm-card .best{margin-top:auto;font-size:14px;color:var(--mute)}
.gm-badges{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-top:10px}
.gm-badge{border:2px dashed var(--line);border-radius:14px;padding:10px;text-align:center;font-size:13px;color:var(--mute)}
.gm-badge .e{font-size:28px;display:block;filter:grayscale(1);opacity:.4}.gm-badge.got{border-style:solid;border-color:var(--yel);color:var(--ink);background:light-dark(#fffbea,#2a2306)}
.gm-badge.got .e{filter:none;opacity:1}
.gm-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.gm-chip{display:inline-flex;align-items:center;gap:6px;background:var(--card);border:2px solid var(--line);border-radius:999px;padding:6px 14px;font-weight:700}
.gm-chip.hot{border-color:var(--yel);background:light-dark(#fff7d1,#3a3008)}
.gm-q{font-size:clamp(18px,2.2vw,22px);line-height:1.5;margin-bottom:14px}
.gm-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
@media (max-width:640px){.gm-opts{grid-template-columns:1fr}.gm-hero{grid-template-columns:1fr}}
.gm-opt{display:flex;gap:10px;align-items:center;text-align:left;width:100%;border:2px solid var(--line);background:var(--card);border-radius:14px;padding:12px 14px;min-height:56px;font-size:17px;transition:transform .08s,border-color .15s}
.gm-opt:hover:not(:disabled){border-color:var(--cyan);transform:translateY(-1px)}
.gm-opt .k{flex:none;width:32px;height:32px;border-radius:50%;background:var(--navy);color:#fff;display:grid;place-items:center;font-weight:700}
.gm-opt.ok{border-color:var(--ok);background:var(--okbg)}.gm-opt.bad{border-color:var(--bad);background:var(--badbg)}.gm-opt.gone{opacity:.15;pointer-events:none}
.gm-opt:disabled{cursor:default}
.gm-ohead{display:flex;gap:10px;align-items:center;padding:0 14px;border:2px solid transparent;font-size:13px;font-weight:700;color:var(--mute)}
.gm-thead{display:grid;grid-template-columns:42px repeat(var(--n),1fr);gap:6px;font-size:13px;color:var(--mute);font-weight:700;padding:0 14px 4px}
.gm-trow{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:6px;width:100%}
.gm-timer{position:relative;width:74px;height:74px;flex:none}.gm-timer svg{transform:rotate(-90deg)}
.gm-timer b{position:absolute;inset:0;display:grid;place-items:center;font:700 22px Poppins}
.gm-fb{min-height:28px;font-weight:700;margin-top:10px}.gm-fb.ok{color:var(--ok)}.gm-fb.bad{color:var(--bad)}
.gm-pop{position:fixed;pointer-events:none;font:800 26px Poppins;color:var(--yel);text-shadow:0 2px 6px rgba(0,0,0,.4);animation:gmpop .9s ease-out forwards;z-index:60}
@keyframes gmpop{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(-60px) scale(1.4)}}
.gm-shake{animation:gmshake .35s}@keyframes gmshake{0%,100%{transform:none}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.gm-ladder{display:flex;flex-direction:column-reverse;gap:4px;font-size:14px}
.gm-ladder div{display:flex;justify-content:space-between;padding:5px 10px;border-radius:8px;color:var(--mute)}
.gm-ladder .safe{font-weight:700;color:var(--ink)}.gm-ladder .cur{background:var(--yel);color:#0a1a44;font-weight:800}.gm-ladder .done{color:var(--ok)}
.gm-life{display:flex;gap:8px;flex-wrap:wrap}.gm-life button{border:2px solid var(--line);background:var(--card);border-radius:999px;padding:8px 14px;font-weight:700;min-height:44px}
.gm-life button:disabled{opacity:.35;text-decoration:line-through}
.gm-cols{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:20px}@media (max-width:860px){.gm-cols{grid-template-columns:1fr}.gm-ladder{display:none}}
.gm-match{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gm-tile{border:2px solid var(--line);background:var(--card);border-radius:14px;padding:12px;text-align:left;min-height:64px;font-size:15px;width:100%;transition:all .15s}
.gm-tile.sel{border-color:var(--cyan);box-shadow:0 0 0 3px light-dark(#c8f1fd,#0d3a52)}
.gm-tile.done{border-color:var(--ok);background:var(--okbg);opacity:.55;pointer-events:none}.gm-tile.bad{border-color:var(--bad);background:var(--badbg)}
.gm-tile.term{font-weight:700}
.gm-duel{display:grid;grid-template-rows:auto auto auto;gap:12px}
.gm-pl{border-radius:18px;padding:14px;color:#fff}.gm-pl.p1{background:linear-gradient(135deg,#0b7ea3,#22c8f2)}.gm-pl.p2{background:linear-gradient(135deg,#a16207,#f59e0b)}
.gm-pl .hd{display:flex;justify-content:space-between;align-items:center;font:700 18px Poppins;margin-bottom:8px}
.gm-pl .hd b{font-size:30px}
.gm-pl .btns{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.gm-pl button{border:0;border-radius:14px;min-height:64px;font:800 26px Poppins;background:rgba(255,255,255,.92);color:#0a1a44}
.gm-pl button:disabled{opacity:.35}.gm-pl.locked{filter:grayscale(.7)}
.gm-pl .keys{font-size:12px;opacity:.85;margin-top:6px}
@media (max-width:640px){.gm-pl.p2.flip{transform:rotate(180deg)}}
.gm-big{font:800 clamp(40px,8vw,72px) Poppins;color:var(--cyan2);line-height:1}
.gm-review details{border:1px solid var(--line);border-radius:12px;padding:10px 14px;margin:8px 0;background:var(--card)}
.gm-review summary{cursor:pointer;font-weight:700}
.gm-src{font-size:13px;color:var(--mute);margin-top:10px}
.gm-mute{margin-left:auto}
#gm-confetti{position:fixed;inset:0;pointer-events:none;z-index:70}
`;
let CY, P, save, esc, strip, app;
const $ = s => document.querySelector(s);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a };
const pick = (a, n) => shuffle(a).slice(0, n);

/* ---------- state ---------- */
function G() { P.games = P.games || { xp: 0, best: {}, badges: [], played: {}, sound: true }; return P.games }
const LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000];
const TITLES = ['Lab Newcomer', 'Bench Assistant', 'Proton Counter', 'Isotope Hunter', 'Mole Apprentice', 'Formula Fixer', 'Equation Balancer',
  'Titration Pro', 'Stoichiometry Star', 'Mole Master', 'Element Expert', 'Reaction Wizard', 'Chemistry Champion', 'Lab Legend', 'Nobel Hopeful', 'Grandmaster Chemist'];
function level(xp) { let l = 0; while (l + 1 < LEVELS.length && xp >= LEVELS[l + 1]) l++; const a = LEVELS[l], b = LEVELS[l + 1] || a + 2000; return { l: l + 1, title: TITLES[l], pct: Math.min(100, (xp - a) / (b - a) * 100), next: b - xp } }
const BADGES = [
  ['first', '🎮', 'First game', 'Finish any game'],
  ['streak5', '🔥', 'On fire', 'Get 5 right in a row'],
  ['streak10', '☄️', 'Unstoppable', 'Get 10 right in a row'],
  ['clock15', '⏱️', 'Speed chemist', 'Score 15+ correct in Beat the Clock'],
  ['ladder5', '🪜', 'Halfway up', 'Reach rung 5 in Millionaire'],
  ['ladder10', '🏆', 'Millionaire', 'Win all 10 rungs'],
  ['match0', '🧩', 'Perfect match', 'Finish Match-Up with no mistakes'],
  ['duel', '⚔️', 'Duellist', 'Play a Head-to-Head game'],
  ['ch1', '⚛️', 'Atom explorer', 'Win 20 XP on Chapter 1 questions'],
  ['ch2', '⚖️', 'Mole master', 'Win 20 XP on Chapter 2 questions'],
  ['xp1000', '💎', '1000 XP', 'Reach 1000 XP'],
  ['allgames', '🌟', 'All-rounder', 'Play all four games'],
  ['perfect5', '🎯', 'Perfect day', 'Score 5/5 in a daily challenge'],
  ['day3', '📅', '3-day streak', 'Do the daily challenge 3 days in a row'],
  ['day7', '🗓️', '7-day streak', 'Do the daily challenge 7 days in a row'],
  ['cert', '🎓', 'Certified', 'Earn a chapter certificate'],
];
let toastT;
function toast(html) { let t = $('#gm-toast'); if (!t) { t = document.createElement('div'); t.id = 'gm-toast'; t.setAttribute('role', 'status'); t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#0a1a44;color:#fff;padding:12px 18px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.3);z-index:80;font-weight:700;max-width:92vw'; document.body.appendChild(t) } t.innerHTML = html; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', 3200) }
function badge(id) { const g = G(); if (g.badges.includes(id)) return; g.badges.push(id); save(); const b = BADGES.find(x => x[0] === id); if (b) { toast(`${b[1]} Badge unlocked: <b>${b[2]}</b>`); sfx('badge') } }
function addXP(n, ch) { const g = G(); const before = level(g.xp).l; g.xp += n; if (ch) { g.chxp = g.chxp || {}; g.chxp[ch] = (g.chxp[ch] || 0) + n; if (g.chxp[ch] >= 20) badge('ch' + ch) } if (g.xp >= 1000) badge('xp1000'); save(); const after = level(g.xp); if (after.l > before) { setTimeout(() => toast(`⬆️ Level ${after.l}: <b>${after.title}</b>`), 900); confetti() } }
function played(game) { const g = G(); g.played[game] = (g.played[game] || 0) + 1; badge('first'); if (['clock', 'ladder', 'match', 'duel'].every(k => g.played[k])) badge('allgames'); save() }

/* ---------- sound + effects ---------- */
let AC;
function sfx(kind) {
  if (!G().sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [[660, .08], [880, .12]], bad: [[220, .18]], tick: [[1200, .03]], badge: [[523, .1], [659, .1], [784, .1], [1047, .2]], win: [[523, .12], [659, .12], [784, .12], [1047, .3]], lose: [[392, .15], [330, .15], [262, .3]] }[kind] || [];
    let t = AC.currentTime;
    for (const [f, d] of notes) { const o = AC.createOscillator(), g = AC.createGain(); o.type = kind === 'bad' || kind === 'lose' ? 'sawtooth' : 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d); t += d * .9 }
  } catch (e) { }
}
function pop(text, el) { const r = (el || document.body).getBoundingClientRect(); const s = document.createElement('div'); s.className = 'gm-pop'; s.textContent = text; s.style.left = (r.left + r.width / 2 - 20) + 'px'; s.style.top = (r.top + 10) + 'px'; document.body.appendChild(s); setTimeout(() => s.remove(), 900) }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let c = $('#gm-confetti'); if (!c) { c = document.createElement('canvas'); c.id = 'gm-confetti'; document.body.appendChild(c) }
  const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#22c8f2', '#ffd23f', '#0a1a44', '#4ade80', '#f87171'];
  const ps = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 2, s: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * 5)], r: Math.random() * 6 }));
  let f = 0; (function step() { x.clearRect(0, 0, c.width, c.height); ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; p.r += .2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); x.restore() }); if (++f < 110) requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height) })();
}

/* ---------- question pool ---------- */
let POOL = [], FLASH = [];
async function loadPool() {
  const chs = await CY.loadAll();
  POOL = []; FLASH = [];
  for (const c of chs) {
    for (const x of c.pp) {
      if (x.type !== 'MCQ') continue;
      if (x.table) POOL.push({ ch: c.n, lo: x.lo, diff: x.diff || 'Medium', stem: x.stem, head: x.table.head, rows: x.table.rows, a: 'ABCD'.indexOf(x.a), exp: x.exp, mis: x.mis, skill: x.skill, ref: x.ref, src: 'pp' });
      else if (x.opts) POOL.push({ ch: c.n, lo: x.lo, diff: x.diff || 'Medium', stem: x.stem, opts: x.opts, a: 'ABCD'.indexOf(x.a), exp: x.exp, mis: x.mis, skill: x.skill, ref: x.ref, src: 'pp' });
    }
    for (const q of (c.assessment || [])) POOL.push({ ch: c.n, lo: '', diff: 'Medium', stem: q.q, opts: q.o, a: q.a, exp: q.why, mis: '', skill: 'Chapter ' + c.n + ' check', ref: '', src: 'assess' });
    for (const f of c.flash) FLASH.push({ ch: c.n, q: f.q, a: f.a });
  }
}
const chList = () => { const a = CY.AVAILABLE; return a.length === 1 ? 'Chapter ' + a[0] : `Chapters ${a[0]}–${a[a.length - 1]}` };
const chSel = () => { const v = sessionStorage.getItem('gm-ch'); return v ? +v : 0 };
const pool = () => { const c = chSel(); return POOL.filter(q => !c || q.ch === c) };
const flashPool = () => { const c = chSel(); return FLASH.filter(q => !c || q.ch === c) };
const diffRank = d => ({ Easy: 0, Medium: 1, Hard: 2 }[d] ?? 1);

function optsHTML(q, cls = 'gm-opt') {
  if (q.rows) {
    const n = q.head.length;
    return `<div class="gm-opts" style="grid-template-columns:1fr"><div class="gm-ohead" aria-hidden="true"><span class="k" style="visibility:hidden;height:0"></span><span class="gm-trow" style="--n:${n}">${q.head.map(h => `<span>${h}</span>`).join('')}</span></div>` +
      q.rows.map((r, i) => `<button class="${cls}" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span class="gm-trow" style="--n:${n}">${r.map(c => `<span>${c}</span>`).join('')}</span></button>`).join('') + '</div>';
  }
  return `<div class="gm-opts">${q.opts.map((o, i) => `<button class="${cls}" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${o}</span></button>`).join('')}</div>`;
}
const srcLine = q => q.ref ? `<div class="gm-src">Original practice question testing the same skill as ${esc(q.ref)}.</div>` : '';
function chapterPicker() {
  const c = chSel();
  return `<label class="gm-chip">Questions from <select id="gm-ch" class="sel" style="border:0;background:transparent;font-weight:700">
    <option value="0"${!c ? ' selected' : ''}>${chList()}</option>${CY.AVAILABLE.map(n => `<option value="${n}"${c === n ? ' selected' : ''}>Chapter ${n} only</option>`).join('')}</select></label>`;
}
function wirePicker(rerender) { const s = $('#gm-ch'); if (s) s.onchange = () => { sessionStorage.setItem('gm-ch', s.value); rerender() } }
function soundBtn() { return `<button class="gm-chip gm-mute" id="gm-snd" aria-pressed="${G().sound}">${G().sound ? '🔊 Sound on' : '🔇 Sound off'}</button>` }
function wireSound() { const b = $('#gm-snd'); if (b) b.onclick = () => { const g = G(); g.sound = !g.sound; save(); b.textContent = g.sound ? '🔊 Sound on' : '🔇 Sound off'; b.setAttribute('aria-pressed', g.sound) } }
const back = `<a href="#games" class="btn alt" style="text-decoration:none">← Games</a>`;
function keysFor(handler) { window.onkeydown = e => { if (e.target.matches('input,select,textarea')) return; const k = e.key.toUpperCase(); const i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'ABCD'.indexOf(k); if (i >= 0 && k.length === 1) handler(i, e) } }

/* ---------- hub ---------- */
function hub() {
  const g = G(), L = level(g.xp);
  const cards = [
    ['#game-clock', '⏱️', 'Beat the Clock', '60 seconds of rapid-fire questions. Build a streak for up to ×4 points, but a wrong answer costs 3 seconds.', g.best.clock != null ? `Best: ${g.best.clock} points` : 'Not played yet'],
    ['#game-ladder', '🪜', 'Chemistry Millionaire', 'Climb 10 rungs of harder and harder questions. Three lifelines: 50:50, hint and swap.', g.best.ladder != null ? `Best: rung ${g.best.ladder} of 10` : 'Not played yet'],
    ['#game-match', '🧩', 'Match-Up', 'Pair each key term with its meaning as fast as you can. Three rounds, against the clock.', g.best.match != null ? `Best: ${g.best.match} points` : 'Not played yet'],
    ['#game-cert', '🎓', 'Chapter certificates', 'Pass a 10-question chapter test with 7 or more to earn a certificate with your name. Download or print it.', Object.keys(G().certs || {}).length ? `${Object.keys(G().certs).length} certificate${Object.keys(G().certs).length > 1 ? 's' : ''} earned` : 'None yet'],
    ['#game-duel', '⚔️', 'Head-to-Head', 'Two players, one screen. First to tap the right answer wins the point. Great for class.', g.played.duel ? `Played ${g.played.duel} time${g.played.duel > 1 ? 's' : ''}` : 'Not played yet'],
  ];
  app.innerHTML = `<div class="gm-hero"><div><span class="pill" style="background:#1b3478;color:#bfefff">${chList()} · ${POOL.length} questions · ${FLASH.length} key terms</span><h1>Chemistry games</h1><p>Learn by playing. Every correct answer earns XP, and XP raises your level.</p></div>
    <div class="gm-lvl" aria-label="Your level"><div class="small" style="color:#cfe2ff">Level</div><b>${L.l}</b> <span style="font-weight:700">${L.title}</span><div class="gm-xpbar"><i style="width:${L.pct}%"></i></div><div class="small" style="color:#cfe2ff;margin-top:6px">${g.xp} XP · ${L.next > 0 ? L.next + ' XP to next level' : 'Top level!'}</div></div></div>
    <div class="gm-cards">${dailyCard()}${cards.map(([h, ic, t, d, b]) => `<a class="card gm-card" href="${h}"><span class="ic" aria-hidden="true">${ic}</span><h3>${t}</h3><p class="muted small" style="margin:0">${d}</p><span class="best">${b}</span></a>`).join('')}</div>
    <h2>Badges <span class="muted" style="font-size:18px">${g.badges.length} / ${BADGES.length}</span></h2>
    <div class="gm-badges">${BADGES.map(([id, e, t, d]) => `<div class="gm-badge ${g.badges.includes(id) ? 'got' : ''}" title="${esc(d)}"><span class="e" aria-hidden="true">${e}</span><b>${t}</b><div>${d}</div></div>`).join('')}</div>
    <p class="small muted" style="margin-top:18px">XP, levels and badges are saved in this browser only.</p>`;
}

/* ---------- Beat the Clock ---------- */
function clock() {
  const intro = () => {
    app.innerHTML = `<div class="gm-bar">${back}${chapterPicker()}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:640px;margin:0 auto"><div style="font-size:56px">⏱️</div><h1>Beat the Clock</h1>
      <p class="muted">Answer as many questions as you can in <b>60 seconds</b>. Each correct answer scores 10 points × your combo. Get 3 in a row for ×2, 6 for ×3, 9 for ×4. A wrong answer costs <b>3 seconds</b> and resets your combo.</p>
      <p class="small muted">Keyboard: press 1–4 or A–D.</p><button class="btn y" id="go" style="font-size:20px;padding:14px 32px">Start</button>${G().best.clock != null ? `<p class="small muted">Your best: ${G().best.clock} points</p>` : ''}</div>`;
    wirePicker(intro); wireSound(); $('#go').onclick = run;
  };
  const run = () => {
    let qs = shuffle(pool()), qi = 0, score = 0, streak = 0, bestStreak = 0, right = 0, wrongList = [], t = 60, lock = false, xpCh = {};
    const T0 = 60, R = 32, C = 2 * Math.PI * R;
    app.innerHTML = `<div class="gm-bar"><a href="#games" class="btn alt" style="text-decoration:none">✕ Quit</a>
      <div class="gm-timer" aria-label="Time left"><svg width="74" height="74"><circle cx="37" cy="37" r="${R}" fill="none" stroke="var(--line)" stroke-width="7"/><circle id="ring" cx="37" cy="37" r="${R}" fill="none" stroke="var(--cyan)" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg><b id="tt">60</b></div>
      <span class="gm-chip">Score <b id="sc">0</b></span><span class="gm-chip" id="cb">Combo ×1</span><span class="gm-chip">Correct <b id="rt">0</b></span>${soundBtn()}</div>
      <div class="card" id="qcard"><div id="qbox"></div><div class="gm-fb" id="fb" aria-live="polite"></div></div>`;
    wireSound();
    const mult = () => streak >= 9 ? 4 : streak >= 6 ? 3 : streak >= 3 ? 2 : 1;
    const show = () => { if (qi >= qs.length) { qs = shuffle(pool()); qi = 0 } const q = qs[qi]; $('#qbox').innerHTML = `<div class="gm-q">${q.stem}</div>${optsHTML(q)}`; lock = false;
      $('#qbox').querySelectorAll('.gm-opt').forEach(b => b.onclick = () => answer(+b.dataset.i, b)) };
    const answer = (i, btn) => {
      if (lock || t <= 0) return; lock = true; const q = qs[qi]; const bs = $('#qbox').querySelectorAll('.gm-opt'); btn = btn || bs[i]; if (!btn) { lock = false; return }
      if (i === q.a) { streak++; right++; bestStreak = Math.max(bestStreak, streak); const pts = 10 * mult(); score += pts; xpCh[q.ch] = (xpCh[q.ch] || 0) + 2; btn.classList.add('ok'); pop('+' + pts, btn); sfx('ok'); $('#fb').className = 'gm-fb ok'; $('#fb').textContent = streak >= 3 ? `Correct! ${streak} in a row 🔥` : 'Correct!';
        if (streak === 5) badge('streak5'); if (streak === 10) badge('streak10') }
      else { streak = 0; t = Math.max(0, t - 3); bs[q.a].classList.add('ok'); btn.classList.add('bad'); $('#qcard').classList.remove('gm-shake'); void $('#qcard').offsetWidth; $('#qcard').classList.add('gm-shake'); sfx('bad'); wrongList.push(q); $('#fb').className = 'gm-fb bad'; $('#fb').textContent = '✘ −3 seconds' }
      bs.forEach(b => b.disabled = true);
      $('#sc').textContent = score; $('#rt').textContent = right; $('#cb').textContent = 'Combo ×' + mult(); $('#cb').classList.toggle('hot', mult() > 1);
      setTimeout(() => { qi++; if (t > 0) show() }, i === q.a ? 450 : 1100);
    };
    keysFor(i => answer(i));
    show();
    const iv = setInterval(() => {
      if (!document.getElementById('tt')) { clearInterval(iv); return }
      t = Math.max(0, t - 1); $('#tt').textContent = t; $('#ring').setAttribute('stroke-dashoffset', C * (1 - t / T0)); $('#ring').setAttribute('stroke', t <= 10 ? 'var(--bad)' : 'var(--cyan)');
      if (t <= 10 && t > 0) sfx('tick');
      if (t <= 0) { clearInterval(iv); window.onkeydown = null; end() }
    }, 1000);
    const end = () => {
      const g = G(), prev = g.best.clock, nb = prev == null || score > prev; if (nb) g.best.clock = score; save();
      const xp = Object.values(xpCh).reduce((a, b) => a + b, 0) + 5; Object.entries(xpCh).forEach(([c, v]) => addXP(v, +c)); addXP(5); played('clock'); if (right >= 15) badge('clock15');
      sfx(nb && score > 0 ? 'win' : 'lose'); if (nb && score > 0) confetti();
      app.innerHTML = `<div class="card" style="text-align:center;max-width:720px;margin:0 auto"><div style="font-size:50px">${nb && score > 0 ? '🏆' : '⏱️'}</div><h1>Time's up!</h1><div class="gm-big">${score}</div><p class="muted">points${nb && score > 0 ? ' · <b style="color:var(--ok)">New personal best!</b>' : prev != null ? ` · best ${prev}` : ''}</p>
        <p>${right} correct · best streak ${bestStreak} · <b>+${xp} XP</b></p><div class="row" style="justify-content:center"><button class="btn y" id="again">Play again</button>${back}</div></div>
        ${wrongList.length ? `<div class="gm-review" style="max-width:720px;margin:18px auto"><h2>Learn from your mistakes</h2>${wrongList.map(q => `<details><summary>${strip(q.stem).slice(0, 110)}…</summary><p><b>Answer: ${'ABCD'[q.a]}</b></p><p>${q.exp}</p>${q.mis ? `<p class="small"><b>Watch out:</b> ${q.mis}</p>` : ''}${srcLine(q)}</details>`).join('')}</div>` : ''}`;
      $('#again').onclick = run;
    };
  };
  intro();
}

/* ---------- Chemistry Millionaire ---------- */
function ladder() {
  const PRIZES = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000], SAFE = [2, 5];
  const intro = () => {
    app.innerHTML = `<div class="gm-bar">${back}${chapterPicker()}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:680px;margin:0 auto"><div style="font-size:56px">🪜</div><h1>Chemistry Millionaire</h1>
      <p class="muted">Answer 10 questions, getting harder as you climb. Rungs 3 and 6 are <b>safe levels</b>: if you get a question wrong, you drop back to the last safe level you passed. You can walk away with your points at any time.</p>
      <p>Lifelines (one use each): <b>50:50</b> removes two wrong answers · <b>Hint</b> shows the skill being tested · <b>Swap</b> gives you a different question.</p>
      <button class="btn y" id="go" style="font-size:20px;padding:14px 32px">Start climbing</button>${G().best.ladder != null ? `<p class="small muted">Your best: rung ${G().best.ladder}</p>` : ''}</div>`;
    wirePicker(intro); wireSound(); $('#go').onclick = run;
  };
  const run = () => {
    const P0 = pool(); const by = [0, 1, 2].map(d => shuffle(P0.filter(q => diffRank(q.diff) === d)));
    const plan = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2]; const used = new Set();
    const draw = d => { for (const dd of [d, 1, 0, 2]) { const q = by[dd].find(q => !used.has(q)); if (q) { used.add(q); return q } } return null };
    let rung = 0, q = draw(plan[0]), life = { fifty: 1, hint: 1, swap: 1 }, lock = false, xpCh = {};
    const safeBank = () => { let s = 0; SAFE.forEach(i => { if (rung > i) s = PRIZES[i] }); return s };
    const render = () => {
      app.innerHTML = `<div class="gm-bar"><a href="#games" class="btn alt" style="text-decoration:none">✕ Quit</a><span class="gm-chip">Question <b>${rung + 1}</b> / 10</span><span class="gm-chip">Playing for <b>${PRIZES[rung].toLocaleString()}</b></span>${soundBtn()}</div>
        <div class="gm-cols"><div class="card" id="qcard"><div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="pill">${q.diff}${q.lo ? ' · Topic ' + q.lo : ''}</span>
        <div class="gm-life"><button id="l50" ${life.fifty ? '' : 'disabled'}>50:50</button><button id="lh" ${life.hint ? '' : 'disabled'}>💡 Hint</button><button id="ls" ${life.swap ? '' : 'disabled'}>🔄 Swap</button></div></div>
        <div class="gm-q">${q.stem}</div>${optsHTML(q)}<div class="gm-fb" id="fb" aria-live="polite"></div><div id="more"></div>
        <div class="row" style="margin-top:10px"><button class="btn alt" id="walk">Walk away with ${rung ? PRIZES[rung - 1].toLocaleString() : 0}</button></div></div>
        <div class="card gm-ladder" aria-label="Prize ladder">${PRIZES.map((p, i) => `<div class="${i === rung ? 'cur' : i < rung ? 'done' : ''} ${SAFE.includes(i) ? 'safe' : ''}"><span>${i + 1}${SAFE.includes(i) ? ' 🛡️' : ''}</span><span>${p.toLocaleString()}</span></div>`).join('')}</div></div>`;
      wireSound(); lock = false;
      app.querySelectorAll('.gm-opt').forEach(b => b.onclick = () => answer(+b.dataset.i));
      $('#l50').onclick = () => { life.fifty = 0; $('#l50').disabled = true; const bs = [...app.querySelectorAll('.gm-opt')]; shuffle(bs.filter(b => +b.dataset.i !== q.a)).slice(0, 2).forEach(b => { b.classList.add('gone'); b.disabled = true }) };
      $('#lh').onclick = () => { life.hint = 0; $('#lh').disabled = true; $('#fb').className = 'gm-fb'; $('#fb').innerHTML = `💡 Skill tested: <b>${esc(strip(q.skill))}</b>${q.mis ? `. Common trap: ${q.mis}` : ''}` };
      $('#ls').onclick = () => { life.swap = 0; const n = draw(plan[rung]); if (n) q = n; render() };
      $('#walk').onclick = () => finish(rung ? PRIZES[rung - 1] : 0, 'walked');
      keysFor(i => { const b = app.querySelectorAll('.gm-opt')[i]; if (b && !b.disabled) answer(i) });
    };
    const answer = i => {
      if (lock) return; lock = true; const bs = app.querySelectorAll('.gm-opt'); bs.forEach(b => b.disabled = true); $('#walk').disabled = true;
      bs[q.a].classList.add('ok');
      if (i === q.a) {
        sfx('ok'); xpCh[q.ch] = (xpCh[q.ch] || 0) + 3 + diffRank(q.diff) * 2; rung++; if (rung >= 5) badge('ladder5');
        $('#fb').className = 'gm-fb ok'; $('#fb').textContent = rung === 10 ? '🏆 Correct! You reached the top!' : `Correct! ${SAFE.includes(rung - 1) ? '🛡️ Safe level reached. ' : ''}`;
        $('#more').innerHTML = `<details style="margin-top:6px"><summary class="small">See the explanation</summary><p>${q.exp}</p>${srcLine(q)}</details><button class="btn y" id="nx" style="margin-top:10px">${rung === 10 ? 'Collect your prize' : 'Next question →'}</button>`;
        $('#nx').onclick = () => { if (rung === 10) { badge('ladder10'); finish(PRIZES[9], 'won') } else { q = draw(plan[rung]); render() } };
        $('#nx').focus();
      } else {
        bs[i].classList.add('bad'); sfx('lose'); $('#fb').className = 'gm-fb bad'; $('#fb').textContent = `✘ The answer was ${'ABCD'[q.a]}.`;
        $('#more').innerHTML = `<p>${q.exp}</p>${q.mis ? `<p class="small"><b>Watch out:</b> ${q.mis}</p>` : ''}${srcLine(q)}<button class="btn y" id="nx">See result</button>`;
        $('#nx').onclick = () => finish(safeBank(), 'lost');
      }
    };
    const finish = (pts, how) => {
      window.onkeydown = null; const g = G(); const prev = g.best.ladder; if (prev == null || rung > prev) g.best.ladder = rung; save();
      const xp = Object.values(xpCh).reduce((a, b) => a + b, 0) + 5; Object.entries(xpCh).forEach(([c, v]) => addXP(v, +c)); addXP(5); played('ladder');
      if (how === 'won') { sfx('win'); confetti() }
      app.innerHTML = `<div class="card" style="text-align:center;max-width:640px;margin:0 auto"><div style="font-size:54px">${how === 'won' ? '🏆' : how === 'walked' ? '🚶' : '🪜'}</div>
        <h1>${how === 'won' ? 'Chemistry Millionaire!' : how === 'walked' ? 'You walked away' : 'Game over'}</h1><div class="gm-big">${pts.toLocaleString()}</div><p class="muted">points · reached rung ${rung} of 10</p><p><b>+${xp} XP</b></p>
        <div class="row" style="justify-content:center"><button class="btn y" id="again">Play again</button>${back}</div></div>`;
      $('#again').onclick = run;
    };
    render();
  };
  intro();
}

/* ---------- Match-Up ---------- */
function match() {
  const ROUNDS = 3, PER = 5;
  const intro = () => {
    app.innerHTML = `<div class="gm-bar">${back}${chapterPicker()}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:640px;margin:0 auto"><div style="font-size:56px">🧩</div><h1>Match-Up</h1>
      <p class="muted">Tap a key term, then tap its matching meaning. ${ROUNDS} rounds of ${PER} pairs. Faster rounds and fewer mistakes score more points.</p>
      <button class="btn y" id="go" style="font-size:20px;padding:14px 32px">Start</button>${G().best.match != null ? `<p class="small muted">Your best: ${G().best.match} points</p>` : ''}</div>`;
    wirePicker(intro); wireSound(); $('#go').onclick = run;
  };
  const run = () => {
    const deck = shuffle(flashPool()); let round = 0, total = 0, mistakes = 0, xpCh = {};
    const play = () => {
      const set = deck.slice(round * PER, round * PER + PER); if (set.length < 2) return end();
      const L = shuffle(set.map((f, i) => ({ i, h: f.q }))), R = shuffle(set.map((f, i) => ({ i, h: f.a })));
      let sel = null, left = set.length, t0 = Date.now(), rm = 0;
      app.innerHTML = `<div class="gm-bar"><a href="#games" class="btn alt" style="text-decoration:none">✕ Quit</a><span class="gm-chip">Round <b>${round + 1}</b> / ${ROUNDS}</span><span class="gm-chip">Score <b id="sc">${total}</b></span><span class="gm-chip">⏱️ <b id="tm">0</b>s</span>${soundBtn()}</div>
        <div class="gm-match"><div style="display:grid;gap:10px">${L.map(x => `<button class="gm-tile term" data-s="L" data-i="${x.i}">${x.h}</button>`).join('')}</div>
        <div style="display:grid;gap:10px">${R.map(x => `<button class="gm-tile" data-s="R" data-i="${x.i}">${x.h}</button>`).join('')}</div></div><div class="gm-fb" id="fb" aria-live="polite"></div>`;
      wireSound();
      const iv = setInterval(() => { const e = $('#tm'); if (!e) return clearInterval(iv); e.textContent = Math.floor((Date.now() - t0) / 1000) }, 250);
      app.querySelectorAll('.gm-tile').forEach(b => b.onclick = () => {
        if (!sel) { sel = b; b.classList.add('sel'); return }
        if (sel === b) { b.classList.remove('sel'); sel = null; return }
        if (sel.dataset.s === b.dataset.s) { sel.classList.remove('sel'); sel = b; b.classList.add('sel'); return }
        const a = sel; sel = null; a.classList.remove('sel');
        if (a.dataset.i === b.dataset.i) { a.classList.add('done'); b.classList.add('done'); sfx('ok'); pop('+20', b); total += 20; const ch = set[+a.dataset.i].ch; xpCh[ch] = (xpCh[ch] || 0) + 2; $('#sc').textContent = total; left--;
          if (!left) { clearInterval(iv); const secs = (Date.now() - t0) / 1000, bonus = Math.max(0, Math.round(60 - secs)) * 2 - rm * 5; total += Math.max(0, bonus); $('#fb').className = 'gm-fb ok'; $('#fb').innerHTML = `Round complete in ${secs.toFixed(0)} s · time bonus +${Math.max(0, bonus)}`; sfx('win'); round++;
            setTimeout(() => round < ROUNDS && deck.length > round * PER + 1 ? play() : end(), 1300) } }
        else { a.classList.add('bad'); b.classList.add('bad'); sfx('bad'); mistakes++; rm++; setTimeout(() => { a.classList.remove('bad'); b.classList.remove('bad') }, 500) }
      });
    };
    const end = () => {
      const g = G(), prev = g.best.match, nb = prev == null || total > prev; if (nb) g.best.match = total; save();
      const xp = Object.values(xpCh).reduce((a, b) => a + b, 0) + 5; Object.entries(xpCh).forEach(([c, v]) => addXP(v, +c)); addXP(5); played('match'); if (!mistakes && round >= 1) badge('match0');
      if (nb) confetti();
      app.innerHTML = `<div class="card" style="text-align:center;max-width:640px;margin:0 auto"><div style="font-size:54px">🧩</div><h1>All matched!</h1><div class="gm-big">${total}</div><p class="muted">points · ${mistakes} mistake${mistakes === 1 ? '' : 's'}${nb ? ' · <b style="color:var(--ok)">New personal best!</b>' : ''}</p><p><b>+${xp} XP</b></p>
        <div class="row" style="justify-content:center"><button class="btn y" id="again">Play again</button>${back}</div></div>`;
      $('#again').onclick = run;
    };
    play();
  };
  intro();
}

/* ---------- Head-to-Head ---------- */
function duel() {
  let target = 5;
  const intro = () => {
    app.innerHTML = `<div class="gm-bar">${back}${chapterPicker()}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:680px;margin:0 auto"><div style="font-size:56px">⚔️</div><h1>Head-to-Head</h1>
      <p class="muted">Two players share one screen. Read the question, then race to tap the right letter on your own panel. A wrong answer locks you out of that question, so your opponent can still steal the point.</p>
      <div class="row" style="justify-content:center;margin:10px 0"><input class="sel" id="n1" value="Player 1" aria-label="Player 1 name" style="max-width:160px"><input class="sel" id="n2" value="Player 2" aria-label="Player 2 name" style="max-width:160px">
      <select class="sel" id="tg" aria-label="First to"><option value="3">First to 3</option><option value="5" selected>First to 5</option><option value="10">First to 10</option></select></div>
      <p class="small muted">Laptop keys: Player 1 uses <b>1 2 3 4</b>, Player 2 uses <b>7 8 9 0</b>. On a phone or tablet, Player 2's panel turns upside down so you can play face to face.</p>
      <button class="btn y" id="go" style="font-size:20px;padding:14px 32px">Start the duel</button></div>`;
    wirePicker(intro); wireSound(); $('#go').onclick = () => { target = +$('#tg').value; run(esc($('#n1').value || 'Player 1'), esc($('#n2').value || 'Player 2')) };
  };
  const run = (n1, n2) => {
    const qs = shuffle(pool()); let qi = 0, s = [0, 0], locked = [false, false], done = false;
    app.innerHTML = `<div class="gm-bar"><a href="#games" class="btn alt" style="text-decoration:none">✕ Quit</a><span class="gm-chip">First to <b>${target}</b></span>${soundBtn()}</div>
      <div class="gm-duel"><div class="gm-pl p2 flip" id="pl1"></div><div class="card" id="qcard"><div id="qbox"></div><div class="gm-fb" id="fb" aria-live="polite"></div></div><div class="gm-pl p1" id="pl0"></div></div>`;
    wireSound();
    const panel = (p, name) => `<div class="hd"><span>${name}</span><b id="s${p}">${s[p]}</b></div><div class="btns">${'ABCD'.split('').map((l, i) => `<button data-p="${p}" data-i="${i}" aria-label="${name}: answer ${l}">${l}</button>`).join('')}</div><div class="keys">Keys: ${p ? '7 8 9 0' : '1 2 3 4'}</div>`;
    $('#pl0').innerHTML = panel(0, n1); $('#pl1').innerHTML = panel(1, n2);
    const show = () => {
      if (qi >= qs.length) qi = 0; const q = qs[qi]; locked = [false, false]; done = false;
      $('#qbox').innerHTML = `<div class="gm-q">${q.stem}</div>${optsHTML(q)}`; $('#qbox').querySelectorAll('.gm-opt').forEach(b => b.disabled = true);
      $('#fb').textContent = ''; $('#fb').className = 'gm-fb';
      app.querySelectorAll('.gm-pl button').forEach(b => b.disabled = false); app.querySelectorAll('.gm-pl').forEach(e => e.classList.remove('locked'));
    };
    const hit = (p, i) => {
      if (done || locked[p]) return; const q = qs[qi]; const opts = $('#qbox').querySelectorAll('.gm-opt'); const name = p ? n2 : n1;
      if (i === q.a) { done = true; s[p]++; $('#s' + p).textContent = s[p]; opts[i].classList.add('ok'); sfx('ok'); pop('+1', $('#pl' + p)); $('#fb').className = 'gm-fb ok'; $('#fb').innerHTML = `${name} wins the point!`;
        if (s[p] >= target) return setTimeout(() => end(p ? n2 : n1), 900); qi++; setTimeout(show, 1600) }
      else { locked[p] = true; opts[i].classList.add('bad'); sfx('bad'); $('#pl' + p).classList.add('locked'); $('#pl' + p).querySelectorAll('button').forEach(b => b.disabled = true); $('#fb').className = 'gm-fb bad'; $('#fb').innerHTML = `${name} is locked out!`;
        if (locked[0] && locked[1]) { done = true; opts[q.a].classList.add('ok'); $('#fb').innerHTML = `Nobody scores. The answer was ${'ABCD'[q.a]}.`; qi++; setTimeout(show, 2200) } }
    };
    app.querySelectorAll('.gm-pl button').forEach(b => b.onclick = () => hit(+b.dataset.p, +b.dataset.i));
    window.onkeydown = e => { const k = e.key; const a = '1234'.indexOf(k), b = '7890'.indexOf(k); if (a >= 0) hit(0, a); else if (b >= 0) hit(1, b) };
    const end = winner => { window.onkeydown = null; played('duel'); badge('duel'); addXP(10); sfx('win'); confetti();
      app.innerHTML = `<div class="card" style="text-align:center;max-width:640px;margin:0 auto"><div style="font-size:54px">🏆</div><h1>${winner} wins!</h1><div class="gm-big">${s[0]} – ${s[1]}</div><p class="muted">${n1} vs ${n2}</p><p><b>+10 XP</b></p>
        <div class="row" style="justify-content:center"><button class="btn y" id="again">Rematch</button>${back}</div></div>`;
      $('#again').onclick = () => run(n1, n2) };
    show();
  };
  intro();
}


/* ---------- Daily challenge ---------- */
const SITE = 'https://chemistrywithyusuf.github.io/#game-daily';
const dkey = (d = new Date()) => d.toLocaleDateString('en-CA');            // YYYY-MM-DD in the student's own time zone
const DAY0 = Date.UTC(2026, 10, 27);
const dayNo = k => Math.floor((Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)) - DAY0) / 864e5) + 1;
function rng(seed) { let h = 1779033703 ^ seed.length; for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19 }
  return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296 } }
function todaysSet(k) { const r = rng('cy9701-' + k); const a = POOL.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a.slice(0, 5) }
function D() { const g = G(); g.daily = g.daily || { streak: 0, best: 0, last: null, res: {} }; return g.daily }
function untilMidnight() { const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); const s = Math.floor((m - n) / 1000); return `${Math.floor(s / 3600)}h ${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}m` }
function liveStreak() { const d = D(); if (!d.last) return 0; const y = new Date(); y.setDate(y.getDate() - 1); return (d.last === dkey() || d.last === dkey(y)) ? d.streak : 0 }
const grid = arr => arr.map(x => x ? '🟩' : '🟥').join('');
function shareText(k, arr) { return `Chemistry with Yusuf · Daily challenge #${dayNo(k)}\n${grid(arr)} ${arr.filter(Boolean).length}/5${liveStreak() > 1 ? ' · 🔥 ' + liveStreak() + '-day streak' : ''}\n${SITE}` }
function dailyCard() {
  const k = dkey(), d = D(), done = d.res[k], st = liveStreak();
  return `<a class="card gm-card" href="#game-daily" style="background:linear-gradient(135deg,#ffd23f,#ffb703);color:#0a1a44;border:0">
    <div class="row" style="justify-content:space-between"><span style="font:800 13px Inter;letter-spacing:.06em">DAILY CHALLENGE #${dayNo(k)}</span><span style="font-weight:800">🔥 ${st} day${st === 1 ? '' : 's'}</span></div>
    <h3 style="margin:2px 0 0;color:#0a1a44">${done ? `Today: ${grid(done)} ${done.filter(Boolean).length}/5` : 'Five new questions are waiting'}</h3>
    <span class="small" style="font-weight:600">${done ? `Next challenge in ${untilMidnight()}` : 'Everyone gets the same five today. Keep your streak going!'}</span></a>`;
}
function daily() {
  const k = dkey(), d = D(), set = todaysSet(k);
  const results = () => {
    const arr = d.res[k], st = liveStreak();
    app.innerHTML = `<div class="gm-bar">${back}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:620px;margin:0 auto"><div class="small muted" style="font-weight:700;letter-spacing:.06em">DAILY CHALLENGE #${dayNo(k)}</div>
      <div style="font-size:44px;letter-spacing:6px;margin:8px 0">${grid(arr)}</div><div class="gm-big">${arr.filter(Boolean).length}/5</div>
      <p style="font-size:20px;font-weight:700;margin:10px 0">🔥 ${st}-day streak <span class="muted" style="font-weight:500">· best ${d.best}</span></p>
      <div class="row" style="justify-content:center"><button class="btn y" id="share">📤 Share my result</button>${back}</div>
      <p class="small muted" id="cd">Next challenge in ${untilMidnight()}</p></div>
      <div class="gm-review" style="max-width:620px;margin:18px auto"><h2>Today's answers</h2>${set.map((q, i) => `<details${arr[i] ? '' : ' open'}><summary>${arr[i] ? '✔' : '✘'} Question ${i + 1}: ${strip(q.stem).slice(0, 80)}…</summary><div class="gm-q" style="font-size:17px;margin-top:8px">${q.stem}</div><p><b>Answer: ${'ABCD'[q.a]}</b></p><p>${q.exp}</p>${srcLine(q)}</details>`).join('')}</div>`;
    wireSound();
    $('#share').onclick = async () => { const t = shareText(k, arr);
      try { if (navigator.share) { await navigator.share({ text: t }); return } } catch (e) { if (e && e.name === 'AbortError') return }
      try { await navigator.clipboard.writeText(t); toast('📋 Copied! Paste it into WhatsApp or your class group.') } catch (e) { prompt('Copy your result:', t) } };
    const iv = setInterval(() => { const c = $('#cd'); if (!c) return clearInterval(iv); c.textContent = 'Next challenge in ' + untilMidnight() }, 30000);
  };
  if (d.res[k]) return results();
  const intro = () => {
    const st = liveStreak();
    app.innerHTML = `<div class="gm-bar">${back}${soundBtn()}</div>
      <div class="card" style="text-align:center;max-width:620px;margin:0 auto"><div style="font-size:56px">📅</div><div class="small muted" style="font-weight:700;letter-spacing:.06em">DAILY CHALLENGE #${dayNo(k)}</div><h1>Today's five</h1>
      <p class="muted">Five questions from ${chList()}. Everyone gets the same five today, and you only get <b>one go</b>, so think before you tap. Come back tomorrow to keep your streak.</p>
      <p style="font-size:20px;font-weight:700">🔥 Current streak: ${st} day${st === 1 ? '' : 's'}</p>
      <button class="btn y" id="go" style="font-size:20px;padding:14px 32px">Start today's challenge</button></div>`;
    wireSound(); $('#go').onclick = () => play(0, []);
  };
  const play = (i, arr) => {
    const q = set[i]; let lock = false;
    app.innerHTML = `<div class="gm-bar"><span class="gm-chip">Daily #${dayNo(k)}</span><span class="gm-chip">Question <b>${i + 1}</b> / 5</span><span class="gm-chip" style="letter-spacing:3px">${arr.map(x => x ? '🟩' : '🟥').join('')}${'⬜'.repeat(5 - arr.length)}</span>${soundBtn()}</div>
      <div class="card" id="qcard"><div class="gm-q">${q.stem}</div>${optsHTML(q)}<div class="gm-fb" id="fb" aria-live="polite"></div><div id="more"></div></div>`;
    wireSound();
    const answer = j => {
      if (lock) return; lock = true; const bs = app.querySelectorAll('.gm-opt'); bs.forEach(b => b.disabled = true); bs[q.a].classList.add('ok');
      const ok = j === q.a; if (!ok) { bs[j].classList.add('bad'); sfx('bad') } else sfx('ok');
      arr = arr.concat(ok ? 1 : 0);
      $('#fb').className = 'gm-fb ' + (ok ? 'ok' : 'bad'); $('#fb').textContent = ok ? 'Correct!' : `✘ The answer was ${'ABCD'[q.a]}.`;
      $('#more').innerHTML = `<p>${q.exp}</p>${srcLine(q)}<button class="btn y" id="nx" style="margin-top:8px">${i < 4 ? 'Next question →' : 'See my result'}</button>`;
      $('#nx').onclick = () => i < 4 ? play(i + 1, arr) : finish(arr); $('#nx').focus();
    };
    app.querySelectorAll('.gm-opt').forEach(b => b.onclick = () => answer(+b.dataset.i));
    keysFor(j => answer(j));
  };
  const finish = arr => {
    window.onkeydown = null; const y = new Date(); y.setDate(y.getDate() - 1);
    d.streak = d.last === dkey(y) ? d.streak + 1 : 1; d.last = k; d.best = Math.max(d.best, d.streak); d.res[k] = arr; save();
    const right = arr.filter(Boolean).length; set.forEach((q, i) => { if (arr[i]) addXP(5, q.ch) }); addXP(right === 5 ? 15 : 5); played('daily');
    if (right === 5) { badge('perfect5'); confetti(); sfx('win') } if (d.streak >= 3) badge('day3'); if (d.streak >= 7) badge('day7');
    results();
  };
  intro();
}


/* ---------- Chapter certificates ---------- */
function certs() { const g = G(); g.certs = g.certs || {}; return g.certs }
function certCanvas(name, ch, title, score, date) {
  const W = 1600, H = 1130, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#fbfcff'; x.fillRect(0, 0, W, H);
  x.strokeStyle = '#0a1a44'; x.lineWidth = 18; x.strokeRect(30, 30, W - 60, H - 60);
  x.strokeStyle = '#ffd23f'; x.lineWidth = 6; x.strokeRect(62, 62, W - 124, H - 124);
  const gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#0a1a44'); gr.addColorStop(1, '#0b7ea3'); x.fillStyle = gr; x.fillRect(62, 62, W - 124, 150);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '700 54px Poppins, sans-serif'; x.fillText('Chemistry with Yusuf', W / 2, 155);
  x.fillStyle = '#0a1a44'; x.font = '700 72px Poppins, sans-serif'; x.fillText('Certificate of Achievement', W / 2, 330);
  x.fillStyle = '#53607a'; x.font = '400 34px Inter, sans-serif'; x.fillText('This certifies that', W / 2, 410);
  x.fillStyle = '#0b7ea3'; x.font = '700 84px Poppins, sans-serif'; x.fillText(name, W / 2, 520, W - 260);
  x.strokeStyle = '#ffd23f'; x.lineWidth = 4; x.beginPath(); x.moveTo(W / 2 - 380, 550); x.lineTo(W / 2 + 380, 550); x.stroke();
  x.fillStyle = '#53607a'; x.font = '400 34px Inter, sans-serif'; x.fillText('has passed the chapter test for', W / 2, 620);
  x.fillStyle = '#0a1a44'; x.font = '700 50px Poppins, sans-serif'; x.fillText(`Chapter ${ch}: ${title}`, W / 2, 700, W - 260);
  x.fillStyle = '#53607a'; x.font = '400 32px Inter, sans-serif'; x.fillText('AS Chemistry (9701) revision · Chemistry with Yusuf', W / 2, 760);
  x.fillStyle = '#0a1a44'; x.font = '700 40px Poppins, sans-serif'; x.fillText(`Score: ${score}/10`, W / 2 - 300, 880); x.fillText(date, W / 2 + 300, 880);
  x.fillStyle = '#53607a'; x.font = '400 24px Inter, sans-serif'; x.fillText('score', W / 2 - 300, 920); x.fillText('date', W / 2 + 300, 920);
  // seal
  x.save(); x.translate(215, H - 250); x.fillStyle = '#ffd23f'; x.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 78 : 92; x.lineTo(Math.cos(a) * r, Math.sin(a) * r) } x.closePath(); x.fill();
  x.fillStyle = '#0a1a44'; x.font = '800 40px Poppins, sans-serif'; x.textAlign = 'center'; x.fillText('CY', 0, 14); x.restore();
  x.fillStyle = '#8a94aa'; x.font = '400 21px Inter, sans-serif'; x.textAlign = 'center';
  x.fillText('An independent revision award from Chemistry with Yusuf. It is not a Cambridge qualification and is not issued or endorsed by Cambridge University Press & Assessment.', W / 2, H - 100, W - 200);
  return c;
}
function certificate() {
  const C = certs();
  const list = () => {
    app.innerHTML = `<div class="gm-bar">${back}${soundBtn()}</div>
      <div class="card" style="max-width:760px;margin:0 auto;text-align:center"><div style="font-size:56px">🎓</div><h1>Chapter certificates</h1>
      <p class="muted">Take a 10-question chapter test. Score <b>7 or more</b> to earn a certificate with your name, which you can download or print. You can retake a test as often as you like; your best score is kept.</p>
      <div class="row" style="justify-content:center;margin:12px 0"><input class="sel" id="nm" placeholder="Your full name" aria-label="Your full name for the certificate" style="max-width:320px;width:100%" value="${esc(G().name || '')}"></div>
      <div class="gm-cards" style="text-align:left">${CY.AVAILABLE.map(n => { const c = C[n]; const t = CY.title(n); return `<div class="card"><span class="pill">Chapter ${n}</span><h3 style="margin-top:4px">${esc(t)}</h3>
        <p class="small muted">${c ? `🎓 Passed · best ${c.score}/10 · ${c.date}` : 'Not passed yet'}</p><div class="row"><button class="btn y" data-t="${n}">${c ? 'Retake test' : 'Take the test'}</button>${c ? `<button class="btn alt" data-v="${n}">View certificate</button>` : ''}</div></div>` }).join('')}</div></div>`;
    wireSound();
    const nm = $('#nm'); nm.oninput = () => { G().name = nm.value.trim().slice(0, 40); save() };
    app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { if (!G().name) { nm.focus(); toast('✍️ Type your name first'); return } test(+b.dataset.t) });
    app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => view(+b.dataset.v));
  };
  const test = ch => {
    const qs = pick(POOL.filter(q => q.ch === ch), 10); let i = 0, sc = 0;
    const show = () => {
      const q = qs[i]; let lock = false;
      app.innerHTML = `<div class="gm-bar"><a href="#game-cert" class="btn alt" style="text-decoration:none" id="qt">✕ Quit</a><span class="gm-chip">Chapter ${ch} test</span><span class="gm-chip">Question <b>${i + 1}</b> / 10</span><span class="gm-chip">Score <b>${sc}</b></span>${soundBtn()}</div>
        <div class="card"><div class="gm-q">${q.stem}</div>${optsHTML(q)}<div class="gm-fb" id="fb" aria-live="polite"></div><div id="more"></div></div>`;
      wireSound(); $('#qt').onclick = e => { e.preventDefault(); window.onkeydown = null; list() };
      const answer = j => { if (lock) return; lock = true; const bs = app.querySelectorAll('.gm-opt'); bs.forEach(b => b.disabled = true); bs[q.a].classList.add('ok');
        if (j === q.a) { sc++; sfx('ok'); $('#fb').className = 'gm-fb ok'; $('#fb').textContent = 'Correct!' } else { bs[j].classList.add('bad'); sfx('bad'); $('#fb').className = 'gm-fb bad'; $('#fb').textContent = `✘ The answer was ${'ABCD'[q.a]}.` }
        $('#more').innerHTML = `<p>${q.exp}</p>${srcLine(q)}<button class="btn y" id="nx">${i < 9 ? 'Next question →' : 'See my result'}</button>`; $('#nx').focus();
        $('#nx').onclick = () => { i++; i < 10 ? show() : done() } };
      app.querySelectorAll('.gm-opt').forEach(b => b.onclick = () => answer(+b.dataset.i)); keysFor(j => answer(j));
    };
    const done = () => {
      window.onkeydown = null; const pass = sc >= 7; addXP(sc * 2, ch);
      if (pass) { const prev = C[ch]; if (!prev || sc >= prev.score) C[ch] = { score: sc, date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), name: G().name }; save(); badge('cert'); confetti(); sfx('win'); return view(ch, sc) }
      sfx('lose');
      app.innerHTML = `<div class="card" style="text-align:center;max-width:620px;margin:0 auto"><div style="font-size:54px">📚</div><h1>${sc}/10. Not quite yet!</h1><p class="muted">You need 7 or more for the certificate. Revise Chapter ${ch}, then try again.</p>
        <div class="row" style="justify-content:center"><button class="btn y" id="rt">Try again</button><a class="btn alt" style="text-decoration:none" href="#ch${String(ch).padStart(2, '0')}">Revise Chapter ${ch}</a></div></div>`;
      $('#rt').onclick = () => test(ch);
    };
    show();
  };
  const view = (ch, fresh) => {
    const c = C[ch]; const cv = certCanvas(c.name || G().name || 'Student', ch, CY.title(ch), c.score, c.date);
    app.innerHTML = `<div class="gm-bar"><a href="#game-cert" class="btn alt" style="text-decoration:none" id="bk">← Certificates</a></div>
      ${fresh ? `<h1 style="text-align:center">🎉 You passed with ${fresh}/10!</h1>` : ''}
      <div class="card" style="max-width:900px;margin:0 auto;padding:12px"><img id="cimg" alt="Certificate for Chapter ${ch}" style="width:100%;border-radius:8px;display:block"></div>
      <div class="row" style="justify-content:center;margin-top:14px"><a class="btn y" id="dl" style="text-decoration:none">⬇️ Download</a><button class="btn alt" id="pr">🖨️ Print</button></div>`;
    $('#bk').onclick = e => { e.preventDefault(); list() };
    const url = cv.toDataURL('image/png'); $('#cimg').src = url; $('#dl').href = url; $('#dl').download = `Certificate-Chapter-${ch}.png`;
    $('#pr').onclick = () => { const w = window.open(''); if (!w) { toast('Allow pop-ups to print, or use Download.'); return } w.document.write(`<title>Certificate</title><style>@page{size:A4 landscape;margin:0}body{margin:0}img{width:100%}</style><img src="${url}" onload="setTimeout(()=>print(),300)">`); w.document.close() };
  };
  list();
}

/* ---------- entry ---------- */
window.GAMES = async function (h, api) {
  CY = api; P = api.P; save = api.save; esc = api.esc; strip = api.strip; app = api.app;
  if (!document.getElementById('gm-css')) { const s = document.createElement('style'); s.id = 'gm-css'; s.textContent = CSS; document.head.appendChild(s) }
  if (!POOL.length) await loadPool();
  window.onkeydown = null;
  ({ games: hub, 'game-daily': daily, 'game-cert': certificate, 'game-clock': clock, 'game-ladder': ladder, 'game-match': match, 'game-duel': duel }[h] || hub)();
};
})();

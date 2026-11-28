/* Chemistry with Yusuf – interactive simulations. Each SIMS[name](el, EL) builds a sim inside el.
   EL = array of elements H–Kr: {z,s,n,ar,ec:[[n,l,count]],ie:[kJ/mol...],en,g,p} (NIST ionisation energies). */
window.SIMS = window.SIMS || {};
(function () {
const ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];          // filling order (energy)
const CAP = { s: 2, p: 6, d: 10 };
const SUP = n => String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
const sup = n => `<sup>${n}</sup>`;
const h = (t, a = {}, k = '') => `<${t} ${Object.entries(a).map(([x, y]) => `${x}="${y}"`).join(' ')}>${k}</${t}>`;

/* ground-state configuration of a species with proton number z and e electrons, as {sub: count} */
function config(EL, z, e) {
  const el = EL[z - 1]; const c = {};
  for (const [n, l, k] of el.ec) c[n + l] = k;
  let tot = Object.values(c).reduce((a, b) => a + b, 0);
  while (tot > e) {                       // remove: highest n first, then highest l (4p, 4s before 3d)
    const subs = Object.keys(c).filter(s => c[s] > 0).sort((a, b) => (b[0] - a[0]) || ('spd'.indexOf(b[1]) - 'spd'.indexOf(a[1])));
    c[subs[0]]--; tot--;
  }
  for (const s of ORDER) {                // add (anions): aufbau order
    if (tot >= e) break; const room = CAP[s[1]] - (c[s] || 0);
    const add = Math.min(room, e - tot); c[s] = (c[s] || 0) + add; tot += add;
  }
  if (tot < e) return null;               // beyond 4p (not assessed)
  return c;
}
const subOrderShell = s => (+s[0]) * 10 + 'spd'.indexOf(s[1]);
function cfgString(c, short) {
  const subs = Object.keys(c).filter(s => c[s] > 0).sort((a, b) => subOrderShell(a) - subOrderShell(b));
  if (!short) return subs.map(s => s + sup(c[s])).join(' ') || '(no electrons)';
  const cores = [['[Ar]', ['1s', '2s', '2p', '3s', '3p'], [2, 2, 6, 2, 6]], ['[Ne]', ['1s', '2s', '2p'], [2, 2, 6]], ['[He]', ['1s'], [2]]];
  for (const [nm, ss, ks] of cores) {
    if (ss.every((s, i) => c[s] === ks[i]) && subs.length > ss.length) return nm + ' ' + subs.filter(s => !ss.includes(s)).map(s => s + sup(c[s])).join(' ');
  }
  return cfgString(c, false);
}
function shells(c) { const sh = [0, 0, 0, 0]; for (const s in c) sh[+s[0] - 1] += c[s]; while (sh.length && !sh[sh.length - 1]) sh.pop(); return sh; }
const chargeStr = q => q === 0 ? '' : (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−');
window.SIMCFG = { config, cfgString };

/* ---------------- 1. Build an atom or ion ---------------- */
SIMS.atom = function (el, EL) {
  let P = 6, N = 6, E = 6, target = null;
  el.innerHTML = `<div class="simgrid"><div><svg class="atomsvg" viewBox="-160 -160 320 320" role="img" aria-label="Atom diagram"></svg></div>
  <div><div class="simread"></div>
  <div class="ctrls">${['p:Protons', 'n:Neutrons', 'e:Electrons'].map(x => { const [k, l] = x.split(':'); return `<div class="ctrl"><span>${l}</span><button data-d="${k}-">−</button><b data-v="${k}"></b><button data-d="${k}+">+</button></div>` }).join('')}</div>
  <div class="row" style="margin-top:10px"><button class="btn alt" data-x="neutral">Make it neutral</button><button class="btn y" data-x="challenge">Challenge me</button></div>
  <div class="simfb"></div></div></div>`;
  const svg = el.querySelector('svg'), rd = el.querySelector('.simread'), fb = el.querySelector('.simfb');
  function draw() {
    P = Math.max(1, Math.min(36, P)); N = Math.max(0, Math.min(48, N)); E = Math.max(0, Math.min(36, E));
    const x = EL[P - 1], q = P - E, A = P + N, c = config(EL, P, E);
    el.querySelectorAll('[data-v]').forEach(b => b.textContent = { p: P, n: N, e: E }[b.dataset.v]);
    // nucleus
    let g = ''; const nuc = P + N; const R = Math.min(30, 6 + Math.sqrt(nuc) * 3.2);
    const shown = Math.min(nuc, 60);
    for (let i = 0; i < shown; i++) { const a = i * 2.399, r = R * Math.sqrt((i + .5) / shown); const red = Math.floor((i + 1) * P / nuc) > Math.floor(i * P / nuc); g += `<circle cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}" r="5" fill="${red ? '#e11d48' : '#64748b'}" stroke="#fff" stroke-width=".8"/>` }
    const sh = c ? shells(c) : [];
    sh.forEach((k, i) => { const r = 52 + i * 26; g += `<circle r="${r}" fill="none" stroke="var(--line)" stroke-width="2"/>`; for (let j = 0; j < k; j++) { const a = j / k * 2 * Math.PI - Math.PI / 2; g += `<circle cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}" r="5.5" fill="#2563eb"/>` } });
    svg.innerHTML = g;
    const kind = q === 0 ? 'neutral atom' : q > 0 ? `positive ion (cation): lost ${q} electron${q > 1 ? 's' : ''}` : `negative ion (anion): gained ${-q} electron${q < -1 ? 's' : ''}`;
    const common = x.mc || Math.round(x.ar), iso = A === common ? 'the most common isotope' : `an isotope (most common: ${x.s}-${common})`;
    rd.innerHTML = `<div class="nuclide"><span class="ms"><span>${A}</span><span>${P}</span></span><span class="sym">${x.s}<sup>${chargeStr(q)}</sup></span></div>
     <p><b>${x.n}</b> · ${kind}<br><span class="muted small">Proton number ${P} fixes the element. Nucleon number ${A} = ${P} + ${N}. This is ${iso}.</span></p>
     <p class="small">Configuration: ${c ? cfgString(c) : '<i>beyond 4p (not assessed)</i>'}<br>Shells: ${sh.join(', ') || '–'}</p>
     ${N > 1.6 * P + 4 || (P > 1 && N < P - 2) ? '<p class="small warnc">This nucleus would be very unstable: real nuclei need a balance of protons and neutrons.</p>' : ''}`;
    if (target) { const ok = P === target.p && N === target.n && E === target.e; fb.className = 'simfb ' + (ok ? 'ok' : ''); fb.innerHTML = ok ? `✔ Correct, that is ${target.lab}. <button class="btn alt" data-x="challenge">Another</button>` : `Target: build <b>${target.lab}</b>`; }
  }
  const TG = [[17, 37, -1], [12, 24, 2], [8, 18, -2], [26, 56, 3], [1, 2, 0], [11, 23, 1], [16, 34, -2], [13, 27, 3], [35, 81, -1], [6, 14, 0], [20, 40, 2], [29, 63, 2]];
  el.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.d) { const [k, s] = [b.dataset.d[0], b.dataset.d[1]]; const d = s === '+' ? 1 : -1; if (k === 'p') P += d; if (k === 'n') N += d; if (k === 'e') E += d; draw(); }
    if (b.dataset.x === 'neutral') { E = P; draw(); }
    if (b.dataset.x === 'challenge') { const t = TG[Math.floor(Math.random() * TG.length)]; const x = EL[t[0] - 1]; target = { p: t[0], n: t[1] - t[0], e: t[0] - t[2], lab: `<sup>${t[1]}</sup>${x.s}<sup>${chargeStr(t[2])}</sup>` }; draw(); }
  });
  draw();
};

/* ---------------- 2. Electron configuration builder ---------------- */
SIMS.config = function (el, EL) {
  const SPECIES = []; for (let z = 1; z <= 36; z++) SPECIES.push([z, 0]);
  [[11, 1], [12, 2], [13, 3], [8, -2], [9, -1], [7, -3], [17, -1], [16, -2], [19, 1], [20, 2], [26, 2], [26, 3], [24, 3], [29, 1], [29, 2], [25, 2], [30, 2], [22, 2], [35, -1], [21, 3]].forEach(s => SPECIES.push(s));
  const lab = ([z, q]) => EL[z - 1].s + (q ? chargeStr(q) : '');
  el.innerHTML = `<div class="row"><label class="small muted" for="cs">Species</label><select id="cs" class="sel">${SPECIES.map((s, i) => `<option value="${i}">${lab(s)}${s[1] ? '' : ' (' + EL[s[0] - 1].n + ')'}</option>`).join('')}</select><button class="btn alt" data-x="rand">Random ion</button><button class="btn alt" data-x="clear">Clear</button></div>
   <p class="small muted">Tap a box to add an electron: empty → ↑ → ↑↓ → empty. Fill in order of energy (lowest at the bottom).</p>
   <div class="ladder"></div><p class="small">Your configuration: <b class="mine">–</b></p>
   <div class="row"><button class="btn y" data-x="check">Check</button><button class="btn alt" data-x="show">Show answer</button></div><div class="simfb"></div>`;
  const lad = el.querySelector('.ladder'), sel = el.querySelector('select'), fb = el.querySelector('.simfb');
  const N_ORB = { s: 1, p: 3, d: 5 }; let st = {};
  const LEVELS = ['4p', '3d', '4s', '3p', '3s', '2p', '2s', '1s'];
  function build() { st = {}; LEVELS.forEach(s => st[s] = Array(N_ORB[s[1]]).fill(0)); draw(); fb.innerHTML = ''; fb.className = 'simfb' }
  function counts() { const c = {}; for (const s in st) { const k = st[s].reduce((a, b) => a + b, 0); if (k) c[s] = k } return c }
  function draw() {
    lad.innerHTML = LEVELS.map(s => `<div class="lv"><span class="lvl">${s}</span>${st[s].map((v, i) => `<button class="obox" data-s="${s}" data-i="${i}" aria-label="${s} orbital ${i + 1}: ${['empty', 'one electron', 'two electrons'][v]}">${['', '↑', '↑↓'][v]}</button>`).join('')}</div>`).join('');
    const c = counts(); el.querySelector('.mine').innerHTML = Object.keys(c).length ? cfgString(c) : '–';
  }
  el.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.classList.contains('obox')) { const a = st[b.dataset.s]; a[+b.dataset.i] = (a[+b.dataset.i] + 1) % 3; draw(); return }
    const [z, q] = SPECIES[+sel.value]; const right = config(EL, z, z - q);
    if (b.dataset.x === 'clear') build();
    if (b.dataset.x === 'rand') { sel.value = String(36 + Math.floor(Math.random() * (SPECIES.length - 36))); build() }
    if (b.dataset.x === 'show') { build(); for (const s in right) { let k = right[s]; const n = N_ORB[s[1]]; for (let i = 0; i < n && k > 0; i++) { st[s][i] = 1; k-- } for (let i = 0; i < n && k > 0; i++) { st[s][i] = 2; k-- } } draw(); fb.className = 'simfb ok'; fb.innerHTML = `${lab(SPECIES[+sel.value])}: ${cfgString(right)} = ${cfgString(right, true)}` }
    if (b.dataset.x === 'check') {
      const c = counts(); const tot = Object.values(c).reduce((a, b) => a + b, 0), need = z - q; const msg = [];
      if (tot !== need) msg.push(`${lab(SPECIES[+sel.value])} has ${need} electrons (${z} protons${q ? ', charge ' + chargeStr(q) : ''}); you placed ${tot}.`);
      else {
        for (const s of ORDER) { if ((c[s] || 0) !== (right[s] || 0)) { msg.push(`Check the ${s} sub-shell: it should hold ${right[s] || 0}.`); break } }
        for (const s in st) { const a = st[s]; const k = a.reduce((x, y) => x + y, 0); const n = a.length; const singles = a.filter(v => v === 1).length, pairs = a.filter(v => v === 2).length; const ideal1 = k <= n ? k : 2 * n - k; if (singles !== ideal1 && k === (right[s] || 0)) { msg.push(`In ${s}, fill each orbital singly before pairing (electrons repel each other).`); break } }
        if (q > 0 && z > 20 && z < 31 && msg.length) msg.push('Remember: transition metals lose their 4s electrons before 3d.');
      }
      fb.className = 'simfb ' + (msg.length ? 'bad' : 'ok'); fb.innerHTML = msg.length ? '✘ ' + msg.join(' ') : `✔ Correct! ${cfgString(right)} = ${cfgString(right, true)}`;
    }
  });
  sel.addEventListener('change', build); build();
};

/* ---------------- 3. Beams in an electric field ---------------- */
SIMS.beam = function (el) {
  const PRE = { 'proton (¹H⁺)': [1, 1], 'neutron': [0, 1], 'electron': [-1, 1 / 1836], 'deuteron (²H⁺)': [1, 2], '⁴He²⁺': [2, 4], '⁷Li⁺': [1, 7], '¹⁶O²⁻': [-2, 16], '³⁵Cl⁻': [-1, 35] };
  const col = ['#e11d48', '#2563eb', '#16a34a'];
  let beams = [['proton (¹H⁺)', ...PRE['proton (¹H⁺)']], ['neutron', ...PRE['neutron']], ['⁴He²⁺', ...PRE['⁴He²⁺']]], V = 50;
  el.innerHTML = `<div><div class="fig" style="min-height:300px"><svg role="img" aria-label="Beam paths between charged plates"></svg></div>
   <div class="beamctl">${[0, 1, 2].map(i => `<div class="ctrl" style="flex-wrap:wrap"><span style="color:${col[i]};font-weight:700">Beam ${i + 1}</span><select class="sel" data-b="${i}">${Object.keys(PRE).map(k => `<option>${k}</option>`).join('')}</select></div>`).join('')}
   </div><div><label class="small muted">Plate voltage: <b class="vv"></b></label><input type="range" min="0" max="100" value="50" class="vr" style="width:100%">
   <div class="simfb ok small">Deflection ∝ charge ÷ mass. Positive particles bend towards the negative plate, negative particles towards the positive plate, neutral particles go straight.</div></div></div>`;
  const svg = el.querySelector('svg');
  el.querySelectorAll('select').forEach((s, i) => { s.value = beams[i][0]; s.onchange = () => { beams[i] = [s.value, ...PRE[s.value]]; draw() } });
  el.querySelector('.vr').oninput = e => { V = +e.target.value; draw() };
  function draw() {
    const W = svg.clientWidth || 500, H = svg.clientHeight || 300; el.querySelector('.vv').textContent = V + '%';
    const top = 30, bot = H - 30, mid = H / 2, x0 = 40, x1 = W - 70; let g = `<rect x="${x0 + 30}" y="${top - 12}" width="${x1 - x0 - 30}" height="10" fill="#e11d48"/><text x="${x0 + 30}" y="${top - 16}" font-size="13" fill="#e11d48" font-weight="700">+ plate</text>
      <rect x="${x0 + 30}" y="${bot + 2}" width="${x1 - x0 - 30}" height="10" fill="#2563eb"/><text x="${x0 + 30}" y="${bot + 26}" font-size="13" fill="#2563eb" font-weight="700">− plate</text><circle cx="${x0}" cy="${mid}" r="7" fill="var(--ink)"/>`;
    beams.forEach(([nm, q, m], i) => {
      const k = q / m * V / 100 * (mid - top) * 0.9;           // He2+ at 100 % reaches ~45 % of half-gap
      let pts = [], off = false;
      for (let t = 0; t <= 1.0001; t += 0.02) { let y = mid + k * t * t; if (y < top + 4 || y > bot - 4) { off = true; y = Math.max(top + 4, Math.min(bot - 4, y)); pts.push([x0 + t * (x1 - x0), y]); break } pts.push([x0 + t * (x1 - x0), y]) }
      g += `<polyline fill="none" stroke="${col[i]}" stroke-width="3.5" stroke-dasharray="${i === 1 ? '7 4' : ''}" points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}"/>`;
      const [lx, ly] = pts[pts.length - 1];
      g += `<text x="${Math.min(lx + 6, W - 66)}" y="${Math.max(14, Math.min(H - 4, ly + 4 + (i - 1) * 2))}" font-size="12" font-weight="700" fill="${col[i]}">${i + 1}${off ? ' (hits plate)' : ''}</text>`;
    });
    svg.innerHTML = g;
  }
  new ResizeObserver(draw).observe(svg); draw();
};

/* ---------------- 4. Ionisation energy explorer ---------------- */
SIMS.ie = function (el, EL) {
  el.innerHTML = `<div class="row"><button class="btn tabb on" data-t="succ">Successive IEs</button><button class="btn tabb alt" data-t="trend">First IE trends</button></div><div class="iepane"></div>`;
  const pane = el.querySelector('.iepane');
  el.querySelectorAll('.tabb').forEach(b => b.onclick = () => { el.querySelectorAll('.tabb').forEach(x => { x.classList.toggle('on', x === b); x.classList.toggle('alt', x !== b) }); b.dataset.t === 'succ' ? succ() : trend() });
  function bars(svg, labels, vals, log, mark) {
    const W = svg.clientWidth || 600, H = svg.clientHeight || 300, m = { l: 52, r: 8, t: 14, b: 28 }; const n = vals.length, bw = (W - m.l - m.r) / n;
    const f = v => log ? Math.log10(v) : v, lo = log ? f(Math.min(...vals) / 1.5) : 0, hi = f(Math.max(...vals) * 1.1);
    const y = v => m.t + (H - m.t - m.b) * (1 - (f(v) - lo) / (hi - lo)); let g = '';
    (log ? [100, 1000, 10000, 100000] : [0, 500, 1000, 1500, 2000, 2500]).filter(t => (log ? f(t) > lo : true) && f(t) < hi).forEach(t => g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line)"/><text x="${m.l - 5}" y="${y(t) + 4}" text-anchor="end" font-size="10" fill="var(--mute)">${t.toLocaleString()}</text>`);
    vals.forEach((v, i) => { g += `<rect data-i="${i}" x="${m.l + i * bw + bw * .12}" y="${y(v)}" width="${bw * .76}" height="${H - m.b - y(v)}" rx="2" fill="${mark && mark.includes(i) ? 'var(--yel)' : 'var(--cyan)'}" style="cursor:pointer"><title>${labels[i]}: ${v.toLocaleString()} kJ/mol</title></rect>`; if (n <= 20 || i % 2 === 0) g += `<text x="${m.l + (i + .5) * bw}" y="${H - 10}" text-anchor="middle" font-size="10" fill="var(--ink)">${labels[i]}</text>` });
    svg.innerHTML = g + `<text x="4" y="10" font-size="10" fill="var(--mute)">kJ mol⁻¹${log ? ' (log)' : ''}</text>`;
  }
  function succ() {
    pane.innerHTML = `<div class="row" style="margin:10px 0"><label class="small muted" for="iez">Element</label><select id="iez" class="sel">${EL.map(e => `<option value="${e.z}" ${e.z === 13 ? 'selected' : ''}>${e.z} ${e.s} (${e.n})</option>`).join('')}</select><button class="btn alt" data-r="1">Mystery element</button></div>
     <p class="small">Tap the bar <b>just after</b> the first big jump (the first electron removed from an inner shell).</p><div class="fig" style="min-height:280px"><svg></svg></div><div class="simfb"></div><button class="btn alt" data-an="1">Show full analysis</button>`;
    const s = pane.querySelector('select'), svg = pane.querySelector('svg'), fb = pane.querySelector('.simfb'); let mystery = false;
    const go = () => { const e = EL[+s.value - 1]; const ie = e.ie; const lab = ie.map((_, i) => String(i + 1)); bars(svg, lab, ie, true); fb.className = 'simfb'; fb.innerHTML = mystery ? 'Mystery element: which group is it in?' : `${e.n}: ${ie.length} ionisation energies (NIST data).`; svg.onclick = ev => { const r = ev.target.closest('rect'); if (!r) return; const i = +r.dataset.i; const c = config(EL, e.z, e.z); const outer = shells(c).slice(-1)[0]; const ok = i === outer; bars(svg, lab, ie, true, [i]); fb.className = 'simfb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = ok ? `✔ Yes: ${outer} electron${outer > 1 ? 's' : ''} before the jump, so ${outer} in the outer shell. ${mystery ? `It is <b>${e.n}</b>.` : ''}` : `✘ Not quite. Compare each value with the one before: where is the biggest ratio?` } };
    s.onchange = () => { mystery = false; go() }; pane.querySelector('[data-r]').onclick = () => { const p = [3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 19, 20]; s.value = p[Math.floor(Math.random() * p.length)]; mystery = true; go() };
    pane.querySelector('[data-an]').onclick = () => { const e = EL[+s.value - 1], c = config(EL, e.z, e.z), sh = shells(c); const B = []; let acc = 0; for (let k = sh.length - 1; k > 0; k--) { acc += sh[k]; B.push(acc) } const big = B.filter(i => i < e.ie.length).map(i => `between IE${i} and IE${i + 1} (×${(e.ie[i] / e.ie[i - 1]).toFixed(1)})`); fb.className = 'simfb ok'; fb.innerHTML = `<b>${e.n}</b>: shells ${sh.join(', ')} → configuration ${cfgString(c)}.<br>Big jumps (new, inner shell) ${big.join('; ') || 'none: only one shell'}. Smaller steps within a shell show changes of sub-shell or paired electrons. Each jump marks a move to a shell closer to the nucleus with less shielding.` };
    new ResizeObserver(go).observe(svg); go();
  }
  function trend() {
    pane.innerHTML = `<div class="row" style="margin:10px 0"><label class="small muted" for="iep">Show</label><select id="iep" class="sel"><option value="p2">Period 2 (Li–Ne)</option><option value="p3" selected>Period 3 (Na–Ar)</option><option value="p4">Period 4 (K–Kr)</option><option value="g1">Group 1 (H–K)</option><option value="g2">Group 2 (Be–Ca)</option><option value="g17">Group 17 (F–Br)</option><option value="all">H to Kr</option></select></div><div class="fig" style="min-height:280px"><svg></svg></div><div class="simfb ok small"></div>`;
    const s = pane.querySelector('select'), svg = pane.querySelector('svg'), fb = pane.querySelector('.simfb');
    const SET = { p2: [3, 10], p3: [11, 18], p4: [19, 36], g1: [1, 3, 11, 19], g2: [4, 12, 20], g17: [9, 17, 35], all: [1, 36] };
    const NOTE = { p2: 'General rise (more protons, same shell). Drops at B (2p electron, higher energy) and O (paired 2p electron: spin-pair repulsion).', p3: 'Same pattern as Period 2: drops at Al (3p) and S (paired 3p electron).', p4: 'Rise across, with only a gentle rise through the d-block (3d electrons shield the 4s electrons). Drops at Ga (4p) and Se (paired 4p).', g1: 'Decreases down the group: outer electron further away and more shielded.', g2: 'Decreases down the group for the same reasons.', g17: 'Decreases down the group.', all: 'Peaks at the noble gases, troughs at the Group 1 metals.' };
    const go = () => { const v = SET[s.value]; const zs = (s.value[0] === 'g') ? v : Array.from({ length: v[1] - v[0] + 1 }, (_, i) => v[0] + i); bars(svg, zs.map(z => EL[z - 1].s), zs.map(z => EL[z - 1].ie[0]), false); fb.innerHTML = NOTE[s.value] };
    s.onchange = go; new ResizeObserver(go).observe(svg); go();
  }
  succ();
};
})();

/* ---------------- shared: formula parser ---------------- */
(function () {
function parseFormula(f, EL) {
  const AR = {}; EL.forEach(e => AR[e.s] = e.ar);
  f = f.replace(/\s+/g, '').replace(/[·•]/g, '.');
  const parts = f.split('.'); const tot = {};
  const add = (a, b, k) => { for (const x in b) a[x] = (a[x] || 0) + b[x] * k };
  for (let part of parts) {
    let mult = 1; const m0 = part.match(/^(\d+)(.*)$/); if (m0) { mult = +m0[1]; part = m0[2] }
    let i = 0;
    const group = () => { const c = {}; while (i < part.length) { const ch = part[i];
        if (ch === '(') { i++; const g = group(); if (part[i] !== ')') throw 'Missing )'; i++; const n = num(); add(c, g, n) }
        else if (ch === ')') break;
        else { const m = part.slice(i).match(/^([A-Z][a-z]?)/); if (!m) throw `Unexpected "${ch}"`; const s = m[1]; if (!(s in AR)) throw `Unknown element ${s}`; i += s.length; const n = num(); c[s] = (c[s] || 0) + n } }
      return c };
    const num = () => { const m = part.slice(i).match(/^\d+/); if (m) { i += m[0].length; return +m[0] } return 1 };
    const g = group(); if (i < part.length) throw 'Check brackets'; add(tot, g, mult);
  }
  if (!Object.keys(tot).length) throw 'Type a formula';
  const M = Object.entries(tot).reduce((s, [e, n]) => s + AR[e] * n, 0);
  return { atoms: tot, M, AR };
}
window.parseFormula = parseFormula;
const f3 = x => { if (!isFinite(x)) return '–'; const a = Math.abs(x); if (a !== 0 && (a < 0.001 || a >= 1e5)) { const e = Math.floor(Math.log10(a)); return (x / 10 ** e).toFixed(2) + ' × 10<sup>' + e + '</sup>' } return +x.toPrecision(3) + '' };
const fmtF = f => f.replace(/(\d+)/g, (m, d, off, s) => (off > 0 && /[A-Za-z)]/.test(s[off - 1])) ? `<sub>${d}</sub>` : d).replace(/\./g, '•');

/* ---------------- 5. Mole calculator ---------------- */
SIMS.moles = function (el, EL) {
  el.innerHTML = `<div class="simgrid"><div><label class="small muted" for="mf">Formula</label><input id="mf" class="sel" style="width:100%;font-size:18px" value="CuSO4.5H2O" autocomplete="off" spellcheck="false">
   <div class="mmout simfb ok small"></div>
   <label class="small muted" for="mk">I know the…</label><select id="mk" class="sel" style="width:100%"><option value="m">mass (g)</option><option value="n">amount (mol)</option><option value="N">number of particles</option><option value="V">gas volume at room conditions (dm³)</option><option value="c">solution: concentration (mol dm⁻³) and volume (cm³)</option></select>
   <div class="row" style="margin-top:8px"><input id="mv" class="sel" type="number" step="any" value="12.5" aria-label="Value" style="flex:1"><input id="mv2" class="sel hide" type="number" step="any" value="250" aria-label="Volume in cm³" style="flex:1" placeholder="volume / cm³"></div></div>
   <div><div class="mres"></div></div></div>`;
  const $ = s => el.querySelector(s);
  function go() {
    let P; try { P = parseFormula($('#mf').value, EL) } catch (e) { $('.mmout').className = 'mmout simfb bad small'; $('.mmout').textContent = String(e); $('.mres').innerHTML = ''; return }
    const fs = fmtF($('#mf').value.replace(/\s+/g, ''));
    $('.mmout').className = 'mmout simfb ok small';
    $('.mmout').innerHTML = `M(${fs}) = ` + Object.entries(P.atoms).map(([e, n]) => `${n > 1 ? n + ' × ' : ''}${P.AR[e]}`).join(' + ') + ` = <b>${P.M.toFixed(1)} g mol⁻¹</b>`;
    const k = $('#mk').value, v = +$('#mv').value, v2 = +$('#mv2').value; $('#mv2').classList.toggle('hide', k !== 'c');
    let n, step;
    if (k === 'm') { n = v / P.M; step = `n = m ÷ M = ${v} ÷ ${P.M.toFixed(1)} = <b>${f3(n)} mol</b>` }
    if (k === 'n') { n = v; step = `n = <b>${f3(n)} mol</b>` }
    if (k === 'N') { n = v / 6.02e23; step = `n = N ÷ L = ${f3(v)} ÷ 6.02 × 10<sup>23</sup> = <b>${f3(n)} mol</b>` }
    if (k === 'V') { n = v / 24.0; step = `n = V ÷ 24.0 = ${v} ÷ 24.0 = <b>${f3(n)} mol</b>` }
    if (k === 'c') { n = v * v2 / 1000; step = `n = c × V = ${v} × (${v2} ÷ 1000) = <b>${f3(n)} mol</b>` }
    const atoms = Object.values(P.atoms).reduce((a, b) => a + b, 0);
    $('.mres').innerHTML = `<p class="small muted">Step 1: convert to moles</p><div class="eq" style="text-align:left">${step}</div>
     <p class="small muted">Step 2: convert moles to anything else</p><table class="t"><tbody>
     <tr><td>mass</td><td>m = n × M = ${f3(n)} × ${P.M.toFixed(1)}</td><td><b>${f3(n * P.M)} g</b></td></tr>
     <tr><td>particles (formula units)</td><td>N = n × L</td><td><b>${f3(n * 6.02e23)}</b></td></tr>
     <tr><td>atoms in total</td><td>N × ${atoms}</td><td><b>${f3(n * 6.02e23 * atoms)}</b></td></tr>
     <tr><td>gas volume (if a gas)</td><td>V = n × 24.0</td><td><b>${f3(n * 24.0)} dm³</b></td></tr>
     <tr><td>concentration in 250 cm³</td><td>c = n ÷ 0.250</td><td><b>${f3(n / 0.25)} mol dm⁻³</b></td></tr></tbody></table>`;
  }
  el.querySelectorAll('input,select').forEach(x => x.addEventListener('input', go)); go();
};

/* ---------------- 6. Calculation trainer ---------------- */
SIMS.stoich = function (el, EL) {
  const R = (a, b, dp = 2) => +(a + Math.random() * (b - a)).toFixed(dp);
  const M = f => parseFormula(f, EL).M;
  const T = {
    mass: () => { const opts = [['CaCO3', 'CaO', 'CaCO<sub>3</sub>(s) → CaO(s) + CO<sub>2</sub>(g)', 1, 1], ['Mg', 'MgO', '2Mg(s) + O<sub>2</sub>(g) → 2MgO(s)', 2, 2], ['Fe2O3', 'Fe', 'Fe<sub>2</sub>O<sub>3</sub>(s) + 3CO(g) → 2Fe(l) + 3CO<sub>2</sub>(g)', 1, 2], ['C2H5OH', 'CO2', 'C<sub>2</sub>H<sub>5</sub>OH(l) + 3O<sub>2</sub>(g) → 2CO<sub>2</sub>(g) + 3H<sub>2</sub>O(l)', 1, 2]];
      const [a, b, eq, ca, cb] = opts[Math.floor(Math.random() * opts.length)]; const m = R(2, 40, 2); const n = m / M(a), nb = n * cb / ca, ans = nb * M(b);
      return { q: `${eq}<br>Calculate the mass of ${fmtF(b)} formed from ${m} g of ${fmtF(a)}.`, unit: 'g', ans, sol: [`n(${fmtF(a)}) = ${m} ÷ ${M(a).toFixed(1)} = ${f3(n)} mol`, `ratio ${ca} : ${cb} → n(${fmtF(b)}) = ${f3(nb)} mol`, `m = ${f3(nb)} × ${M(b).toFixed(1)} = <b>${f3(ans)} g</b>`] } },
    gas: () => { const m = R(0.1, 2.5, 3); const n = m / M('Mg'), V = n * 24.0;
      return { q: `Mg(s) + 2HCl(aq) → MgCl<sub>2</sub>(aq) + H<sub>2</sub>(g)<br>${m} g of magnesium reacts with an excess of acid. Calculate the volume of hydrogen, in cm³, at room conditions.`, unit: 'cm³', ans: V * 1000, sol: [`n(Mg) = ${m} ÷ 24.3 = ${f3(n)} mol = n(H<sub>2</sub>)`, `V = ${f3(n)} × 24 000 = <b>${f3(V * 1000)} cm³</b>`] } },
    titr: () => { const c = R(0.050, 0.200, 3), v = R(15, 28, 2), va = 25.0; const n = c * v / 1000, nb = 2 * n, cb = nb / (va / 1000);
      return { q: `H<sub>2</sub>SO<sub>4</sub>(aq) + 2NaOH(aq) → Na<sub>2</sub>SO<sub>4</sub>(aq) + 2H<sub>2</sub>O(l)<br>25.0 cm³ of NaOH(aq) is neutralised by ${v} cm³ of ${c} mol dm⁻³ H<sub>2</sub>SO<sub>4</sub>. Calculate the concentration of the NaOH in mol dm⁻³.`, unit: 'mol dm⁻³', ans: cb, sol: [`n(H<sub>2</sub>SO<sub>4</sub>) = ${c} × ${v}/1000 = ${f3(n)} mol`, `n(NaOH) = 2 × ${f3(n)} = ${f3(nb)} mol`, `c = ${f3(nb)} ÷ 0.0250 = <b>${f3(cb)} mol dm⁻³</b>`] } },
    lim: () => { const m = R(0.2, 1.2, 3), c = R(0.5, 2.0, 2), v = R(10, 50, 1); const nm = m / 24.3, na = c * v / 1000; const lim = nm < na / 2 ? 'Mg' : 'HCl'; const nh = Math.min(nm, na / 2), V = nh * 24000;
      return { q: `Mg(s) + 2HCl(aq) → MgCl<sub>2</sub>(aq) + H<sub>2</sub>(g)<br>${m} g of Mg is added to ${v} cm³ of ${c} mol dm⁻³ HCl. Calculate the volume of H<sub>2</sub>, in cm³, at room conditions.`, unit: 'cm³', ans: V, sol: [`n(Mg) = ${f3(nm)} mol; n(HCl) = ${f3(na)} mol`, `moles ÷ coefficient: Mg ${f3(nm)}, HCl ${f3(na / 2)} → <b>${lim} is limiting</b>`, `n(H<sub>2</sub>) = ${f3(nh)} mol → V = <b>${f3(V)} cm³</b>`] } },
    yield: () => { const m = R(5, 30, 1); const th = m / M('CaCO3') * M('CaO'); const act = +(th * R(0.6, 0.95, 2)).toFixed(2); const y = act / th * 100;
      return { q: `CaCO<sub>3</sub>(s) → CaO(s) + CO<sub>2</sub>(g)<br>${m} g of CaCO<sub>3</sub> is heated and ${act} g of CaO is obtained. Calculate the percentage yield.`, unit: '%', ans: y, sol: [`n(CaCO<sub>3</sub>) = ${m} ÷ 100.1 = ${f3(m / M('CaCO3'))} mol`, `theoretical CaO = ${f3(m / M('CaCO3'))} × 56.1 = ${f3(th)} g`, `yield = ${act} ÷ ${f3(th)} × 100 = <b>${f3(y)}%</b>`] } },
    emp: () => { const L = [['CH2O', 'C', 'H', 'O'], ['C2H6O', 'C', 'H', 'O'], ['C3H6O2', 'C', 'H', 'O'], ['CH4O', 'C', 'H', 'O'], ['C2H4O', 'C', 'H', 'O'], ['C3H8O', 'C', 'H', 'O'], ['NH2', 'N', 'H'], ['CH2Cl', 'C', 'H', 'Cl'], ['C4H5', 'C', 'H'], ['Na2S2O3', 'Na', 'S', 'O']]; const [f] = L[Math.floor(Math.random() * L.length)]; const P = parseFormula(f, EL);
      const pc = Object.entries(P.atoms).map(([e, n]) => [e, P.AR[e] * n / P.M * 100]);
      return { emp: f, q: `A compound contains ${pc.map(([e, p]) => `${p.toFixed(1)}% ${e}`).join(', ')} by mass. Find its empirical formula (type it, e.g. C2H6O).`, sol: [pc.map(([e, p]) => `${e}: ${p.toFixed(1)} ÷ ${P.AR[e]} = ${(p / P.AR[e]).toFixed(3)}`).join('; '), 'divide by the smallest, then multiply if needed to reach whole numbers', `empirical formula = <b>${fmtF(f)}</b>`] } },
  };
  const NAMES = { mass: 'Reacting masses', gas: 'Gas volume', titr: 'Titration', lim: 'Limiting reagent', yield: 'Percentage yield', emp: 'Empirical formula' };
  el.innerHTML = `<div class="row">${Object.entries(NAMES).map(([k, v]) => `<button class="btn alt tabb" data-k="${k}">${v}</button>`).join('')}</div><div class="card" style="margin-top:10px"><div class="tq"></div><div class="row" style="margin-top:10px"><input class="sel ta" style="flex:1;min-width:140px" aria-label="Your answer" placeholder="Your answer"><span class="tu small muted"></span><button class="btn y tc">Check</button><button class="btn alt ts">Show working</button><button class="btn alt tn">New numbers</button></div><div class="simfb"></div><p class="small muted" style="margin:6px 0 0">Score this session: <b class="tsc">0 / 0</b></p></div>`;
  let cur = null, kind = 'mass', ok = 0, tries = 0; const $ = s => el.querySelector(s);
  const ratio = f => { const P = parseFormula(f, EL); const v = Object.values(P.atoms); const g = v.reduce((a, b) => { while (b) [a, b] = [b, a % b]; return a }); return JSON.stringify(Object.entries(P.atoms).sort().map(([e, n]) => [e, n / g])) };
  function newQ(k) { kind = k || kind; el.querySelectorAll('.tabb').forEach(b => { b.classList.toggle('on', b.dataset.k === kind); b.classList.toggle('alt', b.dataset.k !== kind) }); cur = T[kind](); $('.tq').innerHTML = cur.q; $('.tu').textContent = cur.unit || ''; $('.ta').value = ''; $('.simfb').className = 'simfb'; $('.simfb').innerHTML = '' }
  el.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.k) newQ(b.dataset.k);
    if (b.classList.contains('tn')) newQ();
    if (b.classList.contains('ts')) { $('.simfb').className = 'simfb ok'; $('.simfb').innerHTML = '<ol>' + cur.sol.map(s => `<li>${s}</li>`).join('') + '</ol>' }
    if (b.classList.contains('tc')) { const v = $('.ta').value.trim(); if (!v) return; tries++; let good = false;
      if (cur.emp) { try { good = ratio(v) === ratio(cur.emp) && JSON.stringify(Object.values(parseFormula(v, EL).atoms).sort()) === JSON.stringify(Object.values(parseFormula(cur.emp, EL).atoms).sort()) } catch (_) { good = false } }
      else { const x = parseFloat(v.replace(/[^0-9.eE+-]/g, '')); good = Math.abs(x - cur.ans) / cur.ans < 0.012 }
      if (good) ok++; $('.tsc').textContent = `${ok} / ${tries}`;
      $('.simfb').className = 'simfb ' + (good ? 'ok' : 'bad'); $('.simfb').innerHTML = good ? `✔ Correct${cur.emp ? '' : ` (${f3(cur.ans)} ${cur.unit})`}. Try New numbers.` : '✘ Not quite. Check your mole ratio and units, or press Show working.' } });
  newQ('mass');
};
})();

/* ======================= Chapter 3 simulations ======================= */
(function () {
/* ---------- bond-type meter ---------- */
SIMS.bondtype = function (el, EL) {
  const els = EL.filter(e => e.en != null);
  const opt = s => els.map(e => `<option value="${e.s}"${e.s === s ? ' selected' : ''}>${e.s} – ${e.n} (${e.en})</option>`).join('');
  el.innerHTML = `<div class="row"><label class="small">Atom 1<br><select class="sel" data-a>${opt('Na')}</select></label><label class="small">Atom 2<br><select class="sel" data-b>${opt('Cl')}</select></label></div>
   <svg viewBox="0 0 620 120" width="100%" role="img" aria-label="Electronegativity difference meter" style="margin-top:12px">
    <defs><linearGradient id="bt" x1="0" x2="1"><stop offset="0" stop-color="#a0c4ff"/><stop offset=".5" stop-color="#fdffb6"/><stop offset="1" stop-color="#ffb4a2"/></linearGradient></defs>
    <rect x="20" y="40" width="580" height="26" rx="13" fill="url(#bt)"/>
    <text x="20" y="90" font-size="13" fill="var(--mute)">0</text><text x="590" y="90" font-size="13" fill="var(--mute)">3.3</text>
    <text x="40" y="30" font-size="13" fill="var(--ink)">non-polar</text><text x="250" y="30" font-size="13" fill="var(--ink)">polar covalent</text><text x="510" y="30" font-size="13" fill="var(--ink)">ionic</text>
    <line x1="${20 + 580 * 1.8 / 3.3}" y1="36" x2="${20 + 580 * 1.8 / 3.3}" y2="70" stroke="var(--mute)" stroke-dasharray="3 3"/>
    <g data-n><polygon points="0,0 -9,-14 9,-14" fill="var(--navy)"/><text y="44" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)"></text></g></svg>
   <div class="simfb ok" data-r aria-live="polite"></div>`;
  const a = el.querySelector('[data-a]'), b = el.querySelector('[data-b]'), n = el.querySelector('[data-n]'), r = el.querySelector('[data-r]');
  function go() {
    const A = els.find(e => e.s === a.value), B = els.find(e => e.s === b.value); const d = Math.abs(A.en - B.en);
    const x = 20 + 580 * Math.min(d, 3.3) / 3.3; n.setAttribute('transform', `translate(${x},40)`); n.querySelector('text').textContent = 'Δ = ' + d.toFixed(2);
    const type = d === 0 ? 'non-polar covalent' : d < 1.8 ? 'polar covalent' : 'ionic';
    const neg = A.en === B.en ? null : (A.en > B.en ? A : B), pos = neg === A ? B : A;
    r.innerHTML = `<b>${A.s}</b> ${A.en} and <b>${B.s}</b> ${B.en}: difference <b>${d.toFixed(2)}</b> → <b>${type}</b>. ` +
      (neg ? (type === 'ionic' ? `${neg.s} gains electrons (anion); ${pos.s} loses them (cation).` : `${neg.s} is δ−, ${pos.s} is δ+.`) : 'The electrons are shared equally.') +
      (A.s === B.s ? '' : ` <span class="small muted">The 1.8 boundary is a guide, not a sharp cut-off.</span>`);
  }
  a.onchange = b.onchange = go; go();
};

/* ---------- VSEPR 3D explorer ---------- */
const S3 = Math.sqrt(3) / 2;
const GEOM = {
  2: [[1, 0, 0], [-1, 0, 0]],
  3: [[0, 1, 0], [S3, -.5, 0], [-S3, -.5, 0]],
  4: [[0, 1, 0], [.943, -.333, 0], [-.471, -.333, .816], [-.471, -.333, -.816]],
  5: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-.5, 0, S3], [-.5, 0, -S3]],
  6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]],
};
const LPSLOT = { 3: [0], 4: [0, 1], 5: [2, 3, 4], 6: [0, 1] };   // where lone pairs go (equatorial for 5, opposite for 6)
const SHAPE = {
  '2,0': ['linear', '180°', 1], '3,0': ['trigonal planar', '120°', 1], '2,1': ['non-linear (bent)', 'about 118° (less than 120°)', 1],
  '4,0': ['tetrahedral', '109.5°', 1], '3,1': ['pyramidal', '107°', 1], '2,2': ['non-linear (bent)', '104.5°', 1],
  '5,0': ['trigonal bipyramidal', '120° and 90°', 1], '4,1': ['see-saw', 'about 90° and 120°', 0], '3,2': ['T-shaped', 'about 90°', 0], '2,3': ['linear', '180°', 0],
  '6,0': ['octahedral', '90°', 1], '5,1': ['square pyramidal', 'about 90°', 0], '4,2': ['square planar', '90°', 0],
};
const MOLS = [['CO₂', 'C', 'O', 2, 0, 'Two C=O double bonds count as two regions.'], ['BeCl₂', 'Be', 'Cl', 2, 0, ''], ['BF₃', 'B', 'F', 3, 0, 'Boron has only 6 outer electrons.'], ['SO₂', 'S', 'O', 2, 1, 'Two S=O regions and one lone pair.'], ['CH₄', 'C', 'H', 4, 0, ''], ['NH₄⁺', 'N', 'H', 4, 0, '5 + 4 − 1 = 8 electrons.'], ['BF₄⁻', 'B', 'F', 4, 0, '3 + 4 + 1 = 8 electrons.'], ['NH₃', 'N', 'H', 3, 1, ''], ['H₃O⁺', 'O', 'H', 3, 1, '6 + 3 − 1 = 8 electrons.'], ['H₂O', 'O', 'H', 2, 2, ''], ['PF₅', 'P', 'F', 5, 0, 'Expanded octet: 10 electrons.'], ['SF₆', 'S', 'F', 6, 0, 'Expanded octet: 12 electrons.'], ['XeF₄', 'Xe', 'F', 4, 2, 'Beyond AS, for interest.']];
SIMS.vsepr = function (el) {
  el.innerHTML = `<div class="simgrid"><div><svg viewBox="-150 -150 300 300" width="100%" style="max-width:360px;touch-action:none;cursor:grab;display:block;margin:auto" role="img" aria-label="3D model of the molecule; drag to rotate"></svg><p class="small muted" style="text-align:center;margin:0">Drag to rotate</p></div>
   <div><label class="small">Pick a molecule<br><select class="sel" data-m style="width:100%"><option value="">– or set pairs below –</option>${MOLS.map((m, i) => `<option value="${i}">${m[0]}</option>`).join('')}</select></label>
   <div class="row" style="margin-top:10px"><label class="small">Bonding pairs<br><select class="sel" data-b>${[2, 3, 4, 5, 6].map(n => `<option${n === 4 ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
   <label class="small">Lone pairs<br><select class="sel" data-l>${[0, 1, 2, 3].map(n => `<option>${n}</option>`).join('')}</select></label></div>
   <div class="simfb ok" data-o aria-live="polite"></div></div></div>`;
  const svg = el.querySelector('svg'), mS = el.querySelector('[data-m]'), bS = el.querySelector('[data-b]'), lS = el.querySelector('[data-l]'), out = el.querySelector('[data-o]');
  let rx = -0.3, ry = 0.35, cen = 'X', ter = 'Y', note = '', drag = null, spin = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rot = ([x, y, z]) => { let c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; c = Math.cos(rx); s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]; return [x, y, z] };
  function domains() {
    const bp = +bS.value, lp = +lS.value, n = bp + lp; if (n < 2 || n > 6 || !GEOM[n]) return null;
    const g = GEOM[n], ls = (LPSLOT[n] || []).slice(0, lp); if (ls.length < lp) return null;
    return g.map((v, i) => ({ v, lone: ls.includes(i) }));
  }
  function draw() {
    const D = domains(); const key = bS.value + ',' + lS.value; const sh = SHAPE[key];
    if (!D || !sh) { svg.innerHTML = `<text x="0" y="0" text-anchor="middle" fill="var(--mute)" font-size="14">Choose 2–6 electron pairs in total</text>`; out.className = 'simfb bad'; out.innerHTML = 'That combination is not covered: choose between 2 and 6 pairs in total.'; return }
    const R = 105, items = [];
    D.forEach(d => { const p = rot(d.v); items.push({ z: p[2], d, p }) });
    items.sort((a, b) => a.z - b.z);
    let g = '';
    const back = items.filter(i => i.z < 0), front = items.filter(i => i.z >= 0);
    const bond = i => `<line x1="0" y1="0" x2="${i.p[0] * R}" y2="${-i.p[1] * R}" stroke="var(--mute)" stroke-width="${6 + i.z * 2}" stroke-linecap="round"/>`;
    const atom = i => { const s = 1 + i.z * .18; return i.d.lone ? `<g opacity=".75"><ellipse cx="${i.p[0] * R * .62}" cy="${-i.p[1] * R * .62}" rx="${17 * s}" ry="${11 * s}" fill="#fde68a" stroke="#d97706" transform="rotate(${Math.atan2(-i.p[1], i.p[0]) * 180 / Math.PI} ${i.p[0] * R * .62} ${-i.p[1] * R * .62})"/><circle cx="${i.p[0] * R * .62 - 4}" cy="${-i.p[1] * R * .62}" r="2.6" fill="#92400e"/><circle cx="${i.p[0] * R * .62 + 4}" cy="${-i.p[1] * R * .62}" r="2.6" fill="#92400e"/></g>`
      : `<circle cx="${i.p[0] * R}" cy="${-i.p[1] * R}" r="${20 * s}" fill="#a0c4ff" stroke="#1d4ed8" stroke-width="1.5"/><text x="${i.p[0] * R}" y="${-i.p[1] * R + 5}" text-anchor="middle" font-size="${14 * s}" font-weight="700" fill="#0b1636">${ter}</text>` };
    back.forEach(i => { if (!i.d.lone) g += bond(i) }); back.forEach(i => g += atom(i));
    g += `<circle cx="0" cy="0" r="26" fill="#22c8f2" stroke="#0b7ea3" stroke-width="2"/><text x="0" y="6" text-anchor="middle" font-size="17" font-weight="800" fill="#0b1636">${cen}</text>`;
    front.forEach(i => { if (!i.d.lone) g += bond(i) }); front.forEach(i => g += atom(i));
    svg.innerHTML = g;
    out.className = 'simfb ok';
    out.innerHTML = `<b>${bS.value}</b> bonding pair${bS.value > 1 ? 's' : ''} + <b>${lS.value}</b> lone pair${lS.value == 1 ? '' : 's'} = ${+bS.value + +lS.value} regions<br>Shape: <b>${sh[0]}</b><br>Bond angle: <b>${sh[1]}</b>${sh[2] ? '' : '<br><span class="small muted">This shape goes beyond the AS examples, but you can predict it with the same rules.</span>'}${note ? `<br><span class="small">${note}</span>` : ''}<br><span class="small muted">Lone pairs (yellow) repel more than bonding pairs, so they squeeze the bond angles.</span>`;
  }
  mS.onchange = () => { const m = MOLS[mS.value]; if (m) { cen = m[1]; ter = m[2]; bS.value = m[3]; lS.value = m[4]; note = m[5] } draw() };
  bS.onchange = lS.onchange = () => { mS.value = ''; cen = 'X'; ter = 'Y'; note = ''; draw() };
  svg.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY, rx, ry]; spin = false; svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing' });
  svg.addEventListener('pointermove', e => { if (!drag) return; ry = drag[3] + (e.clientX - drag[0]) / 80; rx = drag[2] + (e.clientY - drag[1]) / 80; draw() });
  svg.addEventListener('pointerup', () => { drag = null; svg.style.cursor = 'grab' });
  (function tick() { if (!el.isConnected) return; if (spin) { ry += 0.01; draw() } requestAnimationFrame(tick) })();
  mS.value = '4'; mS.onchange();
};

/* ---------- intermolecular forces sorter ---------- */
const IMF = [
  ['helium, He', 0, 0, 'A single atom with no dipole: only id-id forces.'],
  ['methane, CH₄', 0, 0, 'C–H bonds are almost non-polar and the molecule is symmetrical.'],
  ['tetrachloromethane, CCl₄', 0, 0, 'The C–Cl bonds are polar, but the tetrahedral shape cancels the dipoles.'],
  ['carbon dioxide, CO₂', 0, 0, 'Linear: the two C=O dipoles cancel.'],
  ['hydrogen chloride, HCl', 1, 0, 'Polar molecule (Cl is δ−), but Cl is not N, O or F, so no hydrogen bonding.'],
  ['propanone, CH₃COCH₃', 1, 0, 'Polar C=O, but no H bonded to O, so no hydrogen bonding between propanone molecules.'],
  ['trichloromethane, CHCl₃', 1, 0, 'The dipoles do not cancel, so pd-pd forces act. No N–H, O–H or H–F.'],
  ['methoxymethane, CH₃OCH₃', 1, 0, 'Polar (bent C–O–C), but every H is bonded to carbon, so it cannot hydrogen bond with itself.'],
  ['water, H₂O', 1, 1, 'O–H bonds and two lone pairs on O: hydrogen bonding (plus id-id; hydrogen bonds are a strong type of permanent dipole attraction).'],
  ['ammonia, NH₃', 1, 1, 'N–H bonds and a lone pair on N: hydrogen bonding.'],
  ['methanol, CH₃OH', 1, 1, 'Has an O–H group: hydrogen bonding.'],
  ['hydrogen fluoride, HF', 1, 1, 'H bonded to F, which has lone pairs: hydrogen bonding.'],
];
SIMS.imf = function (el) {
  let order = IMF.map((_, i) => i).sort(() => Math.random() - .5), k = 0, ok = 0, done = 0;
  el.innerHTML = `<div class="card" style="box-shadow:none"><p class="small muted" style="margin:0">Substance <b data-k></b> of ${IMF.length} · score <b data-s>0</b></p><h3 data-n style="margin:6px 0 10px"></h3>
   <div style="display:grid;gap:8px"><label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-f="0" style="width:22px;height:22px;flex:none;margin:1px 0 0"><span> instantaneous dipole–induced dipole (id-id)</span></label>
   <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-f="1" style="width:22px;height:22px;flex:none;margin:1px 0 0"><span> permanent dipole–permanent dipole (pd-pd)</span></label>
   <label style="display:flex;gap:10px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-f="2" style="width:22px;height:22px;flex:none;margin:1px 0 0"><span> hydrogen bonding</span></label></div>
   <div class="row" style="margin-top:10px"><button class="btn y" data-c>Check</button><button class="btn alt" data-x>Next substance</button></div><div class="simfb" data-o aria-live="polite"></div></div>`;
  const q = s => el.querySelector(s), boxes = [...el.querySelectorAll('[data-f]')];
  function show() { const it = IMF[order[k]]; q('[data-k]').textContent = k + 1; q('[data-n]').textContent = it[0]; boxes.forEach(b => { b.checked = false; b.disabled = false }); q('[data-o]').className = 'simfb'; q('[data-o]').innerHTML = ''; q('[data-c]').disabled = false }
  q('[data-c]').onclick = () => {
    const it = IMF[order[k]], want = [1, it[2] || it[1] ? 1 : 0, it[2]]; const got = boxes.map(b => b.checked ? 1 : 0);
    const right = want.every((w, i) => w === got[i]); done++; if (right) ok++; q('[data-s]').textContent = `${ok}/${done}`;
    boxes.forEach(b => b.disabled = true); q('[data-c]').disabled = true;
    const names = ['id-id', 'pd-pd', 'hydrogen bonding']; const list = names.filter((_, i) => want[i]).join(', ');
    q('[data-o]').className = 'simfb ' + (right ? 'ok' : 'bad'); q('[data-o]').innerHTML = `${right ? '✔ Correct.' : '✘ Not quite.'} Forces present: <b>${list}</b>. ${it[3]}${!want[0] ? '' : ' <span class="small muted">Id-id forces act between all molecules.</span>'}`;
  };
  q('[data-x]').onclick = () => { k = (k + 1) % IMF.length; if (k === 0) order = order.sort(() => Math.random() - .5); show() };
  show();
};

/* ---------------- Chapter 4: ideal gas lab ---------------- */
SIMS.gas = function (el) {
  const R = 8.31, f = x => (Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2) && x !== 0 ? x.toExponential(2).replace(/e([+-]?)(\d+)/, (m, sg, d) => ' × 10' + (sg === '-' ? '⁻' : '') + String(+d).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')) : (+x.toPrecision(3)).toString();
  el.innerHTML = `<div class="simgrid"><div>
   <canvas class="gascv" width="420" height="240" style="width:100%;max-width:420px;background:var(--card2,#f4f8fb);border-radius:12px;border:1px solid var(--line,#dde)"></canvas>
   <p class="small muted" style="margin:4px 0">Each dot stands for about 5 × 10²⁰ molecules. The grey wall moves as V changes.</p></div>
   <div><label class="small">Amount, n: <b data-o="n"></b> mol</label><input type="range" data-s="n" min="0.02" max="0.30" step="0.01" value="0.10" style="width:100%">
   <label class="small">Volume, V: <b data-o="V"></b> dm³</label><input type="range" data-s="V" min="0.5" max="5" step="0.1" value="2.5" style="width:100%">
   <label class="small">Temperature, T: <b data-o="T"></b> K (<span data-o="C"></span> °C)</label><input type="range" data-s="T" min="100" max="900" step="5" value="300" style="width:100%">
   <label class="small muted">Hold constant while you change the others:</label>
   <select class="sel" data-hold style="width:100%"><option value="">nothing (p changes)</option><option value="p">pressure (V follows T and n)</option></select>
   <div class="eq" data-res style="text-align:left;margin-top:8px"></div></div></div>
   <details style="margin-top:10px"><summary><b>Solver:</b> find any unknown, with working</summary>
   <div class="row" style="margin-top:8px;flex-wrap:wrap;gap:6px">
    <select class="sel" data-u><option value="p">find p</option><option value="V">find V</option><option value="n">find n</option><option value="T">find T</option><option value="M">find M (from mass)</option></select></div>
   <div data-ins class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px"></div><div class="simfb ok" data-w style="margin-top:8px"></div></details>`;
  const q = s => el.querySelector(s), st = { n: .1, V: 2.5, T: 300 }; let pHeld = null;
  const cv = q('.gascv'), cx = cv.getContext('2d'); let parts = [];
  function sync() {
    const N = Math.round(st.n * 400); while (parts.length < N) parts.push({ x: Math.random(), y: Math.random(), a: Math.random() * 6.283 }); parts.length = N;
    const p = st.n * R * st.T / (st.V / 1000);
    q('[data-o=n]').textContent = st.n.toFixed(2); q('[data-o=V]').textContent = st.V.toFixed(1); q('[data-o=T]').textContent = st.T; q('[data-o=C]').textContent = st.T - 273;
    q('[data-res]').innerHTML = `p = nRT / V<br>= ${st.n.toFixed(2)} × 8.31 × ${st.T} / (${st.V.toFixed(1)} × 10⁻³ m³)<br>= <b>${f(p / 1000)} kPa</b> <span class="small muted">(${f(p)} Pa)</span>`;
  }
  el.querySelectorAll('[data-s]').forEach(r => r.addEventListener('input', () => {
    const k = r.dataset.s; st[k] = +r.value;
    if (pHeld && k !== 'V') { st.V = Math.min(5, Math.max(.5, st.n * R * st.T / pHeld * 1000)); q('[data-s=V]').value = st.V }
    if (pHeld && k === 'V') pHeld = st.n * R * st.T / (st.V / 1000);
    sync();
  }));
  q('[data-hold]').onchange = e => { pHeld = e.target.value ? st.n * R * st.T / (st.V / 1000) : null };
  function frame() {
    if (!el.isConnected) return;
    const W = cv.width, H = cv.height, w = 40 + (W - 60) * st.V / 5, sp = 0.0016 * Math.sqrt(st.T / 300) * 5 / st.V;
    cx.clearRect(0, 0, W, H); cx.fillStyle = '#9aa6b2'; cx.fillRect(w, 8, 8, H - 16); cx.strokeStyle = '#9aa6b2'; cx.lineWidth = 3; cx.strokeRect(8, 8, w - 8, H - 16);
    const hot = Math.min(1, (st.T - 100) / 800); cx.fillStyle = `rgb(${40 + 200 * hot},${120 - 60 * hot},${220 - 180 * hot})`;
    for (const P of parts) { P.x += Math.cos(P.a) * sp; P.y += Math.sin(P.a) * sp * w / (H - 16);
      if (P.x < 0 || P.x > 1) { P.a = Math.PI - P.a; P.x = Math.max(0, Math.min(1, P.x)) } if (P.y < 0 || P.y > 1) { P.a = -P.a; P.y = Math.max(0, Math.min(1, P.y)) }
      cx.beginPath(); cx.arc(14 + P.x * (w - 20), 14 + P.y * (H - 28), 3, 0, 6.283); cx.fill() }
    requestAnimationFrame(frame);
  }
  const U = { p: [['kPa', 1e3], ['Pa', 1], ['atm', 101e3]], V: [['dm³', 1e-3], ['cm³', 1e-6], ['m³', 1]], T: [['K', 0], ['°C', 273]], n: [['mol', 1]], m: [['g', 1]] };
  const NAME = { p: 'pressure', V: 'volume', T: 'temperature', n: 'amount', m: 'mass' }, DEF = { p: 101, V: 2.4, T: 298, n: 0.1, m: 0.5 };
  function ins() {
    const u = q('[data-u]').value, need = u === 'M' ? ['m', 'p', 'V', 'T'] : ['p', 'V', 'n', 'T'].filter(k => k !== u);
    q('[data-ins]').innerHTML = need.map(k => `<span style="display:inline-flex;gap:4px;align-items:center"><span class="small">${k === 'm' ? 'mass' : k}</span><input class="sel" type="number" step="any" data-v="${k}" value="${DEF[k]}" style="width:90px" aria-label="${NAME[k]}"><select class="sel" data-uu="${k}">${U[k].map((x, i) => `<option value="${i}">${x[0]}</option>`).join('')}</select></span>`).join('');
    q('[data-ins]').querySelectorAll('input,select').forEach(x => x.addEventListener('input', solve)); solve();
  }
  function solve() {
    const u = q('[data-u]').value, v = {}, line = [];
    q('[data-ins]').querySelectorAll('[data-v]').forEach(i => {
      const k = i.dataset.v, x = +i.value, ui = U[k][+q(`[data-uu=${k}]`).value];
      v[k] = k === 'T' ? x + ui[1] : x * ui[1];
      if (k === 'T' && ui[1]) line.push(`T = ${x} + 273 = ${v.T} K`); else if (k !== 'n' && k !== 'm' && ui[1] !== 1 && k !== 'T') line.push(`${k} = ${x} ${ui[0]} = ${f(v[k])} ${k === 'p' ? 'Pa' : 'm³'}`);
    });
    let r;
    if (u === 'p') r = `p = nRT / V = ${f(v.n)} × 8.31 × ${f(v.T)} / ${f(v.V)} = <b>${f(v.n * R * v.T / v.V)} Pa</b> = ${f(v.n * R * v.T / v.V / 1000)} kPa`;
    if (u === 'V') { const V = v.n * R * v.T / v.p; r = `V = nRT / p = ${f(v.n)} × 8.31 × ${f(v.T)} / ${f(v.p)} = <b>${f(V)} m³</b> = ${f(V * 1000)} dm³ = ${f(V * 1e6)} cm³` }
    if (u === 'n') r = `n = pV / RT = ${f(v.p)} × ${f(v.V)} / (8.31 × ${f(v.T)}) = <b>${f(v.p * v.V / (R * v.T))} mol</b>`;
    if (u === 'T') { const T = v.p * v.V / (v.n * R); r = `T = pV / nR = ${f(v.p)} × ${f(v.V)} / (${f(v.n)} × 8.31) = <b>${f(T)} K</b> (${f(T - 273)} °C)` }
    if (u === 'M') { const n = v.p * v.V / (R * v.T); r = `n = pV / RT = ${f(n)} mol<br>M = m / n = ${f(v.m)} / ${f(n)} = <b>${f(v.m / n)} g mol⁻¹</b>` }
    q('[data-w]').innerHTML = (line.length ? '<span class="small muted">Convert to SI first:</span><br>' + line.join('<br>') + '<br>' : '') + r;
  }
  q('[data-u]').onchange = ins; ins(); sync(); frame();
};

/* ---------------- Chapter 4: structure detective ---------------- */
const STRUCT = [
 // name, m.p./°C, conducts solid, conducts liquid, in water, answer (0 ionic,1 simple,2 giant cov,3 metallic), explanation
 ['potassium iodide', 681, 'no', 'yes', 'dissolves; solution conducts', 0, 'Conducts only when molten or dissolved: the ions become free to move.'],
 ['silicon carbide', 2730, 'no', 'no', 'insoluble', 2, 'Never conducts and has a very high melting point: strong covalent bonds throughout a giant lattice.'],
 ['naphthalene', 80, 'no', 'no', 'insoluble (dissolves in hexane)', 1, 'Low melting point and no charged particles: weak forces between molecules.'],
 ['magnesium', 650, 'yes', 'yes', 'reacts very slowly', 3, 'Conducts as a solid: delocalised electrons.'],
 ['calcium oxide', 2613, 'no', 'yes', 'reacts to form Ca(OH)₂', 0, 'Conducts only when molten; very high m.p. because Ca²⁺ and O²⁻ are doubly charged.'],
 ['sulfur (S₈)', 115, 'no', 'no', 'insoluble', 1, 'S₈ molecules held by id-id forces: low m.p., no conduction.'],
 ['diamond', 3550, 'no', 'no', 'insoluble', 2, 'Each C has four strong covalent bonds; no delocalised electrons.'],
 ['graphite', 3650, 'yes', '—', 'insoluble', 2, 'The exception: giant covalent, but one delocalised electron per C lets it conduct. Its very high m.p. rules out a metal.'],
 ['iron', 1538, 'yes', 'yes', 'insoluble (rusts slowly)', 3, 'Conducts as a solid and liquid: metallic.'],
 ['glucose', 146, 'no', 'no', 'dissolves; solution does not conduct', 1, 'Dissolves because it hydrogen bonds with water, but makes no ions: simple molecular.'],
 ['aluminium oxide', 2072, 'no', 'yes', 'insoluble', 0, 'Conducts when molten, so ionic, even though it does not dissolve.'],
 ['tetrachloromethane, CCl₄', -23, 'no', 'no', 'insoluble (dissolves in hexane)', 1, 'A liquid at room temperature that never conducts: simple molecular.'],
 ['silicon(IV) oxide', 1710, 'no', 'no', 'insoluble', 2, 'Giant covalent Si–O network.'],
 ['ice', 0, 'no', 'no', '— (it is water)', 1, 'H₂O molecules held by hydrogen bonds; the O–H bonds do not break on melting.'],
 ['sodium', 98, 'yes', 'yes', 'reacts vigorously', 3, 'Low m.p. for a metal (one delocalised electron per atom), but it conducts as a solid.'],
];
SIMS.structid = function (el) {
  const NM = ['giant ionic', 'simple molecular', 'giant molecular (covalent)', 'giant metallic'];
  let order = STRUCT.map((_, i) => i).sort(() => Math.random() - .5), k = 0, ok = 0, done = 0;
  el.innerHTML = `<div class="card" style="box-shadow:none"><p class="small muted" style="margin:0">Card <b data-k></b> of ${STRUCT.length} · score <b data-sc>0</b></p>
   <table class="t" style="margin:8px 0"><tbody data-tb></tbody></table>
   <div class="row" style="flex-wrap:wrap;gap:6px">${NM.map((n, i) => `<button class="btn alt" data-pick="${i}">${n}</button>`).join('')}</div>
   <div class="simfb" data-fb aria-live="polite"></div><div class="row" style="margin-top:8px"><button class="btn y" data-nx>Next card</button></div></div>`;
  const q = s => el.querySelector(s), btns = [...el.querySelectorAll('[data-pick]')];
  function show() {
    const it = STRUCT[order[k]]; q('[data-k]').textContent = k + 1;
    q('[data-tb]').innerHTML = `<tr><td>melting point</td><td><b>${it[1]} °C</b></td></tr><tr><td>conducts as a solid?</td><td><b>${it[2]}</b></td></tr><tr><td>conducts when molten?</td><td><b>${it[3]}</b></td></tr><tr><td>with water</td><td><b>${it[4]}</b></td></tr>`;
    btns.forEach(b => { b.disabled = false; b.className = 'btn alt' }); q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = '';
  }
  btns.forEach(b => b.onclick = () => {
    const it = STRUCT[order[k]], g = +b.dataset.pick, right = g === it[5]; done++; if (right) ok++;
    q('[data-sc]').textContent = `${ok}/${done}`; btns.forEach(x => x.disabled = true); btns[it[5]].className = 'btn y';
    q('[data-fb]').className = 'simfb ' + (right ? 'ok' : 'bad');
    q('[data-fb]').innerHTML = `${right ? '✔ Correct.' : '✘ Not quite.'} This is <b>${it[0]}</b>: ${NM[it[5]]}. ${it[6]}`;
  });
  q('[data-nx]').onclick = () => { k = (k + 1) % STRUCT.length; if (!k) order.sort(() => Math.random() - .5); show() };
  show();
};

/* ---------------- Chapter 5: energy profile builder ---------------- */
SIMS.profile = function (el) {
  el.innerHTML = `<div class="simgrid"><div><svg class="pfsvg" viewBox="0 0 420 300" width="100%" style="max-width:440px;background:var(--card2,#f4f8fb);border-radius:12px" font-family="Inter" font-size="13"></svg></div>
   <div><label class="small">ΔH: <b data-o="dh"></b> kJ mol⁻¹</label><input type="range" data-s="dh" min="-200" max="200" step="5" value="-80" style="width:100%">
   <label class="small">E<sub>a</sub> (forward): <b data-o="ea"></b> kJ mol⁻¹</label><input type="range" data-s="ea" min="10" max="300" step="5" value="120" style="width:100%">
   <label style="display:flex;gap:8px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" data-cat style="width:20px;height:20px"> add a catalyst</label>
   <div class="simfb ok" data-out></div></div></div>`;
  const q = s => el.querySelector(s), sv = q('.pfsvg');
  function draw() {
    let dh = +q('[data-s=dh]').value, ea = +q('[data-s=ea]').value;
    if (ea < dh) { ea = dh + 5; q('[data-s=ea]').value = ea }   // peak can never sit below the products
    const cat = q('[data-cat]').checked, eac = Math.max(Math.max(dh, 0) + 5, Math.round(ea * 0.55));
    q('[data-o=dh]').textContent = (dh > 0 ? '+' : '') + dh; q('[data-o=ea]').textContent = ea;
    const top = Math.max(ea, dh) + 20, bot = Math.min(0, dh) - 20, Y = e => 270 - (e - bot) / (top - bot) * 240;
    const yr = Y(0), yp = Y(dh), yk = Y(ea), yc = Y(eac);
    const curve = (yy) => `M30 ${yr} L110 ${yr} C 170 ${yr}, 170 ${yy}, 210 ${yy} C 250 ${yy}, 250 ${yp}, 310 ${yp} L400 ${yp}`;
    sv.innerHTML = `<defs><marker id="pa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
     <line x1="20" y1="20" x2="20" y2="280" stroke="#667"/><text x="8" y="150" transform="rotate(-90 8 150)" text-anchor="middle" fill="#556">energy</text><text x="215" y="296" text-anchor="middle" fill="#556">progress of reaction</text>
     <path d="${curve(yk)}" fill="none" stroke="#0b7ea3" stroke-width="3"/>
     ${cat ? `<path d="${curve(yc)}" fill="none" stroke="#e0890b" stroke-width="3" stroke-dasharray="7 5"/>` : ''}
     <text x="34" y="${yr + 17}">reactants</text><text x="398" y="${yp + 17}" text-anchor="end">products</text>
     <line x1="85" y1="${yr}" x2="85" y2="${yk + 2}" stroke="#c0392b" stroke-width="2" color="#c0392b" marker-end="url(#pa)"/><text x="90" y="${(yr + yk) / 2}" fill="#c0392b">E<tspan font-size="10" dy="3">a</tspan></text>
     ${cat ? `<line x1="140" y1="${yr}" x2="140" y2="${yc + 2}" stroke="#e0890b" stroke-width="2" color="#e0890b" marker-end="url(#pa)"/><text x="145" y="${(yr + yc) / 2 + 14}" fill="#e0890b">E<tspan font-size="10" dy="3">a</tspan><tspan dy="-3">(cat)</tspan></text>` : ''}
     ${dh ? `<line x1="355" y1="${yr}" x2="355" y2="${yp + (dh > 0 ? 2 : -2)}" stroke="#2e7d32" stroke-width="2" color="#2e7d32" marker-end="url(#pa)"/><line x1="300" y1="${yr}" x2="370" y2="${yr}" stroke="#2e7d32" stroke-dasharray="4 4"/><text x="360" y="${(yr + yp) / 2}" fill="#2e7d32">ΔH</text>` : ''}`;
    q('[data-out]').innerHTML = `${dh < 0 ? '<b>Exothermic</b>: products are lower than reactants.' : dh > 0 ? '<b>Endothermic</b>: products are higher than reactants.' : 'Thermoneutral (ΔH = 0).'}<br>
      E<sub>a</sub>(reverse) = E<sub>a</sub> − ΔH = ${ea} − (${dh}) = <b>${ea - dh} kJ mol⁻¹</b>${cat ? `<br>With the catalyst: E<sub>a</sub> ≈ ${eac} kJ mol⁻¹. ΔH is <b>unchanged</b>.` : ''}`;
  }
  el.querySelectorAll('input').forEach(i => i.addEventListener('input', draw)); draw();
};

/* ---------------- Chapter 5: Hess's law calculator ---------------- */
const HD = { // ΔHf, ΔHc / kJ mol⁻¹ (standard data-book values)
 'C(s)': [0, -393.5], 'H₂(g)': [0, -285.8], 'O₂(g)': [0, 0], 'N₂(g)': [0, 0], 'CO₂(g)': [-393.5, 0], 'H₂O(l)': [-285.8, 0], 'H₂O(g)': [-241.8, null],
 'CO(g)': [-110.5, -283.0], 'CH₄(g)': [-74.8, -890.3], 'C₂H₆(g)': [-84.7, -1559.7], 'C₂H₄(g)': [52.2, -1411.0], 'C₃H₈(g)': [-103.8, -2219.2],
 'CH₃OH(l)': [-238.7, -726.0], 'C₂H₅OH(l)': [-277.7, -1367.3], 'NH₃(g)': [-46.1, null], 'NO(g)': [90.3, null] };
const HR = [
 [[[1, 'C₂H₄(g)'], [1, 'H₂(g)']], [[1, 'C₂H₆(g)']]],
 [[[1, 'C₂H₄(g)'], [1, 'H₂O(l)']], [[1, 'C₂H₅OH(l)']]],
 [[[1, 'CO(g)'], [2, 'H₂(g)']], [[1, 'CH₃OH(l)']]],
 [[[2, 'CO(g)'], [1, 'O₂(g)']], [[2, 'CO₂(g)']]],
 [[[1, 'C(s)'], [2, 'H₂(g)']], [[1, 'CH₄(g)']]],
 [[[3, 'C(s)'], [4, 'H₂(g)']], [[1, 'C₃H₈(g)']]],
 [[[1, 'CH₄(g)'], [2, 'O₂(g)']], [[1, 'CO₂(g)'], [2, 'H₂O(l)']]],
 [[[4, 'NH₃(g)'], [5, 'O₂(g)']], [[4, 'NO(g)'], [6, 'H₂O(g)']]],
];
SIMS.hess = function (el) {
  const side = a => a.map(([n, s]) => (n > 1 ? n : '') + s).join(' + ');
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-r style="flex:1;min-width:240px">${HR.map((r, i) => `<option value="${i}">${side(r[0])} → ${side(r[1])}</option>`).join('')}</select>
   <select class="sel" data-d><option value="0">use ΔH<sub>f</sub> data</option><option value="1">use ΔH<sub>c</sub> data</option></select></div>
   <table class="t" style="margin-top:8px"><thead><tr><th>substance</th><th>ΔH<sub>f</sub> / kJ mol⁻¹</th><th>ΔH<sub>c</sub> / kJ mol⁻¹</th></tr></thead><tbody data-tb></tbody></table>
   <div class="simfb ok" data-w style="margin-top:8px"></div>`;
  const q = s => el.querySelector(s), r1 = x => (Math.round(x * 10) / 10).toFixed(1), sg = x => (x < 0 ? '(' + r1(x) + ')' : r1(x));
  function go() {
    const R = HR[+q('[data-r]').value], d = +q('[data-d]').value, all = [...R[0], ...R[1]];
    q('[data-tb]').innerHTML = all.map(([, s]) => `<tr><td>${s}</td><td>${r1(HD[s][0])}</td><td>${HD[s][1] === null ? '—' : r1(HD[s][1])}</td></tr>`).join('');
    if (all.some(([, s]) => HD[s][d] === null)) { q('[data-w]').className = 'simfb bad'; q('[data-w]').innerHTML = 'ΔH<sub>c</sub> data cannot be used here: some substances (such as NH₃ or NO) have no simple combustion value. Use ΔH<sub>f</sub>.'; return }
    const sum = a => a.reduce((t, [n, s]) => t + n * HD[s][d], 0), terms = a => a.map(([n, s]) => (n > 1 ? n : '') + sg(HD[s][d])).join(' + ');
    const P = sum(R[1]), Rr = sum(R[0]), dH = d ? Rr - P : P - Rr;
    q('[data-w]').className = 'simfb ok';
    q('[data-w]').innerHTML = d ? `ΔH = ΣΔH<sub>c</sub>(reactants) − ΣΔH<sub>c</sub>(products)<br>= [${terms(R[0])}] − [${terms(R[1])}]<br>= ${r1(Rr)} − (${r1(P)}) = <b>${r1(dH)} kJ mol⁻¹</b>`
      : `ΔH = ΣΔH<sub>f</sub>(products) − ΣΔH<sub>f</sub>(reactants)<br>= [${terms(R[1])}] − [${terms(R[0])}]<br>= ${r1(P)} − (${r1(Rr)}) = <b>${r1(dH)} kJ mol⁻¹</b>`;
  }
  q('[data-r]').onchange = go; q('[data-d]').onchange = go; go();
};

/* ---------------- Chapter 6: oxidation number finder ---------------- */
SIMS.oxnum = function (el, EL) {
  const E = {}; EL.forEach(e => E[e.s] = e);
  const PEROX = { 'H2O2': 1, 'Na2O2': 1, 'K2O2': 1, 'BaO2': 1, 'CaO2': 1 };
  const sgn = x => (x > 0 ? '+' : x < 0 ? '−' : '') + (Number.isInteger(x) ? Math.abs(x) : (Math.round(Math.abs(x) * 100) / 100));
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><input class="sel" data-f value="Cr2O7" style="flex:1;min-width:140px;font-size:18px" aria-label="Formula" autocomplete="off" spellcheck="false">
   <label class="small">charge <select class="sel" data-q>${[-3, -2, -1, 0, 1, 2, 3].map(q => `<option value="${q}" ${q === -2 ? 'selected' : ''}>${q > 0 ? '+' + q : q}</option>`).join('')}</select></label></div>
   <p class="small muted" style="margin:6px 0">Try: SO4 (−2), NH4 (+1), KMnO4, H2O2, NaH, OF2, PCl5, S4O6 (−2), Fe3O4, C2H5OH → type C2H6O.</p>
   <div class="simfb ok" data-w></div>`;
  const q = s => el.querySelector(s);
  function go() {
    const f = q('[data-f]').value.trim(), Q = +q('[data-q]').value, w = q('[data-w]');
    let P; try { P = parseFormula(f, EL) } catch (e) { w.className = 'simfb bad'; w.textContent = String(e) + ' (elements H to Kr only)'; return }
    const at = P.atoms, els = Object.keys(at), on = {}, why = [];
    const metalOnly = x => els.every(e => e === x || E[e].g <= 2 || e === 'Al');
    for (const e of els) {
      if (els.length === 1) { on[e] = Q / at[e]; why.push(`${e}: an element (or ion of one element) — oxidation number = charge ÷ atoms`); continue }
      if (e === 'F') { on.F = -1; why.push('F is always −1') }
      else if (E[e].g === 1 && e !== 'H') { on[e] = 1; why.push(`${e} (Group 1) is always +1`) }
      else if (E[e].g === 2) { on[e] = 2; why.push(`${e} (Group 2) is always +2`) }
      else if (e === 'Al') { on.Al = 3; why.push('Al is +3') }
      else if (e === 'H') { if (els.length === 2 && metalOnly('H')) { on.H = -1; why.push('H bonded to a metal (a hydride) is −1') } else { on.H = 1; why.push('H is +1 with non-metals') } }
    }
    if ('O' in at && !('O' in on)) {
      if (PEROX[f.replace(/\s/g, '')]) { on.O = -1; why.push('this is a peroxide: O is −1') }
      else if ('F' in at) { /* OF2: solve O */ }
      else { on.O = -2; why.push('O is −2 (except in peroxides and with F)') }
    }
    let unk = els.filter(e => !(e in on));
    if (unk.length === 2) {         // give the more electronegative one its usual negative value
      unk.sort((a, b) => E[b].en - E[a].en); const n = unk[0], g = E[n].g, v = g >= 13 ? g - 18 : null;
      if (v !== null) { on[n] = v; why.push(`${n} is the more electronegative of ${unk.join(' and ')}, so it takes its usual negative value (${sgn(v)})`); unk = [unk[1]] }
    }
    if (unk.length > 1) { w.className = 'simfb bad'; w.innerHTML = `Too many unknowns (${unk.join(', ')}). Oxidation numbers here need more information about the structure.`; return }
    if (unk.length === 1) {
      const u = unk[0], known = els.filter(e => e !== u).reduce((t, e) => t + at[e] * on[e], 0); on[u] = (Q - known) / at[u];
      why.push(`Sum of oxidation numbers = charge (${sgn(Q) || 0}): ${at[u] > 1 ? at[u] : ''}${u} + ${els.filter(e => e !== u).map(e => `${at[e] > 1 ? at[e] + '(' + sgn(on[e]) + ')' : sgn(on[e])}`).join(' + ')} = ${Q}, so ${u} = <b>${sgn(on[u])}</b>${Number.isInteger(on[u]) ? '' : ' (an average value)'}`);
    }
    w.className = 'simfb ok';
    w.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px">${els.map(e => `<span style="padding:6px 10px;border-radius:10px;background:var(--card,#fff);border:1px solid var(--line,#ddd)"><b>${e}</b> ${sgn(on[e]) || '0'}</span>`).join('')}</div><ol class="small" style="margin:0;padding-left:20px">${why.map(x => `<li>${x}</li>`).join('')}</ol>`;
  }
  q('[data-f]').addEventListener('input', go); q('[data-q]').onchange = go; go();
};

/* ---------------- Chapter 6: redox equation balancer (step by step) ---------------- */
const RB = [
 { t: 'Fe²⁺ + MnO₄⁻ (acid)', s: ['Fe: +2 → +3 (loses 1 e⁻). Mn: +7 → +2 (gains 5 e⁻).', 'Half-equations:<br>Fe²⁺ → Fe³⁺ + e⁻<br>MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', 'Make the electrons equal: multiply the iron half-equation by 5.', 'Add and cancel the electrons:<br><b>MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O</b>', 'Check charges: left −1 + 10 + 8 = +17; right +2 + 15 = +17 ✔'] },
 { t: 'Cr₂O₇²⁻ + I⁻ (acid)', s: ['Cr: +6 → +3 (each gains 3, so 6 per Cr₂O₇²⁻). I: −1 → 0 (loses 1 each).', 'Half-equations:<br>2I⁻ → I₂ + 2e⁻<br>Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O', 'Multiply the iodide half-equation by 3.', 'Add:<br><b>Cr₂O₇²⁻ + 6I⁻ + 14H⁺ → 2Cr³⁺ + 3I₂ + 7H₂O</b>', 'Check charges: −2 − 6 + 14 = +6; right 2 × 3 = +6 ✔'] },
 { t: 'Cu + HNO₃ (dilute) → NO', s: ['Cu: 0 → +2 (loses 2). N: +5 → +2 in NO (gains 3).', 'Electrons: 3 Cu lose 6; 2 N gain 6.', 'So 3Cu : 2NO. Extra nitrate is needed to make 3Cu(NO₃)₂: that is 6 more HNO₃ that are not reduced.', '<b>3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O</b>', 'Check H: 8 = 8 ✔; O: 24 = 18 + 2 + 4 ✔'] },
 { t: 'Cl₂ + hot NaOH (disproportionation)', s: ['Cl: 0 → −1 in NaCl (gains 1); 0 → +5 in NaClO₃ (loses 5).', 'For electrons to balance, 5 Cl atoms are reduced for every 1 oxidised.', 'That needs 6 Cl atoms = 3Cl₂, giving 5NaCl + NaClO₃.', '<b>3Cl₂ + 6NaOH → 5NaCl + NaClO₃ + 3H₂O</b>', 'Check O: 6 = 3 + 3 ✔'] },
 { t: 'H₂O₂ + MnO₄⁻ (acid)', s: ['O in H₂O₂: −1 → 0 in O₂ (each O loses 1, so 2 per H₂O₂). Mn: +7 → +2 (gains 5).', 'Half-equations:<br>H₂O₂ → O₂ + 2H⁺ + 2e⁻<br>MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O', 'Multiply by 5 and by 2 so that 10 electrons cancel.', 'Add, then cancel 10H⁺ from both sides:<br><b>2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O</b>', 'Check charges: −2 + 6 = +4; right +4 ✔'] },
 { t: 'S + conc. HNO₃ → H₂SO₄ + NO₂', s: ['S: 0 → +6 (loses 6). N: +5 → +4 (gains 1).', 'So 1 S : 6 HNO₃ (6 NO₂).', 'Balance H with water: 6 H on the left; 2 in H₂SO₄, so 2H₂O.', '<b>S + 6HNO₃ → H₂SO₄ + 6NO₂ + 2H₂O</b>', 'Check O: 18 = 4 + 12 + 2 ✔'] },
];
SIMS.balance = function (el) {
  el.innerHTML = `<select class="sel" data-r style="width:100%">${RB.map((r, i) => `<option value="${i}">${r.t}</option>`).join('')}</select>
   <ol data-st style="margin:10px 0;padding-left:22px;display:grid;gap:8px"></ol><div class="row"><button class="btn y" data-n>Show next step</button><button class="btn alt" data-a>Show all</button></div>`;
  const q = s => el.querySelector(s); let k = 0;
  function show() { const r = RB[+q('[data-r]').value]; q('[data-st]').innerHTML = r.s.slice(0, k).map(x => `<li>${x}</li>`).join(''); q('[data-n]').disabled = k >= r.s.length }
  q('[data-r]').onchange = () => { k = 0; show() }; q('[data-n]').onclick = () => { k++; show() }; q('[data-a]').onclick = () => { k = 99; show() }; show();
};
})();

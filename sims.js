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

/* ---------------- Chapter 7: Le Chatelier explorer ---------------- */
const LC = [
 { eq: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)', dh: -92, gl: 4, gr: 2, sp: ['N₂', 'H₂', 'NH₃'], st: [1, 3, 0.6], side: [-1, -1, 1] },
 { eq: '2SO₂(g) + O₂(g) ⇌ 2SO₃(g)', dh: -197, gl: 3, gr: 2, sp: ['SO₂', 'O₂', 'SO₃'], st: [0.6, 0.5, 1.4], side: [-1, -1, 1] },
 { eq: 'N₂O₄(g) ⇌ 2NO₂(g)', dh: 58, gl: 1, gr: 2, sp: ['N₂O₄', 'NO₂'], st: [1, 0.5], side: [-1, 1] },
 { eq: 'H₂(g) + I₂(g) ⇌ 2HI(g)', dh: -9.6, gl: 2, gr: 2, sp: ['H₂', 'I₂', 'HI'], st: [0.4, 0.4, 1.6], side: [-1, -1, 1] },
 { eq: 'CH₄(g) + H₂O(g) ⇌ CO(g) + 3H₂(g)', dh: 206, gl: 2, gr: 4, sp: ['CH₄', 'H₂O', 'CO', 'H₂'], st: [0.8, 0.8, 0.3, 0.9], side: [-1, -1, 1, 1] },
];
SIMS.lechat = function (el) {
  const CH = [['temperature up', 'T+'], ['temperature down', 'T-'], ['pressure up (smaller volume)', 'P+'], ['pressure down', 'P-'], ['add a catalyst', 'C'], ['add more of the first reactant', 'R+'], ['remove product', 'X-']];
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-r style="flex:1;min-width:220px">${LC.map((r, i) => `<option value="${i}">${r.eq}</option>`).join('')}</select>
   <select class="sel" data-c style="flex:1;min-width:200px">${CH.map(c => `<option value="${c[1]}">${c[0]}</option>`).join('')}</select><button class="btn y" data-go>Apply</button></div>
   <p class="small muted" data-dh style="margin:6px 0"></p><div data-bars style="display:grid;gap:6px;margin:8px 0"></div><div class="simfb" data-o></div>`;
  const q = s => el.querySelector(s);
  function bars(a, b) {
    const r = LC[+q('[data-r]').value], mx = Math.max(...a, ...(b || a)) * 1.1;
    q('[data-bars]').innerHTML = r.sp.map((s, i) => `<div style="display:grid;grid-template-columns:60px 1fr;gap:8px;align-items:center"><b>${s}</b><div><div style="height:12px;border-radius:6px;background:#9fb6c8;width:${a[i] / mx * 100}%"></div>${b ? `<div style="height:12px;margin-top:3px;border-radius:6px;background:${r.side[i] > 0 ? '#2e9e5b' : '#e0890b'};width:${b[i] / mx * 100}%;transition:width .6s"></div>` : ''}</div></div>`).join('') + (b ? '<p class="small muted" style="margin:0">grey: before · coloured: new equilibrium (amounts)</p>' : '');
  }
  function reset() { const r = LC[+q('[data-r]').value]; q('[data-dh]').innerHTML = `ΔH = ${r.dh > 0 ? '+' : ''}${r.dh} kJ mol⁻¹ (${r.dh > 0 ? 'endothermic' : 'exothermic'} forward) · gas moles: ${r.gl} on the left, ${r.gr} on the right`; q('[data-o]').className = 'simfb'; q('[data-o]').innerHTML = ''; bars(r.st) }
  q('[data-r]').onchange = reset;
  q('[data-go]').onclick = () => {
    const r = LC[+q('[data-r]').value], c = q('[data-c]').value; let dir = 0, why = '', K = 'K is unchanged (only temperature changes K).';
    if (c === 'T+' || c === 'T-') { const up = c === 'T+'; dir = (r.dh > 0) === up ? 1 : -1; why = `${up ? 'Raising' : 'Lowering'} the temperature favours the <b>${up ? 'endothermic' : 'exothermic'}</b> direction, which is the <b>${dir > 0 ? 'forward' : 'reverse'}</b> reaction here.`; K = `K <b>${dir > 0 ? 'increases' : 'decreases'}</b>, because temperature is the only thing that changes K.` }
    if (c === 'P+' || c === 'P-') { const up = c === 'P+'; if (r.gl === r.gr) { dir = 0; why = 'Both sides have the same number of gas molecules, so changing the pressure does not move the equilibrium (both concentrations change by the same factor).' } else { const fewer = r.gr < r.gl ? 1 : -1; dir = up ? fewer : -fewer; why = `${up ? 'Higher' : 'Lower'} pressure favours the side with <b>${up ? 'fewer' : 'more'}</b> gas molecules, which is the <b>${dir > 0 ? 'right' : 'left'}</b>.` } }
    if (c === 'C') { dir = 0; why = 'A catalyst speeds up the forward and reverse reactions equally. Equilibrium is reached sooner, but the position does not change.' }
    if (c === 'R+') { dir = 1; why = `Adding ${r.sp[0]} increases a reactant concentration, so the equilibrium shifts <b>right</b> to use some of it up.` }
    if (c === 'X-') { dir = 1; why = `Removing ${r.sp[r.sp.length - 1]} lowers a product concentration, so the equilibrium shifts <b>right</b> to replace some of it.` }
    const nw = r.st.map((v, i) => Math.max(0.05, v * (1 + 0.35 * dir * r.side[i]) + (c === 'R+' && i === 0 ? 0.4 : 0) - (c === 'X-' && i === r.sp.length - 1 ? 0.25 * v : 0)));
    bars(r.st, nw); q('[data-o]').className = 'simfb ok'; q('[data-o]').innerHTML = `<b>${dir > 0 ? '→ Shifts to the right' : dir < 0 ? '← Shifts to the left' : '⇌ No shift in position'}</b><br>${why}<br>${K}`;
  };
  reset();
};

/* ---------------- Chapter 7: equilibrium (ICE) table solver ---------------- */
SIMS.ice = function (el) {
  const R = [
   { eq: 'H₂ + I₂ ⇌ 2HI (g)', sp: ['H₂', 'I₂', 'HI'], n: [-1, -1, 2], st: [1.0, 1.0, 0], k: 2, v: 1.6, gas: true },
   { eq: 'N₂ + 3H₂ ⇌ 2NH₃ (g)', sp: ['N₂', 'H₂', 'NH₃'], n: [-1, -3, 2], st: [1.0, 3.0, 0], k: 2, v: 0.6, gas: true },
   { eq: '2SO₂ + O₂ ⇌ 2SO₃ (g)', sp: ['SO₂', 'O₂', 'SO₃'], n: [-2, -1, 2], st: [2.0, 1.2, 0], k: 2, v: 1.8, gas: true },
   { eq: 'N₂O₄ ⇌ 2NO₂ (g)', sp: ['N₂O₄', 'NO₂'], n: [-1, 2], st: [1.0, 0], k: 1, v: 0.8, gas: true },
   { eq: 'CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O (l)', sp: ['acid', 'alcohol', 'ester', 'water'], n: [-1, -1, 1, 1], st: [1.0, 1.0, 0, 0], k: 2, v: 0.667, gas: false },
  ];
  el.innerHTML = `<select class="sel" data-r style="width:100%">${R.map((r, i) => `<option value="${i}">${r.eq}</option>`).join('')}</select>
   <div data-in class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px"></div><div style="overflow-x:auto"><table class="t" style="margin-top:8px"><tbody data-tb></tbody></table></div><div class="simfb ok" data-w></div>`;
  const q = s => el.querySelector(s), f = x => (+x.toPrecision(3)).toString();
  function build() {
    const r = R[+q('[data-r]').value];
    q('[data-in]').innerHTML = r.sp.map((s, i) => `<label class="small">initial ${s} / mol <input class="sel" type="number" step="any" min="0" data-st="${i}" value="${r.st[i]}" style="width:80px"></label>`).join('') +
      `<label class="small">equilibrium ${r.sp[r.k]} / mol <input class="sel" type="number" step="any" min="0" data-eqv value="${r.v}" style="width:80px"></label><label class="small">volume / dm³ <input class="sel" type="number" step="any" min="0.01" data-vol value="1.0" style="width:70px"></label>` +
      (r.gas ? `<label class="small">total pressure / kPa <input class="sel" type="number" step="any" min="1" data-p value="200" style="width:80px"></label>` : '');
    q('[data-in]').querySelectorAll('input').forEach(x => x.addEventListener('input', go)); go();
  }
  function go() {
    const r = R[+q('[data-r]').value], st = r.sp.map((_, i) => +q(`[data-st="${i}"]`).value), ev = +q('[data-eqv]').value, V = +q('[data-vol]').value;
    const x = (ev - st[r.k]) / r.n[r.k], eqm = st.map((s, i) => s + r.n[i] * x);
    q('[data-tb]').innerHTML = `<tr><th></th>${r.sp.map(s => `<th>${s}</th>`).join('')}</tr><tr><td>initial / mol</td>${st.map(v => `<td>${f(v)}</td>`).join('')}</tr><tr><td>change / mol</td>${r.n.map(n => `<td>${n * x > 0 ? '+' : ''}${f(n * x)}</td>`).join('')}</tr><tr><td><b>equilibrium / mol</b></td>${eqm.map(v => `<td><b>${f(v)}</b></td>`).join('')}</tr><tr><td>concentration / mol dm⁻³</td>${eqm.map(v => `<td>${f(v / V)}</td>`).join('')}</tr>`;
    if (eqm.some(v => v < -1e-9)) { q('[data-w]').className = 'simfb bad'; q('[data-w]').textContent = 'That equilibrium amount is impossible: a reactant would go below zero.'; return }
    const term = (i, val) => `${val}${Math.abs(r.n[i]) > 1 ? '<sup>' + Math.abs(r.n[i]) + '</sup>' : ''}`;
    const c = eqm.map(v => v / V), top = r.n.map((n, i) => n > 0 ? c[i] ** n : 1).reduce((a, b) => a * b, 1), bot = r.n.map((n, i) => n < 0 ? c[i] ** -n : 1).reduce((a, b) => a * b, 1);
    const dn = r.n.reduce((a, b) => a + b, 0), units = dn === 0 ? 'no units' : `(mol dm⁻³)${dn === 1 ? '' : '<sup>' + dn + '</sup>'}`.replace('(mol dm⁻³)<sup>-1</sup>', 'dm³ mol⁻¹').replace('(mol dm⁻³)<sup>-2</sup>', 'dm⁶ mol⁻²');
    let out = `K<sub>c</sub> = ${r.n.map((n, i) => n > 0 ? term(i, '[' + r.sp[i] + ']') : '').join('')} / ${r.n.map((n, i) => n < 0 ? term(i, '[' + r.sp[i] + ']') : '').join('')}<br>= ${r.n.map((n, i) => n > 0 ? term(i, '(' + f(c[i]) + ')') : '').filter(Boolean).join(' × ')} / ${r.n.map((n, i) => n < 0 ? term(i, '(' + f(c[i]) + ')') : '').filter(Boolean).join(' × ')}<br>= <b>${f(top / bot)}</b> ${units}`;
    if (r.gas) {
      const P = +q('[data-p]').value, tot = eqm.reduce((a, b) => a + b, 0), pp = eqm.map(v => v / tot * P);
      const kp = r.n.map((n, i) => pp[i] ** n).reduce((a, b) => a * b, 1);
      out += `<hr style="border:none;border-top:1px solid var(--line,#ddd)">total = ${f(tot)} mol; mole fractions: ${r.sp.map((s, i) => `${s} ${f(eqm[i] / tot)}`).join(', ')}<br>partial pressures (= mole fraction × ${P} kPa): ${r.sp.map((s, i) => `${s} ${f(pp[i])}`).join(', ')}<br>K<sub>p</sub> = <b>${f(kp)}</b> ${dn === 0 ? 'no units' : 'kPa' + (dn === 1 ? '' : '<sup>' + dn + '</sup>')}`;
    }
    q('[data-w]').className = 'simfb ok'; q('[data-w]').innerHTML = out;
  }
  q('[data-r]').onchange = build; build();
};

/* ---------------- Chapter 8: Boltzmann distribution lab ---------------- */
SIMS.boltz = function (el) {
  el.innerHTML = `<div class="simgrid"><div><svg class="bzsvg" viewBox="0 0 440 290" width="100%" style="max-width:460px;background:var(--card2,#f4f8fb);border-radius:12px" font-family="Inter" font-size="12"></svg></div>
   <div><label class="small">Temperature: <b data-o="T"></b> K</label><input type="range" data-s="T" min="250" max="700" step="10" value="300" style="width:100%">
   <label style="display:flex;gap:8px;align-items:center;margin:6px 0;cursor:pointer"><input type="checkbox" data-ref checked style="width:20px;height:20px"> keep a 300 K reference curve</label>
   <label class="small">E<sub>a</sub>: <b data-o="ea"></b> kJ mol⁻¹</label><input type="range" data-s="ea" min="5" max="14" step="0.5" value="9" style="width:100%">
   <label style="display:flex;gap:8px;align-items:center;margin:6px 0;cursor:pointer"><input type="checkbox" data-cat style="width:20px;height:20px"> add a catalyst (lowers E<sub>a</sub> by 40%)</label>
   <div class="simfb ok" data-out></div></div></div>`;
  const q = s => el.querySelector(s), sv = q('.bzsvg'), R = 8.31e-3, EMAX = 16;
  const f = (E, T) => 2 * Math.sqrt(E / Math.PI) * Math.pow(1 / (R * T), 1.5) * Math.exp(-E / (R * T));   // Maxwell–Boltzmann energy distribution
  const frac = (Ea, T) => { let s = 0, d = 0.02; for (let E = Ea; E < 200; E += d) s += f(E, T) * d; return s };
  function draw() {
    const T = +q('[data-s=T]').value, ea0 = +q('[data-s=ea]').value, cat = q('[data-cat]').checked, ea = cat ? ea0 * 0.6 : ea0;
    q('[data-o=T]').textContent = T; q('[data-o=ea]').textContent = ea0;
    const X = E => 30 + E / EMAX * 395, ymax = f(R * 250 / 2, 250) * 1.08, Y = v => 260 - v / ymax * 240;
    const path = (T, n = 180) => { let d = ''; for (let i = 0; i <= n; i++) { const E = i / n * EMAX; d += (i ? 'L' : 'M') + X(E).toFixed(1) + ' ' + Y(f(E, T)).toFixed(1) } return d };
    let area = `M${X(ea)} 260`; for (let i = 0; i <= 80; i++) { const E = ea + i / 80 * (EMAX - ea); area += `L${X(E).toFixed(1)} ${Y(f(E, T)).toFixed(1)}` } area += `L${X(EMAX)} 260Z`;
    sv.innerHTML = `<line x1="30" y1="260" x2="430" y2="260" stroke="#667"/><line x1="30" y1="10" x2="30" y2="260" stroke="#667"/>
     <text x="230" y="282" text-anchor="middle" fill="#556">energy</text><text x="14" y="140" transform="rotate(-90 14 140)" text-anchor="middle" fill="#556">number of molecules</text>
     <path d="${area}" fill="#ffd23f" opacity=".55"/>
     ${q('[data-ref]').checked && T !== 300 ? `<path d="${path(300)}" fill="none" stroke="#9aa6b2" stroke-width="2" stroke-dasharray="6 4"/>` : ''}
     <path d="${path(T)}" fill="none" stroke="#0b7ea3" stroke-width="3"/>
     <line x1="${X(ea0)}" y1="20" x2="${X(ea0)}" y2="260" stroke="#c0392b" stroke-width="2"/><text x="${X(ea0) + 4}" y="30" fill="#c0392b">E<tspan font-size="9" dy="3">a</tspan></text>
     ${cat ? `<line x1="${X(ea)}" y1="40" x2="${X(ea)}" y2="260" stroke="#e0890b" stroke-width="2" stroke-dasharray="5 4"/><text x="${X(ea) + 4}" y="50" fill="#e0890b">E<tspan font-size="9" dy="3">a</tspan><tspan dy="-3">(cat)</tspan></text>` : ''}`;
    const p = frac(ea, T), p300 = frac(ea0, 300);
    q('[data-out]').innerHTML = `Shaded area: <b>${(p * 100).toPrecision(2)}%</b> of molecules have E ≥ E<sub>a</sub>.<br>Compared with 300 K and no catalyst: about <b>${p / p300 >= 100 ? Math.round(p / p300) : (p / p300).toPrecision(2)} ×</b> as many can react.<br><span class="small muted">The area under every curve is the same (same number of molecules). A catalyst moves E<sub>a</sub>, not the curve.</span>`;
  }
  el.querySelectorAll('input').forEach(i => i.addEventListener('input', draw)); draw();
};

/* ---------------- Chapter 8: rate experiment (gas volume v time) ---------------- */
SIMS.rateexp = function (el) {
  el.innerHTML = `<p class="small muted" style="margin:0 0 6px">Marble chips with 50 cm³ of 1.0 mol dm⁻³ HCl at 20 °C (grey). The acid is the limiting reactant.</p>
   <div class="simgrid"><div><svg class="rxsvg" viewBox="0 0 420 270" width="100%" style="max-width:440px;background:var(--card2,#f4f8fb);border-radius:12px" font-family="Inter" font-size="12"></svg></div>
   <div><label class="small">acid concentration: <b data-o="c"></b> mol dm⁻³</label><input type="range" data-s="c" min="0.5" max="2" step="0.25" value="1" style="width:100%">
   <label class="small">temperature: <b data-o="t"></b> °C</label><input type="range" data-s="t" min="10" max="50" step="5" value="20" style="width:100%">
   <label class="small">chip size</label><select class="sel" data-s="z" style="width:100%"><option value="1">large chips</option><option value="2.5" >small chips</option><option value="6">powder</option></select>
   <label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" data-add style="width:20px;height:20px"> double the volume of acid (100 cm³)</label>
   <div class="simfb ok" data-out></div></div></div>`;
  const q = s => el.querySelector(s), sv = q('.rxsvg');
  const run = (c, t, z, v) => { const nCO2 = c * v / 1000 / 2, Vmax = nCO2 * 24000, k = 0.012 * c * z * Math.pow(2, (t - 20) / 10); return { Vmax, k } };
  function draw() {
    const c = +q('[data-s=c]').value, t = +q('[data-s=t]').value, z = +q('[data-s=z]').value, v = q('[data-add]').checked ? 100 : 50;
    q('[data-o=c]').textContent = c; q('[data-o=t]').textContent = t;
    const a = run(1, 20, 1, 50), b = run(c, t, z, v), X = s => 58 + s / 300 * 352, Y = V => 245 - V / 2400 * 225;
    const curve = r => { let d = ''; for (let s = 0; s <= 300; s += 5) d += (s ? 'L' : 'M') + X(s) + ' ' + Y(r.Vmax * (1 - Math.exp(-r.k * s))).toFixed(1); return d };
    sv.innerHTML = `<line x1="58" y1="245" x2="415" y2="245" stroke="#667"/><line x1="58" y1="15" x2="58" y2="245" stroke="#667"/>
     ${[0, 100, 200, 300].map(s => `<text x="${X(s)}" y="260" text-anchor="middle" fill="#667">${s}</text>`).join('')}${[0, 600, 1200, 1800, 2400].map(V => `<text x="53" y="${Y(V) + 4}" text-anchor="end" fill="#667">${V}</text>`).join('')}
     <text x="236" y="268" text-anchor="middle" fill="#556" font-size="11">time / s</text><text x="12" y="130" transform="rotate(-90 12 130)" text-anchor="middle" fill="#556">volume CO₂ / cm³</text>
     <path d="${curve(a)}" fill="none" stroke="#9aa6b2" stroke-width="3"/><path d="${curve(b)}" fill="none" stroke="#0b7ea3" stroke-width="3"/>`;
    const r0 = (b.Vmax * b.k / (a.Vmax * a.k));
    q('[data-out]').innerHTML = `Initial rate: <b>${(b.Vmax * b.k).toFixed(1)} cm³ s⁻¹</b> (${r0.toPrecision(2)} × experiment 1).<br>Final volume: <b>${Math.round(b.Vmax)} cm³</b> ${Math.abs(b.Vmax - a.Vmax) < 1 ? '(same: same amount of acid)' : '(different: the amount of acid changed)'}.<br><span class="small muted">Steeper start = faster. The final volume depends only on the amount of the limiting reactant.</span>`;
  }
  el.querySelectorAll('input,select').forEach(i => i.addEventListener('input', draw)); draw();
};

/* ---------------- Chapter 9: Period 3 explorer ---------------- */
const P3 = [
 { s: 'Na', r: 0.186, ion: 'Na⁺ 0.102', mp: 371, en: 0.93, ie: 496, cond: 21, st: 'giant metallic', ox: 'Na₂O', oxs: 'giant ionic; basic', oxw: 'Na₂O + H₂O → 2NaOH (pH 13–14)', cl: 'NaCl', cls: 'giant ionic', clw: 'dissolves, no hydrolysis (pH 7)', w: 'reacts vigorously with cold water: 2Na + 2H₂O → 2NaOH + H₂' },
 { s: 'Mg', r: 0.160, ion: 'Mg²⁺ 0.072', mp: 923, en: 1.31, ie: 738, cond: 23, st: 'giant metallic', ox: 'MgO', oxs: 'giant ionic; basic', oxw: 'slightly soluble: MgO + H₂O → Mg(OH)₂ (pH about 9)', cl: 'MgCl₂', cls: 'giant ionic', clw: 'dissolves, very slight hydrolysis (pH about 6.5)', w: 'very slow with cold water; burns in steam: Mg + H₂O → MgO + H₂' },
 { s: 'Al', r: 0.143, ion: 'Al³⁺ 0.053', mp: 933, en: 1.61, ie: 578, cond: 38, st: 'giant metallic', ox: 'Al₂O₃', oxs: 'giant (ionic with covalent character); amphoteric', oxw: 'insoluble; reacts with HCl and with NaOH', cl: 'AlCl₃ (Al₂Cl₆)', cls: 'covalent, simple molecular dimer', clw: 'hydrolysed: fumes of HCl, solution pH about 3', w: 'protected by its oxide layer' },
 { s: 'Si', r: 0.117, ion: '—', mp: 1687, en: 1.90, ie: 787, cond: 0.002, st: 'giant covalent', ox: 'SiO₂', oxs: 'giant covalent; acidic', oxw: 'insoluble; reacts with hot concentrated NaOH', cl: 'SiCl₄', cls: 'simple molecular (liquid)', clw: 'hydrolysed: SiCl₄ + 2H₂O → SiO₂ + 4HCl (pH about 2)', w: 'no reaction' },
 { s: 'P', r: 0.110, ion: 'P³⁻ 0.212', mp: 317, en: 2.19, ie: 1012, cond: 0, st: 'simple molecular (P₄)', ox: 'P₄O₁₀', oxs: 'simple molecular; acidic', oxw: 'P₄O₁₀ + 6H₂O → 4H₃PO₄ (pH about 2)', cl: 'PCl₅ (and PCl₃)', cls: 'simple molecular', clw: 'hydrolysed: PCl₅ + 4H₂O → H₃PO₄ + 5HCl (pH about 2)', w: 'no reaction' },
 { s: 'S', r: 0.104, ion: 'S²⁻ 0.184', mp: 388, en: 2.58, ie: 1000, cond: 0, st: 'simple molecular (S₈)', ox: 'SO₂, SO₃', oxs: 'simple molecular; acidic', oxw: 'SO₂ + H₂O → H₂SO₃; SO₃ + H₂O → H₂SO₄ (pH about 1–2)', cl: '—', cls: '—', clw: '—', w: 'no reaction' },
 { s: 'Cl', r: 0.099, ion: 'Cl⁻ 0.180', mp: 172, en: 3.16, ie: 1251, cond: 0, st: 'simple molecular (Cl₂)', ox: '—', oxs: '—', oxw: '—', cl: '—', cls: '—', clw: '—', w: 'Cl₂ + H₂O ⇌ HCl + HClO' },
 { s: 'Ar', r: 0.071, ion: '—', mp: 84, en: 0, ie: 1521, cond: 0, st: 'single atoms', ox: '—', oxs: '—', oxw: '—', cl: '—', cls: '—', clw: '—', w: 'unreactive' },
];
SIMS.period3 = function (el) {
  const PR = [['mp', 'melting point / K'], ['r', 'atomic radius / nm'], ['ie', 'first ionisation energy / kJ mol⁻¹'], ['en', 'electronegativity (Pauling)'], ['cond', 'electrical conductivity / 10⁶ S m⁻¹']];
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px">${PR.map((p, i) => `<button class="btn ${i ? 'alt' : 'y'}" data-pr="${p[0]}">${p[1].split(' /')[0].replace(' (Pauling)', '')}</button>`).join('')}</div>
   <div data-ch style="display:flex;align-items:flex-end;gap:6px;height:190px;margin:12px 0 4px;padding:0 4px;border-bottom:2px solid #9aa6b2"></div>
   <div style="display:flex;gap:6px;padding:0 4px">${P3.map((e, i) => `<button class="btn alt" data-el="${i}" style="flex:1;min-width:0;padding:6px 0">${e.s}</button>`).join('')}</div>
   <p class="small muted" data-lab style="margin:6px 0"></p><div class="simfb ok" data-card></div>`;
  const q = s => el.querySelector(s); let prop = 'mp', sel = 0;
  function chart() {
    const lab = PR.find(p => p[0] === prop)[1], vals = P3.map(e => e[prop]), mx = Math.max(...vals);
    q('[data-lab]').textContent = lab + (prop === 'en' ? ' (no value for Ar)' : '');
    q('[data-ch]').innerHTML = P3.map((e, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span class="small" style="font-size:11px">${e[prop] || ''}</span><div style="width:80%;height:${Math.max(1, e[prop] / mx * 160)}px;border-radius:6px 6px 0 0;background:${i === sel ? '#ffd23f' : '#0b7ea3'};transition:height .4s"></div></div>`).join('');
    el.querySelectorAll('[data-pr]').forEach(b => b.className = 'btn ' + (b.dataset.pr === prop ? 'y' : 'alt'));
  }
  function card() { const e = P3[sel]; q('[data-card]').innerHTML = `<b style="font-size:18px">${e.s}</b> · structure: <b>${e.st}</b> · ion (radius / nm): ${e.ion}<br><b>with water:</b> ${e.w}<br><b>oxide:</b> ${e.ox} (${e.oxs}) — ${e.oxw}<br><b>chloride:</b> ${e.cl} (${e.cls}) — ${e.clw}`; chart() }
  el.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => { prop = b.dataset.pr; chart() });
  el.querySelectorAll('[data-el]').forEach(b => b.onclick = () => { sel = +b.dataset.el; card() });
  card();
};

/* ---------------- Chapter 9: mystery compound game ---------------- */
const P3Q = [
 ['A white solid oxide. It dissolves in water to give a solution of pH 14.', 'Na₂O', ['Na₂O', 'MgO', 'Al₂O₃', 'P₄O₁₀']],
 ['A white oxide, insoluble in water, that dissolves in both HCl(aq) and NaOH(aq).', 'Al₂O₃', ['MgO', 'Al₂O₃', 'SiO₂', 'Na₂O']],
 ['A colourless liquid chloride. With water it fumes and leaves a white solid.', 'SiCl₄', ['PCl₅', 'SiCl₄', 'AlCl₃', 'NaCl']],
 ['A white ionic chloride. Its solution has pH 7 and gives no precipitate with NaOH(aq).', 'NaCl', ['NaCl', 'MgCl₂', 'AlCl₃', 'SiCl₄']],
 ['A white solid oxide that reacts violently with water to give a solution of pH about 2.', 'P₄O₁₀', ['SiO₂', 'P₄O₁₀', 'Al₂O₃', 'SO₃']],
 ['A very hard oxide that melts above 1700 °C and is attacked only by hot concentrated NaOH.', 'SiO₂', ['Al₂O₃', 'MgO', 'SiO₂', 'P₄O₁₀']],
 ['A white chloride whose solution (pH 6.5) gives a white precipitate with NaOH that does not dissolve in excess.', 'MgCl₂', ['MgCl₂', 'AlCl₃', 'NaCl', 'PCl₅']],
 ['A pale yellow solid chloride that reacts with water giving steamy fumes and only a colourless acidic solution.', 'PCl₅', ['PCl₅', 'SiCl₄', 'AlCl₃', 'MgCl₂']],
 ['A white oxide, melting point 2852 °C, that reacts slowly with water to give a solution of pH about 9.', 'MgO', ['Na₂O', 'MgO', 'Al₂O₃', 'SiO₂']],
 ['An oxide that melts at 17 °C and reacts with water to form a strong acid.', 'SO₃', ['SO₃', 'P₄O₁₀', 'SiO₂', 'SO₂']],
];
SIMS.p3game = function (el) {
  let order = P3Q.map((_, i) => i).sort(() => Math.random() - .5), k = 0, ok = 0, n = 0;
  el.innerHTML = `<div class="card" style="box-shadow:none"><p class="small muted" style="margin:0">Mystery <b data-k></b> of ${P3Q.length} · score <b data-sc>0</b></p><p data-cl style="font-size:17px;margin:8px 0"></p>
   <div class="row" data-op style="flex-wrap:wrap;gap:6px"></div><div class="simfb" data-fb></div><div class="row" style="margin-top:8px"><button class="btn y" data-nx>Next mystery</button></div></div>`;
  const q = s => el.querySelector(s);
  function show() {
    const it = P3Q[order[k]]; q('[data-k]').textContent = k + 1; q('[data-cl]').textContent = it[0]; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = '';
    q('[data-op]').innerHTML = [...it[2]].sort(() => Math.random() - .5).map(o => `<button class="btn alt" data-ans="${o}">${o}</button>`).join('');
    q('[data-op]').querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
      const right = b.dataset.ans === it[1]; n++; if (right) ok++; q('[data-sc]').textContent = `${ok}/${n}`;
      q('[data-op]').querySelectorAll('button').forEach(x => { x.disabled = true; if (x.dataset.ans === it[1]) x.className = 'btn y' });
      q('[data-fb]').className = 'simfb ' + (right ? 'ok' : 'bad'); q('[data-fb]').innerHTML = right ? '✔ Correct!' : `✘ It is <b>${it[1]}</b>.`;
    });
  }
  q('[data-nx]').onclick = () => { k = (k + 1) % P3Q.length; if (!k) order.sort(() => Math.random() - .5); show() };
  show();
};

/* ---------------- Chapter 10: Group 2 trends ---------------- */
const G2 = [
 { s: 'Mg', r: 0.160, ie: 2186, mp: 650, oh: 0.0012, so4: 35.1, co3: 350, w: 'very slow with cold water; burns in steam → MgO + H₂' },
 { s: 'Ca', r: 0.197, ie: 1740, mp: 842, oh: 0.173, so4: 0.20, co3: 840, w: 'steady fizzing with cold water → Ca(OH)₂ (cloudy) + H₂' },
 { s: 'Sr', r: 0.215, ie: 1608, mp: 777, oh: 0.80, so4: 0.013, co3: 1290, w: 'faster fizzing → Sr(OH)₂ + H₂' },
 { s: 'Ba', r: 0.217, ie: 1468, mp: 727, oh: 3.9, so4: 0.00024, co3: 1360, w: 'vigorous → Ba(OH)₂ + H₂' },
];
SIMS.g2trends = function (el) {
  const PR = [['r', 'atomic radius / nm', 'increases: more shells'], ['ie', '1st + 2nd ionisation energy / kJ mol⁻¹', 'decreases: outer electrons further away and more shielded'], ['oh', 'solubility of hydroxide / g per 100 g water', 'increases down the group'], ['so4', 'solubility of sulfate / g per 100 g water', 'decreases down the group (log scale)'], ['co3', 'carbonate decomposition temperature / °C', 'increases: larger cations polarise the carbonate ion less']];
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px">${PR.map((p, i) => `<button class="btn ${i ? 'alt' : 'y'}" data-pr="${p[0]}">${p[1].split(' /')[0]}</button>`).join('')}</div>
   <div data-ch style="display:flex;align-items:flex-end;gap:10px;height:180px;margin:12px 0 4px;border-bottom:2px solid #9aa6b2"></div>
   <div style="display:flex;gap:10px">${G2.map(e => `<b style="flex:1;text-align:center">${e.s}</b>`).join('')}</div>
   <div class="simfb ok" data-o style="margin-top:8px"></div>`;
  const q = s => el.querySelector(s);
  function draw(k) {
    const p = PR.find(x => x[0] === k), lg = k === 'so4', v = G2.map(e => lg ? Math.log10(e[k]) + 4 : e[k]), mx = Math.max(...v);
    q('[data-ch]').innerHTML = G2.map((e, i) => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%"><span class="small">${e[k]}</span><div style="width:70%;height:${Math.max(2, v[i] / mx * 150)}px;background:#0b7ea3;border-radius:6px 6px 0 0;transition:height .4s"></div></div>`).join('');
    q('[data-o]').innerHTML = `<b>${p[1]}</b>: ${p[2]}.<br><span class="small">Reaction with water: ${G2.map(e => `<b>${e.s}</b> ${e.w}`).join('; ')}.</span>`;
    el.querySelectorAll('[data-pr]').forEach(b => b.className = 'btn ' + (b.dataset.pr === k ? 'y' : 'alt'));
  }
  el.querySelectorAll('[data-pr]').forEach(b => b.onclick = () => draw(b.dataset.pr)); draw('r');
};

/* ---------------- Chapter 10: thermal decomposition calculator ---------------- */
SIMS.decomp = function (el) {
  const AR = { Mg: 24.3, Ca: 40.1, Sr: 87.6, Ba: 137.3 }, T = { CO3: { Mg: 350, Ca: 840, Sr: 1290, Ba: 1360 }, NO3: { Mg: 330, Ca: 560, Sr: 570, Ba: 590 } };
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-m>${Object.keys(AR).map(m => `<option>${m}</option>`).join('')}</select>
   <select class="sel" data-a><option value="CO3">carbonate</option><option value="NO3">nitrate</option></select>
   <label class="small">mass / g <input class="sel" type="number" data-g value="5.00" step="any" min="0" style="width:90px"></label></div><div class="simfb ok" data-o style="margin-top:8px"></div>`;
  const q = s => el.querySelector(s), f = x => (+x.toPrecision(3)).toString();
  function go() {
    const m = q('[data-m]').value, a = q('[data-a]').value, g = +q('[data-g]').value, M = a === 'CO3' ? AR[m] + 60.0 : AR[m] + 124.0, n = g / M, MO = AR[m] + 16.0;
    const eq = a === 'CO3' ? `${m}CO₃ → ${m}O + CO₂` : `2${m}(NO₃)₂ → 2${m}O + 4NO₂ + O₂`;
    const gas = a === 'CO3' ? `CO₂: ${f(n)} mol = <b>${f(n * 24)} dm³</b>` : `NO₂: ${f(2 * n)} mol = <b>${f(48 * n)} dm³</b> (brown); O₂: ${f(n / 2)} mol = <b>${f(12 * n)} dm³</b>; total ${f(2.5 * n)} mol`;
    q('[data-o]').innerHTML = `<b>${eq}</b><br>M = ${f(M)} g mol⁻¹ → n = ${g} ÷ ${f(M)} = ${f(n)} mol<br>${gas}<br>residue ${m}O: ${f(n * MO)} g (mass loss ${f(g - n * MO)} g)<br><span class="small muted">Approximate decomposition temperature: about ${T[a][m]} °C. Lower down the group = larger cation = less polarisation of the anion = more stable.</span>`;
  }
  el.querySelectorAll('select,input').forEach(x => x.addEventListener('input', go)); go();
};

/* ---------------- Chapter 11: halogen test-tube lab ---------------- */
SIMS.halolab = function (el) {
  const X = ['Cl', 'Br', 'I'], NAME = { Cl: 'chlorine', Br: 'bromine', I: 'iodine' }, COL = { Cl: '#e8f7c8', Br: '#f2a23a', I: '#8a5a2b', none: '#eef6fb' }, AG = { Cl: ['white', '#ffffff', 'dissolves in dilute NH₃(aq)'], Br: ['cream', '#f3e7c3', 'dissolves only in concentrated NH₃(aq)'], I: ['yellow', '#f4dd4a', 'insoluble even in concentrated NH₃(aq)'] };
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px;align-items:center"><select class="sel" data-a><option value="hal">add halogen water</option><option value="ag">add AgNO₃(aq), then NH₃(aq)</option></select>
   <select class="sel" data-h>${X.map(x => `<option value="${x}">${NAME[x]} water</option>`).join('')}</select> to <select class="sel" data-k>${X.map(x => `<option value="${x}">K${x}(aq)</option>`).join('')}</select><button class="btn y" data-go>Mix</button></div>
   <div style="display:flex;gap:24px;align-items:flex-end;margin:12px 0"><svg viewBox="0 0 80 160" width="70" data-tube></svg><div class="simfb" data-o style="flex:1"></div></div>`;
  const q = s => el.querySelector(s);
  const tube = (c, ppt) => `<rect x="20" y="10" width="40" height="140" rx="20" fill="none" stroke="#667" stroke-width="3"/><rect x="23" y="60" width="34" height="86" rx="16" fill="${c}"/>${ppt ? `<ellipse cx="40" cy="132" rx="15" ry="9" fill="${ppt}" stroke="#bbb"/>` : ''}`;
  q('[data-a]').onchange = () => { q('[data-h]').style.display = q('[data-a]').value === 'hal' ? '' : 'none' };
  q('[data-go]').onclick = () => {
    const a = q('[data-a]').value, h = q('[data-h]').value, k = q('[data-k]').value, o = q('[data-o]');
    if (a === 'ag') { const g = AG[k]; q('[data-tube]').innerHTML = tube('#eef6fb', g[1]); o.className = 'simfb ok'; o.innerHTML = `Ag⁺(aq) + ${k}⁻(aq) → Ag${k}(s): <b>${g[0]} precipitate</b>, which ${g[2]}.`; return }
    const r = X.indexOf(h) < X.indexOf(k);
    q('[data-tube]').innerHTML = tube(r ? COL[k] : COL[h]);
    o.className = 'simfb ' + (r ? 'ok' : 'bad');
    o.innerHTML = h === k ? 'Same halogen and halide: nothing happens.' : r ? `<b>Reaction.</b> ${NAME[h][0].toUpperCase() + NAME[h].slice(1)} is the stronger oxidising agent: ${h}₂ + 2${k}⁻ → 2${h}⁻ + ${k}₂. The solution turns ${k === 'Br' ? 'orange' : 'brown'} as ${NAME[k]} forms.` : `<b>No reaction.</b> ${NAME[h][0].toUpperCase() + NAME[h].slice(1)} is a weaker oxidising agent than ${NAME[k]}, so it cannot oxidise ${k}⁻. The colour is just that of the ${NAME[h]} water.`;
  };
  q('[data-go]').click();
};

/* ---------------- Chapter 11: halides with concentrated sulfuric acid ---------------- */
SIMS.h2so4 = function (el) {
  const D = {
   NaCl: { eq: ['NaCl + H₂SO₄ → NaHSO₄ + HCl'], obs: 'steamy (misty) fumes of HCl', s: '+6 (no change)', why: 'Cl⁻ is too weak a reducing agent to reduce H₂SO₄. Only an acid–base reaction happens.' },
   NaBr: { eq: ['NaBr + H₂SO₄ → NaHSO₄ + HBr', '2HBr + H₂SO₄ → Br₂ + SO₂ + 2H₂O'], obs: 'steamy fumes of HBr, orange-brown vapour of Br₂, choking SO₂', s: '+6 → +4 (SO₂)', why: 'Br⁻ is a stronger reducing agent: it reduces H₂SO₄ to SO₂.' },
   NaI: { eq: ['NaI + H₂SO₄ → NaHSO₄ + HI', '2HI + H₂SO₄ → I₂ + SO₂ + 2H₂O', '6HI + H₂SO₄ → 3I₂ + S + 4H₂O', '8HI + H₂SO₄ → 4I₂ + H₂S + 4H₂O'], obs: 'some steamy fumes, purple vapour / black solid (I₂), yellow solid (S), rotten-egg smell (H₂S)', s: '+6 → +4, 0 and −2', why: 'I⁻ is the strongest reducing agent: it reduces sulfur all the way to −2.' } };
  el.innerHTML = `<div class="row" style="gap:6px">${Object.keys(D).map((k, i) => `<button class="btn ${i ? 'alt' : 'y'}" data-x="${k}">${k}</button>`).join('')}</div><div class="simfb ok" data-o style="margin-top:8px"></div>`;
  const q = s => el.querySelector(s);
  function show(k) { const d = D[k]; el.querySelectorAll('[data-x]').forEach(b => b.className = 'btn ' + (b.dataset.x === k ? 'y' : 'alt'));
    q('[data-o]').innerHTML = `<b>${k} + concentrated H₂SO₄</b><br>${d.eq.map(e => `• ${e}`).join('<br>')}<br><b>Observations:</b> ${d.obs}<br><b>Oxidation number of S:</b> ${d.s}<br>${d.why}` }
  el.querySelectorAll('[data-x]').forEach(b => b.onclick = () => show(b.dataset.x)); show('NaCl');
};

/* ---------------- Chapter 12: pollution cycle explorer ---------------- */
SIMS.pollution = function (el) {
  const ST = [
   ['Engine', 'At the very high temperature in the cylinder: <b>N₂ + O₂ → 2NO</b>. Incomplete combustion also gives <b>CO</b> and <b>unburnt hydrocarbons</b>.'],
   ['Air', 'NO is oxidised: <b>2NO + O₂ → 2NO₂</b> (brown gas).'],
   ['Acid rain (nitric)', '<b>4NO₂ + O₂ + 2H₂O → 4HNO₃</b>.'],
   ['Acid rain (sulfuric)', 'NO₂ catalyses the oxidation of SO₂: <b>SO₂ + NO₂ → SO₃ + NO</b>, then <b>NO + ½O₂ → NO₂</b>. Finally <b>SO₃ + H₂O → H₂SO₄</b>.'],
   ['Photochemical smog', 'In sunlight, NO₂ reacts with unburnt hydrocarbons to form <b>PAN</b> (peroxyacetyl nitrate), an eye and lung irritant.'],
   ['Catalytic converter', 'Pt/Rh/Pd catalyst: <b>2NO + 2CO → N₂ + 2CO₂</b> (NO reduced, CO oxidised); hydrocarbons + O₂ → CO₂ + H₂O.'],
  ];
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px">${ST.map((x, i) => `<button class="btn ${i ? 'alt' : 'y'}" data-st="${i}">${i + 1}. ${x[0]}</button>`).join('')}</div><div class="simfb ok" data-o style="margin-top:8px;font-size:16px"></div>
   <div class="row" style="margin-top:8px"><button class="btn alt" data-nx>Next stage →</button></div>`;
  const q = s => el.querySelector(s); let k = 0;
  function show() { q('[data-o]').innerHTML = ST[k][1]; el.querySelectorAll('[data-st]').forEach(b => b.className = 'btn ' + (+b.dataset.st === k ? 'y' : 'alt')) }
  el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { k = +b.dataset.st; show() }); q('[data-nx]').onclick = () => { k = (k + 1) % ST.length; show() }; show();
};

/* ---------------- Chapter 12: ammonia / ammonium game ---------------- */
const NHQ = [
 ['NH₄Cl(s) + Ca(OH)₂(s), heated', true, 'A base removes H⁺ from NH₄⁺: 2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O.'],
 ['(NH₄)₂SO₄(aq) + dilute HCl, warmed', false, 'An acid cannot take H⁺ from NH₄⁺.'],
 ['NH₄NO₃(aq) + NaOH(aq), warmed', true, 'NH₄⁺ + OH⁻ → NH₃ + H₂O.'],
 ['NH₄Cl(aq) + AgNO₃(aq)', false, 'A white AgCl precipitate forms, but no ammonia: no base present.'],
 ['N₂ + H₂, 450 °C, 200 atm, Fe', true, 'The Haber process.'],
 ['NH₄Cl(aq) + MgO(s), warmed', true, 'MgO is a basic oxide; it removes H⁺ from NH₄⁺ (slowly).'],
 ['(NH₄)₂SO₄(aq) + Na₂SO₄(aq)', false, 'No base: just a mixture of salts.'],
 ['NH₄Cl(s) heated on its own', true, 'NH₄Cl ⇌ NH₃ + HCl: it dissociates, but the gases recombine on cooling.'],
];
SIMS.nh3game = function (el) {
  let order = NHQ.map((_, i) => i).sort(() => Math.random() - .5), k = 0, ok = 0, n = 0;
  el.innerHTML = `<div class="card" style="box-shadow:none"><p class="small muted" style="margin:0">Mixture <b data-k></b> of ${NHQ.length} · score <b data-sc>0</b></p><p data-cl style="font-size:18px;margin:8px 0"></p>
   <div class="row" style="gap:8px"><button class="btn alt" data-v="1">Ammonia released</button><button class="btn alt" data-v="0">No ammonia</button></div><div class="simfb" data-fb></div><div class="row" style="margin-top:8px"><button class="btn y" data-nx>Next</button></div></div>`;
  const q = s => el.querySelector(s), bs = [...el.querySelectorAll('[data-v]')];
  function show() { const it = NHQ[order[k]]; q('[data-k]').textContent = k + 1; q('[data-cl]').textContent = it[0]; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = ''; bs.forEach(b => { b.disabled = false; b.className = 'btn alt' }) }
  bs.forEach(b => b.onclick = () => { const it = NHQ[order[k]], right = (b.dataset.v === '1') === it[1]; n++; if (right) ok++; q('[data-sc]').textContent = `${ok}/${n}`; bs.forEach(x => x.disabled = true); q('[data-fb]').className = 'simfb ' + (right ? 'ok' : 'bad'); q('[data-fb]').innerHTML = `${right ? '✔' : '✘'} ${it[1] ? 'Ammonia is released.' : 'No ammonia.'} ${it[2]}` });
  q('[data-nx]').onclick = () => { k = (k + 1) % NHQ.length; if (!k) order.sort(() => Math.random() - .5); show() }; show();
};

/* ---------------- Chapter 13: isomer explorer ---------------- */
const ISO = {
 'C₅H₁₂': [['pentane', 'CH₃CH₂CH₂CH₂CH₃', ''], ['2-methylbutane', '(CH₃)₂CHCH₂CH₃', ''], ['2,2-dimethylpropane', 'C(CH₃)₄', '']],
 'C₄H₈ (incl. rings)': [['but-1-ene', 'CH₂=CHCH₂CH₃', ''], ['but-2-ene', 'CH₃CH=CHCH₃', 'cis/trans'], ['methylpropene', 'CH₂=C(CH₃)₂', ''], ['cyclobutane', '(CH₂)₄ ring', ''], ['methylcyclopropane', 'CH₃-cyclopropane', '']],
 'C₄H₁₀O': [['butan-1-ol', 'CH₃CH₂CH₂CH₂OH', 'primary alcohol'], ['butan-2-ol', 'CH₃CH(OH)CH₂CH₃', 'secondary alcohol; optical (chiral C2)'], ['2-methylpropan-1-ol', '(CH₃)₂CHCH₂OH', 'primary alcohol'], ['2-methylpropan-2-ol', '(CH₃)₃COH', 'tertiary alcohol'], ['methoxypropane', 'CH₃OCH₂CH₂CH₃', 'ether'], ['2-methoxypropane', 'CH₃OCH(CH₃)₂', 'ether'], ['ethoxyethane', 'CH₃CH₂OCH₂CH₃', 'ether']],
 'C₃H₆Cl₂': [['1,1-dichloropropane', 'CHCl₂CH₂CH₃', ''], ['1,2-dichloropropane', 'CH₂ClCHClCH₃', 'optical (chiral C2)'], ['1,3-dichloropropane', 'CH₂ClCH₂CH₂Cl', ''], ['2,2-dichloropropane', 'CH₃CCl₂CH₃', '']],
 'C₅H₁₀ (alkenes)': [['pent-1-ene', 'CH₂=CHCH₂CH₂CH₃', ''], ['pent-2-ene', 'CH₃CH=CHCH₂CH₃', 'cis/trans'], ['2-methylbut-1-ene', 'CH₂=C(CH₃)CH₂CH₃', ''], ['3-methylbut-1-ene', 'CH₂=CHCH(CH₃)₂', ''], ['2-methylbut-2-ene', '(CH₃)₂C=CHCH₃', '']],
 'C₃H₆O (main isomers)': [['propanal', 'CH₃CH₂CHO', 'aldehyde'], ['propanone', 'CH₃COCH₃', 'ketone'], ['prop-2-en-1-ol', 'CH₂=CHCH₂OH', 'alkene + alcohol'], ['methoxyethene', 'CH₂=CHOCH₃', 'alkene + ether'], ['cyclopropanol', 'ring', ''], ['oxetane, methyloxirane', 'rings (ethers)', 'methyloxirane is chiral']],
};
SIMS.isomers = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px">${Object.keys(ISO).map((k, i) => `<button class="btn ${i ? 'alt' : 'y'}" data-f="${k}">${k}</button>`).join('')}</div><div data-o style="margin-top:10px"></div>`;
  const q = s => el.querySelector(s);
  function show(k) {
    el.querySelectorAll('[data-f]').forEach(b => b.className = 'btn ' + (b.dataset.f === k ? 'y' : 'alt'));
    const L = ISO[k], stereo = L.filter(x => /cis|optical|chiral/.test(x[2])).length;
    q('[data-o]').innerHTML = `<div style="overflow-x:auto"><table class="t"><thead><tr><th>#</th><th>name</th><th>structure</th><th>notes</th></tr></thead><tbody>${L.map((x, i) => `<tr><td>${i + 1}</td><td><b>${x[0]}</b></td><td>${x[1]}</td><td class="small">${x[2]}</td></tr>`).join('')}</tbody></table></div>
     <p class="small muted">${L.length} structural isomers shown. ${stereo ? `${stereo} of them also ${stereo > 1 ? 'have' : 'has'} stereoisomers (each cis/trans pair or chiral centre doubles the count).` : 'None has stereoisomers.'}</p>`;
  }
  el.querySelectorAll('[data-f]').forEach(b => b.onclick = () => show(b.dataset.f)); show(Object.keys(ISO)[0]);
};

/* ---------------- Chapter 13: chiral centre hunter ---------------- */
const CHI = [
 [['CH₃', 'CH(OH)', 'CH₂', 'CH₃'], [1], 'butan-2-ol'],
 [['CH₃', 'CH(OH)', 'CH₃'], [], 'propan-2-ol'],
 [['CH₃', 'CH(NH₂)', 'COOH'], [1], 'alanine'],
 [['HOOC', 'CH₂', 'C(OH)(COOH)', 'CH₂', 'COOH'], [], 'citric acid'],
 [['CH₃', 'CH(OH)', 'CH(NH₂)', 'COOH'], [1, 2], 'threonine'],
 [['CH₃', 'CHBr', 'CHBr', 'CH₂', 'CH₃'], [1, 2], '2,3-dibromopentane'],
 [['(CH₃)₂', 'CH', 'CH₂', 'CH(CH₃)', 'CH₂', 'CH₃'], [3], '2,4-dimethylhexane'],
 [['HOCH₂', 'CH(OH)', 'CH(OH)', 'CHO'], [1, 2], 'an open-chain sugar (erythrose)'],
];
SIMS.chiral = function (el) {
  let k = 0, sel = new Set();
  el.innerHTML = `<p class="small muted" style="margin:0">Molecule <b data-k></b> of ${CHI.length}.</p><p data-nm class="small"></p>
   <div data-row class="row" style="flex-wrap:wrap;gap:4px;align-items:center"></div><div class="row" style="margin-top:10px"><button class="btn y" data-c>Check</button><button class="btn alt" data-nx>Next molecule</button></div><div class="simfb" data-fb></div>`;
  const q = s => el.querySelector(s);
  function show() {
    const [g, , nm] = CHI[k]; sel = new Set(); q('[data-k]').textContent = k + 1; q('[data-nm]').textContent = nm; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = '';
    q('[data-row]').innerHTML = g.map((x, i) => `${i ? '<span>–</span>' : ''}<button class="btn alt" data-g="${i}" style="font-size:18px;padding:8px 12px">${x}</button>`).join('');
    q('[data-row]').querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const i = +b.dataset.g; sel.has(i) ? sel.delete(i) : sel.add(i); b.className = 'btn ' + (sel.has(i) ? 'y' : 'alt') });
  }
  q('[data-c]').onclick = () => {
    const [g, ans] = CHI[k], right = ans.length === sel.size && ans.every(i => sel.has(i));
    q('[data-fb]').className = 'simfb ' + (right ? 'ok' : 'bad');
    q('[data-fb]').innerHTML = (right ? '✔ Correct. ' : '✘ Not quite. ') + (ans.length ? `Chiral: <b>${ans.map(i => g[i]).join(', ')}</b> (four different groups attached).` : 'There is <b>no</b> chiral centre: every carbon has at least two identical groups.');
  };
  q('[data-nx]').onclick = () => { k = (k + 1) % CHI.length; show() }; show();
};

/* ---------------- Chapter 14: alkene reaction explorer ---------------- */
const AK = {
 'ethene, CH₂=CH₂': { H2: 'ethane, CH₃CH₃', H2O: 'ethanol, CH₃CH₂OH', HBr: 'bromoethane, CH₃CH₂Br', Br2: '1,2-dibromoethane, CH₂BrCH₂Br', cold: 'ethane-1,2-diol, HOCH₂CH₂OH', hot: '2CO₂ (+ H₂O)' },
 'propene, CH₃CH=CH₂': { H2: 'propane', H2O: 'propan-2-ol (major), propan-1-ol (minor)', HBr: '2-bromopropane (major), 1-bromopropane (minor)', Br2: '1,2-dibromopropane', cold: 'propane-1,2-diol', hot: 'ethanoic acid + CO₂' },
 'but-2-ene, CH₃CH=CHCH₃': { H2: 'butane', H2O: 'butan-2-ol', HBr: '2-bromobutane (chiral: racemic mixture)', Br2: '2,3-dibromobutane', cold: 'butane-2,3-diol', hot: '2 CH₃COOH (ethanoic acid)' },
 'methylpropene, (CH₃)₂C=CH₂': { H2: '2-methylpropane', H2O: '2-methylpropan-2-ol (major)', HBr: '2-bromo-2-methylpropane (major, via tertiary carbocation)', Br2: '1,2-dibromo-2-methylpropane', cold: '2-methylpropane-1,2-diol', hot: 'propanone + CO₂' },
 'cyclohexene': { H2: 'cyclohexane', H2O: 'cyclohexanol', HBr: 'bromocyclohexane', Br2: '1,2-dibromocyclohexane', cold: 'cyclohexane-1,2-diol', hot: 'hexanedioic acid, HOOC(CH₂)₄COOH' },
};
const AKR = { H2: ['H₂, Ni catalyst, about 150 °C', 'addition (hydrogenation)'], H2O: ['steam, H₃PO₄ catalyst, 300 °C, 6 MPa', 'electrophilic addition (hydration)'], HBr: ['HBr(g), room temperature', 'electrophilic addition'], Br2: ['Br₂ in an organic solvent (or bromine water: orange → colourless)', 'electrophilic addition'], cold: ['cold, dilute, acidified KMnO₄ (purple → colourless)', 'oxidation (addition of two OH)'], hot: ['hot, concentrated, acidified KMnO₄', 'oxidation: C=C broken'] };
SIMS.alkenerx = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-a style="flex:1;min-width:200px">${Object.keys(AK).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-r style="flex:1;min-width:200px">${Object.keys(AKR).map(k => `<option value="${k}">${AKR[k][0].split(',')[0].replace('(g)', '')}${k === 'cold' ? ' (cold, dilute)' : k === 'hot' ? ' (hot, conc.)' : ''}</option>`).join('')}</select></div><div class="simfb ok" data-o style="margin-top:8px;font-size:16px"></div>`;
  const q = s => el.querySelector(s);
  function go() { const a = q('[data-a]').value, r = q('[data-r]').value; q('[data-o]').innerHTML = `<b>${a}</b> + ${AKR[r][0]}<br>→ <b>${AK[a][r]}</b><br><span class="small">Type: ${AKR[r][1]}.${/major/.test(AK[a][r]) ? ' The major product comes from the more stable carbocation (H adds to the carbon that already has more H).' : ''}</span>` }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};

/* ---------------- Chapter 14: radical step sorter ---------------- */
const RS = [['Cl₂ → 2Cl•', 0], ['CH₄ + Cl• → CH₃• + HCl', 1], ['CH₃• + Cl₂ → CH₃Cl + Cl•', 1], ['CH₃• + Cl• → CH₃Cl', 2], ['2CH₃• → C₂H₆', 2], ['2Cl• → Cl₂', 2], ['CH₃Cl + Cl• → CH₂Cl• + HCl', 1], ['Br₂ → 2Br•', 0], ['C₂H₆ + Br• → C₂H₅• + HBr', 1], ['2C₂H₅• → C₄H₁₀', 2]];
SIMS.radical = function (el) {
  const NM = ['initiation', 'propagation', 'termination'];
  let order = RS.map((_, i) => i).sort(() => Math.random() - .5), k = 0, ok = 0, n = 0;
  el.innerHTML = `<p class="small muted" style="margin:0">Step <b data-k></b> of ${RS.length} · score <b data-sc>0</b></p><p data-st style="font-size:20px;margin:10px 0"></p>
   <div class="row" style="gap:6px;flex-wrap:wrap">${NM.map((x, i) => `<button class="btn alt" data-p="${i}">${x}</button>`).join('')}</div><div class="simfb" data-fb></div><div class="row" style="margin-top:8px"><button class="btn y" data-nx>Next step</button></div>`;
  const q = s => el.querySelector(s), bs = [...el.querySelectorAll('[data-p]')];
  function show() { q('[data-k]').textContent = k + 1; q('[data-st]').textContent = RS[order[k]][0]; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = ''; bs.forEach(b => { b.disabled = false; b.className = 'btn alt' }) }
  bs.forEach(b => b.onclick = () => { const a = RS[order[k]][1], right = +b.dataset.p === a; n++; if (right) ok++; q('[data-sc]').textContent = `${ok}/${n}`; bs.forEach(x => x.disabled = true); bs[a].className = 'btn y';
    q('[data-fb]').className = 'simfb ' + (right ? 'ok' : 'bad'); q('[data-fb]').innerHTML = `${right ? '✔' : '✘'} ${NM[a]}: ${['a molecule splits into two radicals (UV light)', 'one radical in, one radical out: the chain continues', 'two radicals join, so radicals are used up'][a]}.` });
  q('[data-nx]').onclick = () => { k = (k + 1) % RS.length; if (!k) order.sort(() => Math.random() - .5); show() }; show();
};
/* ---------------- Chapter 15: halogenoalkane reaction explorer ---------------- */
const HX = {
  'bromoethane, CH₃CH₂Br': ['primary', 'ethanol, CH₃CH₂OH', 'propanenitrile, CH₃CH₂CN', 'ethylamine, CH₃CH₂NH₂', 'ethene, CH₂=CH₂', 'Br'],
  '1-bromopropane, CH₃CH₂CH₂Br': ['primary', 'propan-1-ol', 'butanenitrile, CH₃CH₂CH₂CN', 'propylamine, CH₃CH₂CH₂NH₂', 'propene', 'Br'],
  '2-bromopropane, CH₃CHBrCH₃': ['secondary', 'propan-2-ol', '2-methylpropanenitrile, (CH₃)₂CHCN', 'propan-2-amine, (CH₃)₂CHNH₂', 'propene', 'Br'],
  '2-bromobutane, CH₃CHBrCH₂CH₃': ['secondary', 'butan-2-ol', '2-methylbutanenitrile', 'butan-2-amine', 'but-1-ene + E- and Z-but-2-ene (3 alkenes)', 'Br'],
  '1-chlorobutane, CH₃(CH₂)₃Cl': ['primary', 'butan-1-ol', 'pentanenitrile, CH₃(CH₂)₃CN', 'butylamine, CH₃(CH₂)₃NH₂', 'but-1-ene', 'Cl'],
  '1-iodobutane, CH₃(CH₂)₃I': ['primary', 'butan-1-ol', 'pentanenitrile, CH₃(CH₂)₃CN', 'butylamine, CH₃(CH₂)₃NH₂', 'but-1-ene', 'I'],
  '2-bromo-2-methylpropane, (CH₃)₃CBr': ['tertiary', '2-methylpropan-2-ol, (CH₃)₃COH', '2,2-dimethylpropanenitrile, (CH₃)₃CCN', '2-methylpropan-2-amine', 'methylpropene, (CH₃)₂C=CH₂', 'Br'],
};
const HXR = {
  oh: ['NaOH(aq), warm under reflux', 1], cn: ['KCN in ethanol, heat under reflux', 2], nh3: ['excess NH₃ in ethanol, heated in a sealed tube', 3],
  el: ['NaOH in ethanol, hot, under reflux', 4], ag: ['AgNO₃ in aqueous ethanol, warm', 5],
};
SIMS.halorx = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-h style="flex:1;min-width:200px">${Object.keys(HX).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-g style="flex:1;min-width:200px">${Object.keys(HXR).map(k => `<option value="${k}">${HXR[k][0]}</option>`).join('')}</select></div><div class="simfb ok" data-o style="margin-top:8px;font-size:16px"></div>`;
  const q = s => el.querySelector(s);
  const MECH = { primary: 'SN2: one step; the nucleophile attacks the δ+ C as the C–X bond breaks (transition state, no intermediate).', secondary: 'a mixture of SN1 and SN2.', tertiary: 'SN1: the C–X bond breaks first (slow step) to give a tertiary carbocation, which the nucleophile then attacks (fast).' };
  const PPT = { Cl: 'white AgCl, forms slowly', Br: 'cream AgBr', I: 'yellow AgI, forms fastest' };
  function go() {
    const h = q('[data-h]').value, g = q('[data-g]').value, d = HX[h], r = HXR[g]; let out, why;
    if (g === 'el') { out = d[4]; why = 'Type: <b>elimination</b>. In ethanol, OH⁻ acts as a base and removes H⁺ from a carbon next to C–X, while X⁻ leaves; HX is lost and a C=C forms.' }
    else if (g === 'ag') { out = d[1] + ' and a ' + PPT[d[5]] + ' precipitate'; why = 'Type: <b>nucleophilic substitution (hydrolysis)</b> by water; the X⁻ released meets Ag⁺. Rate: C–I &gt; C–Br &gt; C–Cl because the C–I bond is weakest. Mechanism here: ' + MECH[d[0]] }
    else { out = d[r[1]]; why = 'Type: <b>nucleophilic substitution</b> (' + d[0] + ' halogenoalkane), mechanism ' + MECH[d[0]] + (g === 'cn' ? ' The chain is one carbon longer.' : g === 'nh3' ? ' Excess NH₃ reduces further substitution of the amine.' : '') }
    q('[data-o]').innerHTML = `<b>${h}</b> + ${r[0]}<br>→ <b>${out}</b><br><span class="small">${why}</span>`;
  }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};

/* ---------------- Chapter 15: silver nitrate hydrolysis race ---------------- */
const AGC = { '1-chlorobutane': ['Cl', 1], '1-bromobutane': ['Br', 1], '1-iodobutane': ['I', 1], '2-chloro-2-methylpropane': ['Cl', 25], '2-bromo-2-methylpropane': ['Br', 25], '2-iodo-2-methylpropane': ['I', 25] };
SIMS.agrace = function (el) {
  const HF = { Cl: 1, Br: 8, I: 40 }, COL = { Cl: '#f4f6f8', Br: '#f2e6b8', I: '#f3d23c' }, NAME = { Cl: 'white AgCl', Br: 'cream AgBr', I: 'yellow AgI' };
  const dflt = ['1-chlorobutane', '1-bromobutane', '1-iodobutane'], ks = Object.keys(AGC);
  el.innerHTML = `<p class="small muted" style="margin:0 0 6px">Pick three halogenoalkanes, then start. Each tube holds warm AgNO₃ in aqueous ethanol. Times are illustrative; the order is what matters.</p>
   <div class="row" style="flex-wrap:wrap;gap:6px">${[0, 1, 2].map(i => `<select class="sel" data-t="${i}" style="flex:1;min-width:150px">${ks.map(k => `<option${k === dflt[i] ? ' selected' : ''}>${k}</option>`).join('')}</select>`).join('')}</div>
   <svg viewBox="0 0 300 150" style="width:100%;max-width:420px;display:block;margin:8px auto">${[0, 1, 2].map(i => `<g transform="translate(${30 + i * 95},10)"><path d="M0 0 V100 a20 20 0 0 0 40 0 V0" fill="none" stroke="currentColor" stroke-width="2"/><path data-f="${i}" d="M2 30 V100 a18 18 0 0 0 36 0 V30 Z" fill="#dff1fb" /><text x="20" y="138" text-anchor="middle" font-size="11" data-l="${i}" fill="currentColor"></text></g>`).join('')}</svg>
   <div class="row" style="gap:6px"><button class="btn y" data-go>Start</button><span class="small muted">time <b data-clk>0</b> s</span></div><div class="simfb" data-fb></div>`;
  const q = s => el.querySelector(s); let timer = null;
  function setup() { for (let i = 0; i < 3; i++) { q(`[data-f="${i}"]`).setAttribute('fill', '#dff1fb'); q(`[data-l="${i}"]`).textContent = '' } q('[data-clk]').textContent = 0; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = '' }
  function mix(a, b, f) { const p = x => [1, 3, 5].map(j => parseInt(x.substr(j, 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, j) => Math.round(v + (B[j] - v) * f)).join(',') + ')' }
  el.querySelectorAll('select').forEach(s => s.onchange = () => { clearInterval(timer); setup() });
  q('[data-go]').onclick = () => {
    clearInterval(timer); setup();
    const sel = [0, 1, 2].map(i => q(`[data-t="${i}"]`).value), T = sel.map(k => 1200 / (HF[AGC[k][0]] * AGC[k][1]));
    let t = 0; const step = Math.max(...T) / 120;
    timer = setInterval(() => {
      t += step; q('[data-clk]').textContent = Math.round(t);
      sel.forEach((k, i) => { const f = Math.min(1, t / T[i]); q(`[data-f="${i}"]`).setAttribute('fill', mix('#dff1fb', COL[AGC[k][0]], f)); if (f >= 1) q(`[data-l="${i}"]`).textContent = '✔ ' + Math.round(T[i]) + ' s' });
      if (t >= Math.max(...T)) {
        clearInterval(timer); const ord = sel.map((k, i) => [k, T[i]]).sort((a, b) => a[1] - b[1]);
        q('[data-fb]').className = 'simfb ok';
        q('[data-fb]').innerHTML = 'Order: ' + ord.map(x => `<b>${x[0]}</b> (${NAME[AGC[x[0]][0]]})`).join(' → ') + '.<br><span class="small">Weaker C–X bond (C–I &lt; C–Br &lt; C–Cl) → faster. Tertiary compounds also react faster here because they form a stable carbocation (SN1).</span>';
      }
    }, 100);
  };
  setup();
};
/* ---------------- Chapter 16: alcohol test bench + mystery alcohol ---------------- */
// [formula, class, iodoform?, distil product, reflux product, dehydration products, halogenation product with PCl5]
const ALC = {
  'methanol': ['CH₃OH', 'primary', 0, 'methanal, HCHO', 'methanoic acid, HCOOH (further oxidised to CO₂)', 'none (only one carbon)', 'CH₃Cl'],
  'ethanol': ['CH₃CH₂OH', 'primary', 1, 'ethanal, CH₃CHO', 'ethanoic acid, CH₃COOH', 'ethene', 'CH₃CH₂Cl'],
  'propan-1-ol': ['CH₃CH₂CH₂OH', 'primary', 0, 'propanal, CH₃CH₂CHO', 'propanoic acid, CH₃CH₂COOH', 'propene', 'CH₃CH₂CH₂Cl'],
  'propan-2-ol': ['CH₃CH(OH)CH₃', 'secondary', 1, 'propanone, CH₃COCH₃', 'propanone, CH₃COCH₃', 'propene', 'CH₃CHClCH₃'],
  'butan-1-ol': ['CH₃CH₂CH₂CH₂OH', 'primary', 0, 'butanal', 'butanoic acid', 'but-1-ene', '1-chlorobutane'],
  'butan-2-ol': ['CH₃CH(OH)CH₂CH₃', 'secondary', 1, 'butanone', 'butanone', 'but-1-ene, (E)- and (Z)-but-2-ene', '2-chlorobutane'],
  '2-methylpropan-2-ol': ['(CH₃)₃COH', 'tertiary', 0, '—', '—', 'methylpropene', '2-chloro-2-methylpropane'],
  'pentan-3-ol': ['CH₃CH₂CH(OH)CH₂CH₃', 'secondary', 0, 'pentan-3-one', 'pentan-3-one', '(E)- and (Z)-pent-2-ene', '3-chloropentane'],
};
const ALT = {
  na: ['add sodium', a => ['fizzing (H₂); the alkoxide forms', '2ROH + 2Na → 2RO⁻Na⁺ + H₂', '#dff1fb']],
  pcl: ['add PCl₅', a => ['steamy fumes of HCl', 'product: ' + ALC[a][6] + ' (+ POCl₃ + HCl)', '#dff1fb']],
  cr: ['warm with acidified K₂Cr₂O₇, distil', a => ALC[a][1] === 'tertiary' ? ['stays orange: no reaction', 'tertiary: no H on the C–OH carbon', '#f39a2b'] : ['orange → green', 'distillate: ' + ALC[a][3], '#5fae5a']],
  rf: ['heat under reflux with excess acidified K₂Cr₂O₇', a => ALC[a][1] === 'tertiary' ? ['stays orange: no reaction', 'tertiary alcohols are not oxidised', '#f39a2b'] : ['orange → green', 'product: ' + ALC[a][4], '#5fae5a']],
  io: ['warm with alkaline I₂(aq)', a => ALC[a][2] ? ['pale yellow precipitate (CHI₃), antiseptic smell', 'contains CH₃CH(OH)– (oxidised to CH₃CO–)', '#f3d23c'] : ['no precipitate', 'no CH₃CH(OH)– group', '#e9e0b8']],
  dh: ['heat with conc. H₃PO₄ (or pass over hot Al₂O₃)', a => [ALC[a][5] === 'none (only one carbon)' ? 'no alkene can form' : 'an alkene is given off', 'dehydration: ' + ALC[a][5], '#dff1fb']],
};
function alcTube(col) { return `<svg viewBox="0 0 60 120" style="width:54px;flex:none"><path d="M10 4 V96 a20 20 0 0 0 40 0 V4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 40 V96 a18 18 0 0 0 36 0 V40 Z" fill="${col}"/></svg>` }
SIMS.alctest = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-a style="flex:1;min-width:180px">${Object.keys(ALC).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-g style="flex:1;min-width:220px">${Object.keys(ALT).map(k => `<option value="${k}">${ALT[k][0]}</option>`).join('')}</select></div>
   <div class="row" style="gap:10px;align-items:center;margin-top:8px"><span data-tb></span><div class="simfb ok" data-o style="flex:1;margin:0"></div></div>`;
  const q = s => el.querySelector(s);
  function go() { const a = q('[data-a]').value, g = q('[data-g]').value, r = ALT[g][1](a); q('[data-tb]').innerHTML = alcTube(r[2]);
    q('[data-o]').innerHTML = `<b>${a}</b>, ${ALC[a][0]} (${ALC[a][1]})<br>${ALT[g][0]}: <b>${r[0]}</b><br><span class="small">${r[1]}</span>` }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};
SIMS.alcmystery = function (el) {
  const ks = Object.keys(ALC); let ans, opts, used, score = 0, n = 0;
  el.innerHTML = `<p class="small muted" style="margin:0">Identify the unknown alcohol using as few tests as you can. Score <b data-sc>0/0</b></p>
   <div class="row" style="flex-wrap:wrap;gap:6px;margin:8px 0">${['cr', 'rf', 'io', 'dh'].map(k => `<button class="btn alt" data-t="${k}">${ALT[k][0]}</button>`).join('')}</div>
   <div data-log class="small" style="min-height:24px"></div><p style="margin:8px 0 4px"><b>Which alcohol is it?</b></p><div class="row" style="flex-wrap:wrap;gap:6px" data-ch></div><div class="simfb" data-fb></div>
   <div class="row" style="margin-top:8px"><button class="btn y" data-nx>New unknown</button></div>`;
  const q = s => el.querySelector(s);
  function nw() { ans = ks[Math.floor(Math.random() * ks.length)]; opts = [ans]; while (opts.length < 4) { const k = ks[Math.floor(Math.random() * ks.length)]; if (!opts.includes(k)) opts.push(k) } opts.sort(() => Math.random() - .5); used = 0;
    q('[data-log]').innerHTML = ''; q('[data-fb]').className = 'simfb'; q('[data-fb]').innerHTML = '';
    q('[data-ch]').innerHTML = opts.map(o => `<button class="btn alt" data-c="${o}">${o}</button>`).join(''); el.querySelectorAll('[data-c]').forEach(b => b.onclick = () => pick(b));
    el.querySelectorAll('[data-t]').forEach(b => b.disabled = false) }
  el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const r = ALT[b.dataset.t][1](ans); used++; b.disabled = true; q('[data-log]').innerHTML += `<div>• ${ALT[b.dataset.t][0]}: <b>${r[0]}</b></div>` });
  function pick(b) { const ok = b.dataset.c === ans; n++; if (ok) score++; q('[data-sc]').textContent = `${score}/${n}`; el.querySelectorAll('[data-c]').forEach(x => { x.disabled = true; if (x.dataset.c === ans) x.className = 'btn y' });
    q('[data-fb]').className = 'simfb ' + (ok ? 'ok' : 'bad'); q('[data-fb]').innerHTML = `${ok ? '✔' : '✘'} It was <b>${ans}</b>, ${ALC[ans][0]}: ${ALC[ans][1]}${ALC[ans][2] ? ', with a CH₃CH(OH)– group' : ''}. You used ${used} test${used === 1 ? '' : 's'}.` }
  q('[data-nx]').onclick = nw; nw();
};
/* ---------------- Chapter 17: carbonyl test lab ---------------- */
// [formula, aldehyde?, ketone?, CH3CO/CH3CH(OH)?, oxidisable by dichromate?, NaBH4 product, HCN product]
const CB = {
  'methanal': ['HCHO', 1, 0, 0, 1, 'methanol', 'hydroxyethanenitrile, HOCH₂CN'],
  'ethanal': ['CH₃CHO', 1, 0, 1, 1, 'ethanol', '2-hydroxypropanenitrile, CH₃CH(OH)CN (chiral)'],
  'propanal': ['CH₃CH₂CHO', 1, 0, 0, 1, 'propan-1-ol', '2-hydroxybutanenitrile (chiral)'],
  'propanone': ['CH₃COCH₃', 0, 1, 1, 0, 'propan-2-ol', '2-hydroxy-2-methylpropanenitrile, (CH₃)₂C(OH)CN (not chiral)'],
  'butanone': ['CH₃COCH₂CH₃', 0, 1, 1, 0, 'butan-2-ol', '2-hydroxy-2-methylbutanenitrile (chiral)'],
  'pentan-3-one': ['CH₃CH₂COCH₂CH₃', 0, 1, 0, 0, 'pentan-3-ol', '2-ethyl-2-hydroxybutanenitrile (not chiral)'],
  'propan-2-ol': ['CH₃CH(OH)CH₃', 0, 0, 1, 1, 'no reaction', 'no reaction'],
};
const CBT = {
  dnph: ['2,4-DNPH reagent', c => CB[c][1] || CB[c][2] ? ['orange precipitate', 'C=O present (aldehyde or ketone)', '#f08a24'] : ['no change', 'no C=O group', '#f3e3a0']],
  tol: ['Tollens’ reagent, warm', c => CB[c][1] ? ['silver mirror', 'aldehyde oxidised to RCOO⁻; Ag⁺ reduced to Ag', '#b9bec4'] : ['no change', 'not an aldehyde', '#eef2f5']],
  feh: ['Fehling’s solution, warm', c => CB[c][1] ? ['blue → red-brown precipitate', 'aldehyde oxidised; Cu²⁺ reduced to Cu₂O', '#b5462a'] : ['stays blue', 'not an aldehyde', '#3a7bd5']],
  io: ['alkaline I₂(aq), warm', c => CB[c][3] ? ['pale yellow precipitate (CHI₃)', 'contains CH₃CO– or CH₃CH(OH)–', '#f3d23c'] : ['no precipitate', 'no CH₃CO– / CH₃CH(OH)– group', '#e9e0b8']],
  cr: ['acidified K₂Cr₂O₇, warm', c => CB[c][4] ? ['orange → green', c === 'propan-2-ol' ? 'secondary alcohol → propanone' : 'aldehyde → carboxylic acid', '#5fae5a'] : ['stays orange', 'ketones are not oxidised', '#f39a2b']],
  nab: ['NaBH₄', c => [CB[c][5] === 'no reaction' ? 'no reaction' : 'reduced', CB[c][5] === 'no reaction' ? 'nothing to reduce' : 'product: ' + CB[c][5], '#dff1fb']],
  hcn: ['HCN with a little KCN', c => [CB[c][6] === 'no reaction' ? 'no reaction' : 'nucleophilic addition', CB[c][6] === 'no reaction' ? 'no C=O group' : 'product: ' + CB[c][6], '#dff1fb']],
};
SIMS.carbtest = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-a style="flex:1;min-width:160px">${Object.keys(CB).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-g style="flex:1;min-width:200px">${Object.keys(CBT).map(k => `<option value="${k}">${CBT[k][0]}</option>`).join('')}</select></div>
   <div class="row" style="gap:10px;align-items:center;margin-top:8px"><span data-tb></span><div class="simfb ok" data-o style="flex:1;margin:0"></div></div>
   <div style="overflow-x:auto;margin-top:8px"><table class="t small" data-tab></table></div>`;
  const q = s => el.querySelector(s);
  function go() { const a = q('[data-a]').value, g = q('[data-g]').value, r = CBT[g][1](a); q('[data-tb]').innerHTML = alcTube(r[2]);
    q('[data-o]').innerHTML = `<b>${a}</b>, ${CB[a][0]}<br>${CBT[g][0]}: <b>${r[0]}</b><br><span class="small">${r[1]}</span>`;
    q('[data-tab]').innerHTML = `<tr><th>${a}</th>${['2,4-DNPH', 'Tollens’', 'Fehling’s', 'alkaline I₂', 'K₂Cr₂O₇/H⁺'].map(k => `<th>${k}</th>`).join('')}</tr><tr><td>result</td>${['dnph', 'tol', 'feh', 'io', 'cr'].map(k => `<td>${CBT[k][1](a)[0]}</td>`).join('')}</tr>` }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};

/* ---------------- Chapter 17: nucleophilic addition stepper ---------------- */
const NAD = { 'ethanal': ['CH₃', 'H', '2-hydroxypropanenitrile', 1], 'propanone': ['CH₃', 'CH₃', '2-hydroxy-2-methylpropanenitrile', 0], 'propanal': ['C₂H₅', 'H', '2-hydroxybutanenitrile', 1], 'butanone': ['C₂H₅', 'CH₃', '2-hydroxy-2-methylbutanenitrile', 1] };
SIMS.nucadd = function (el) {
  let st = 0;
  el.innerHTML = `<div class="row" style="gap:6px;flex-wrap:wrap"><select class="sel" data-a style="flex:1;min-width:160px">${Object.keys(NAD).map(k => `<option>${k}</option>`).join('')}</select>
   <button class="btn alt" data-b>◀ Back</button><button class="btn y" data-n>Next step ▶</button></div>
   <div style="overflow-x:auto"><svg viewBox="0 0 420 170" style="width:100%;min-width:320px;max-width:520px;display:block;margin:6px auto" data-s></svg></div><div class="simfb ok" data-o></div>`;
  const q = s => el.querySelector(s);
  const T = (x, y, t, o = '') => `<text x="${x}" y="${y}" font-size="15" text-anchor="middle" fill="currentColor" ${o}>${t}</text>`;
  const AR = (d, c = '#e0457b') => `<path d="${d}" fill="none" stroke="${c}" stroke-width="2" marker-end="url(#ah)"/>`;
  function draw() {
    const [R1, R2, name, chiral] = NAD[q('[data-a]').value]; let s = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#e0457b"/></marker></defs>`, msg;
    const carb = (cx, oTxt, dbl, extra) => T(cx - 50, 60, R1) + T(cx - 50, 135, R2) + `<line x1="${cx - 38}" y1="68" x2="${cx - 8}" y2="88" stroke="currentColor"/><line x1="${cx - 38}" y1="122" x2="${cx - 8}" y2="102" stroke="currentColor"/>` + T(cx, 100, 'C') +
      (dbl ? `<line x1="${cx + 10}" y1="92" x2="${cx + 58}" y2="92" stroke="currentColor"/><line x1="${cx + 10}" y1="99" x2="${cx + 58}" y2="99" stroke="currentColor"/>` : `<line x1="${cx + 10}" y1="95" x2="${cx + 58}" y2="95" stroke="currentColor"/>`) + T(cx + 70, 100, oTxt) + (extra || '');
    if (st === 0) { s += carb(150, 'O', 1, T(150, 82, 'δ+', 'font-size="11"') + T(220, 82, 'δ−', 'font-size="11"')) + T(330, 100, ':C≡N⁻'); msg = 'The C=O bond is polar: oxygen is more electronegative, so the carbonyl carbon is δ+. The cyanide ion (from KCN) has a lone pair on carbon.' }
    if (st === 1) { s += carb(150, 'O', 1) + T(330, 100, ':C≡N⁻') + AR('M310 108 Q240 150 160 112') + AR('M190 88 Q205 60 218 84'); msg = 'Step 1: the lone pair on the C of CN⁻ attacks the δ+ carbon. At the same time the π bond pair of C=O moves onto oxygen.' }
    if (st === 2) { s += carb(150, 'O⁻', 0, `<line x1="150" y1="108" x2="150" y2="140" stroke="currentColor"/>` + T(150, 158, 'CN')) + T(330, 100, 'H–CN') + AR('M226 108 Q270 140 318 106'); msg = 'Intermediate: an alkoxide anion. Its O⁻ uses a lone pair to take H⁺ from HCN (curly arrow from the O lone pair to H, and from the H–C bond onto CN).' }
    if (st === 3) { s += carb(150, 'OH', 0, `<line x1="150" y1="108" x2="150" y2="140" stroke="currentColor"/>` + T(150, 158, 'CN')) + T(330, 100, '+ CN⁻'); msg = `Product: <b>${name}</b>. CN⁻ is regenerated, so it acts as a catalyst. ${chiral ? 'The product has a chiral carbon; CN⁻ attacks the planar C=O from either side equally, so a racemic mixture forms.' : 'The product has two identical groups on the central carbon, so it is not chiral.'}` }
    q('[data-s]').innerHTML = s; q('[data-o]').innerHTML = `<b>Stage ${st + 1} of 4.</b> ${msg}`;
  }
  q('[data-n]').onclick = () => { st = Math.min(3, st + 1); draw() }; q('[data-b]').onclick = () => { st = Math.max(0, st - 1); draw() }; q('[data-a]').onchange = () => { st = 0; draw() }; draw();
};
/* ---------------- Chapter 18: ester builder / hydrolyser ---------------- */
const EAC = { methanoic: ['H', 'methan', 'HCOOH'], ethanoic: ['CH₃', 'ethan', 'CH₃COOH'], propanoic: ['CH₃CH₂', 'propan', 'CH₃CH₂COOH'], butanoic: ['CH₃CH₂CH₂', 'butan', 'CH₃CH₂CH₂COOH'] };
const EAL = { methanol: ['CH₃', 'methyl'], ethanol: ['CH₂CH₃', 'ethyl'], 'propan-1-ol': ['CH₂CH₂CH₃', 'propyl'], 'propan-2-ol': ['CH(CH₃)₂', '1-methylethyl (propan-2-yl)'], 'butan-1-ol': ['CH₂CH₂CH₂CH₃', 'butyl'] };
SIMS.esterbuild = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-c style="flex:1;min-width:140px">${Object.keys(EAC).map(k => `<option value="${k}">${k} acid</option>`).join('')}</select>
   <select class="sel" data-l style="flex:1;min-width:140px">${Object.keys(EAL).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-m style="flex:1;min-width:160px"><option value="make">make the ester</option><option value="acid">hydrolyse: dilute acid</option><option value="alk">hydrolyse: NaOH(aq)</option></select></div>
   <div class="simfb ok" data-o style="margin-top:8px;font-size:16px"></div>`;
  const q = s => el.querySelector(s);
  function go() { const c = EAC[q('[data-c]').value], l = EAL[q('[data-l]').value], m = q('[data-m]').value, al = q('[data-l]').value;
    const est = `${c[0]}COO${l[0]}`, nm = `${l[1]} ${c[1]}oate`, alc = `HO${l[0]}`.replace('HOCH(CH₃)₂', '(CH₃)₂CHOH');
    let h;
    if (m === 'make') h = `${c[2]} + ${alc} ⇌ <b>${est}</b> + H₂O<br>Name: <b>${nm}</b><br><span class="small">Heat with a few drops of concentrated H₂SO₄ (catalyst). Condensation: the OH from the acid and the H from the alcohol leave as water. Alcohol part named first, acid part (…oate) second.</span>`;
    else if (m === 'acid') h = `${est} + H₂O ⇌ <b>${c[2]}</b> + <b>${alc}</b><br><span class="small">Heat under reflux with dilute H₂SO₄ or HCl. Reversible: an equilibrium mixture forms, so conversion is incomplete.</span>`;
    else h = `${est} + NaOH → <b>${c[0]}COO⁻Na⁺</b> + <b>${alc}</b><br><span class="small">Heat under reflux with NaOH(aq). Goes to completion because the carboxylate ion cannot react with the alcohol. Add acid afterwards to obtain ${c[2]}.</span>`;
    q('[data-o]').innerHTML = `<b>${nm}</b> (${est})<br>` + h }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};

/* ---------------- Chapter 18: gas from acids (mole bookkeeping) ---------------- */
// name: [formula, number of COOH, number of alcohol OH]
const GAC = { 'ethanoic acid': ['CH₃COOH', 1, 0], 'propanedioic acid': ['HOOCCH₂COOH', 2, 0], 'hydroxyethanoic acid': ['HOCH₂COOH', 1, 1], '2-hydroxypropanoic acid (lactic)': ['CH₃CH(OH)COOH', 1, 1], 'malic acid': ['HOOCCH(OH)CH₂COOH', 2, 1], 'ethane-1,2-diol': ['HOCH₂CH₂OH', 0, 2] };
const GRE = { na: ['Na', 'H₂'], mg: ['Mg', 'H₂'], carb: ['Na₂CO₃', 'CO₂'], hc: ['NaHCO₃', 'CO₂'], oh: ['NaOH', 'none'] };
SIMS.acidgas = function (el) {
  el.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:6px"><select class="sel" data-c style="flex:1;min-width:180px">${Object.keys(GAC).map(k => `<option>${k}</option>`).join('')}</select>
   <select class="sel" data-r style="flex:1;min-width:120px">${Object.keys(GRE).map(k => `<option value="${k}">excess ${GRE[k][0]}</option>`).join('')}</select></div>
   <div class="row" style="gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap"><svg viewBox="0 0 220 60" style="width:220px;max-width:100%;flex:none"><rect x="10" y="20" width="180" height="22" rx="3" fill="none" stroke="currentColor"/><rect data-g x="11" y="21" width="0" height="20" fill="#7cc4ef"/><rect data-p x="11" y="16" width="4" height="30" fill="currentColor"/><text x="196" y="36" font-size="11" fill="currentColor">dm³</text></svg>
   <div class="simfb ok" data-o style="flex:1;min-width:220px;margin:0"></div></div><p class="small muted" style="margin:6px 0 0">1.00 mol of compound; gas volume at room conditions (24.0 dm³ mol⁻¹). The syringe is full at 36 dm³.</p>`;
  const q = s => el.querySelector(s);
  function go() { const c = GAC[q('[data-c]').value], r = q('[data-r]').value, [co, oh] = [c[1], c[2]]; let gas = 0, used = 0, why;
    if (r === 'na') { gas = (co + oh) / 2; used = co + oh; why = 'Na reacts with every O–H (COOH and alcohol OH): ½ H₂ per O–H.' }
    if (r === 'mg') { gas = co / 2; used = co / 2; why = 'Mg reacts with acidic COOH groups only: 2RCOOH + Mg → (RCOO)₂Mg + H₂.' }
    if (r === 'carb') { gas = co / 2; used = co / 2; why = 'Na₂CO₃ reacts with COOH only: 2RCOOH + Na₂CO₃ → 2RCOONa + H₂O + CO₂.' }
    if (r === 'hc') { gas = co; used = co; why = 'NaHCO₃ reacts with COOH only: RCOOH + NaHCO₃ → RCOONa + H₂O + CO₂ (1 CO₂ per COOH).' }
    if (r === 'oh') { gas = 0; used = co; why = 'NaOH neutralises COOH groups; alcohol OH groups are too weakly acidic. No gas.' }
    const v = gas * 24.0, w = Math.min(178, v / 36 * 178); q('[data-g]').setAttribute('width', w); q('[data-p]').setAttribute('x', 11 + w);
    q('[data-o]').innerHTML = `<b>${c[0]}</b>: ${co} COOH, ${oh} alcohol OH<br>mol ${GRE[r][0]} used: <b>${used}</b> · gas: <b>${gas ? gas + ' mol ' + GRE[r][1] + ' = ' + v.toFixed(1) + ' dm³' : 'none'}</b><br><span class="small">${why}</span>` }
  el.querySelectorAll('select').forEach(x => x.onchange = go); go();
};
})();

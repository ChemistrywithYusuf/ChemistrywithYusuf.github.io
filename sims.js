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

// Decorative ASCII forest framing a central "clearing" (the content column).
// - two-tone depth: far trees on a dim back layer, near trees on a brighter front layer
// - side treelines recede from the clearing edge out toward the (shaded) screen edge
// - canopy clusters peek into the top corners so the forest wraps overhead too
// Pairs with the ".gutter" / ".canopy" / ".forest-shade" / ".clearing-glow" blocks in style.css.
// Safe to remove: delete this file and its <script> tag in index.html.
(function () {
  const wide = window.matchMedia('(min-width: 900px)');

  const SMALL = [' /\\', '/__\\'];
  const MED   = ['  /\\', ' /  \\', '/____\\', '  ||'];
  const BIG   = ['   /\\', '  /  \\', ' /    \\', '/------\\', '   ||'];

  const CHAR_W = 7.2, LINE_H = 12 * 1.4;   // approx cell size for 12px mono
  const CLEARING = 36;                      // px of open space kept next to the content
  const CANOPY_COLS = 22, CANOPY_ROWS = 9;

  const newGrid = (cols, rows) => Array.from({ length: rows }, () => new Array(cols).fill(' '));
  const render  = (g) => g.map((r) => r.join('')).join('\n');

  function stamp(g, t, x, y) {
    for (let dy = 0; dy < t.length; dy++) {
      for (let dx = 0; dx < t[dy].length; dx++) {
        const ch = t[dy][dx];
        if (ch === ' ') continue;
        const gx = x + dx, gy = y + dy;
        if (gy >= 0 && gy < g.length && gx >= 0 && gx < g[0].length) g[gy][gx] = ch;
      }
    }
  }

  // side 'l' => clearing on the right (inner = high cols); 'r' => clearing on the left
  function scene(side) {
    const gutter = Math.max(0, (window.innerWidth - 700) / 2);
    const cols = Math.max(8, Math.round((gutter - CLEARING) / CHAR_W));
    const rows = Math.ceil(window.innerHeight / LINE_H) + 2;
    const back = newGrid(cols, rows), front = newGrid(cols, rows);

    const count = Math.max(8, Math.round((rows * cols) / 48));
    const picks = [];
    for (let i = 0; i < count; i++) {
      const r = Math.random();
      const t = r < 0.3 ? SMALL : r < 0.82 ? MED : BIG;   // tighter size range (mostly mid-size)
      const d = Math.random();                            // depth independent of size: a top-down
                                                          // canopy shows fairly uniform crowns, so
                                                          // depth reads via brightness, not scale
      picks.push({ t, d });
    }
    picks.sort((a, b) => a.d - b.d);                        // far first, near last (on top)

    // stratified vertical slots (jittered, then shuffled) so trees spread out evenly
    // instead of clumping in a few spots and leaving bare gaps elsewhere
    const ys = picks.map((_, i) => Math.min(rows - 1, ((i + Math.random()) * rows / picks.length) | 0));
    for (let i = ys.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const tmp = ys[i]; ys[i] = ys[j]; ys[j] = tmp; }

    picks.forEach(({ t, d }, i) => {
      const tw = Math.max(...t.map((s) => s.length));
      const inner = side === 'l' ? (cols - 1) * d : (cols - 1) * (1 - d);
      const spread = (Math.random() - 0.5) * cols * 0.28;   // widen the band so near-trees don't stack
      const x = Math.round(inner + spread) - (tw >> 1);
      stamp(d >= 0.5 ? front : back, t, x, ys[i]);          // split onto two depth layers
    });
    return { back: render(back), front: render(front) };
  }

  // dense clump of tree-tops for a top corner
  function canopy() {
    const g = newGrid(CANOPY_COLS, CANOPY_ROWS);
    const count = 13;
    const picks = [];
    for (let i = 0; i < count; i++) picks.push(Math.random() < 0.4 ? MED : BIG);
    for (const t of picks) {
      const tw = Math.max(...t.map((s) => s.length));
      const x = ((Math.random() * CANOPY_COLS) | 0) - (tw >> 1);
      const y = ((Math.random() * (CANOPY_ROWS - 2)) | 0) - 1;   // bias toward the top
      stamp(g, t, x, y);
    }
    return render(g);
  }

  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); return e; };

  // ── persistence: keep the same forest across in-site link navigation, but grow
  //    a fresh one on refresh or when arriving from elsewhere ──────────────────
  const KEY = 'retreat-forest';

  function generate() {
    return { w: window.innerWidth, h: window.innerHeight, l: scene('l'), r: scene('r'), canopy: canopy() };
  }
  const save = (d) => { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } };
  const fits = (d) => d && d.w === window.innerWidth && d.h === window.innerHeight
                        && d.l && d.r && typeof d.canopy === 'string';

  function cameFromSameSite() {
    const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const type = nav ? nav.type : '';
    if (type === 'reload') return false;              // refresh → regenerate
    if (type === 'back_forward') return true;         // history nav → reuse
    try { return !!document.referrer && new URL(document.referrer).origin === location.origin; }
    catch (e) { return false; }                       // external visit → regenerate
  }

  // reuse the stored forest only for same-site navigation and a matching viewport
  function forestData() {
    let d = cameFromSameSite() ? load() : null;
    if (!fits(d)) { d = generate(); save(d); }
    return d;
  }

  function makeGutter(side, d) {
    const aside = el('aside', 'gutter gutter-' + side);
    const back = el('pre', 'depth-back'), front = el('pre', 'depth-front');
    back.textContent = d[side].back; front.textContent = d[side].front;
    aside.append(back, front);
    document.body.appendChild(aside);
    return { aside, back, front, side };
  }

  function makeCanopy(side, d) {
    const aside = el('aside', 'canopy canopy-' + side);
    const pre = el('pre');
    pre.textContent = d.canopy;
    aside.appendChild(pre);
    document.body.appendChild(aside);
    return { aside, pre };
  }

  let gutters = [], canopies = [];

  function build() {
    if (gutters.length) return;
    const d = forestData();
    gutters = [makeGutter('l', d), makeGutter('r', d)];
    canopies = [makeCanopy('l', d)];   // one canopy, top-left — an intentional asymmetric accent
  }
  function destroy() {
    [...gutters, ...canopies].forEach((o) => o.aside.remove());
    gutters = []; canopies = [];
  }
  function refill() {
    if (!gutters.length) return;
    const d = generate(); save(d);            // new forest for the new size; store it for later nav
    for (const gtr of gutters) { gtr.back.textContent = d[gtr.side].back; gtr.front.textContent = d[gtr.side].front; }
    for (const c of canopies) c.pre.textContent = d.canopy;
  }

  const apply = (e) => (e.matches ? build() : destroy());
  apply(wide);
  wide.addEventListener('change', apply);

  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(refill, 200); });
})();

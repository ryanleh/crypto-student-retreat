// Decrypt-on-load reveal for ALL page text — everything starts scrambled and
// resolves together over ~2s. Runs synchronously (no defer) so the real text
// never flashes before scrambling.
// Safe to remove: delete this file and its <script> tag in index.html.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pool = '0123456789abcdef!<>-_/\\*+=?#';

  // collect every visible text node under <body> (skip scripts/styles + whitespace)
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const isSpace = (c) => c === ' ' || c === '\n' || c === '\t';

  const items = [];
  let n, visible = 0;
  while ((n = walker.nextNode())) {
    const text = n.nodeValue;
    items.push({ node: n, text, settle: [] });
    for (const c of text) if (!isSpace(c)) visible++;   // count only characters you can see
  }

  // Linear top-to-bottom sweep at a constant *visible* rate. Whitespace (source
  // newlines/indentation) is skipped so the front never stalls on blank runs —
  // i.e. actually constant-time. :)
  const TARGET = 200;                          // frames for the front to reach the bottom
  const step = TARGET / Math.max(visible, 1);  // frames per visible character
  let gi = 0;
  for (const it of items) {
    for (let i = 0; i < it.text.length; i++) {
      if (isSpace(it.text[i])) { it.settle[i] = 0; continue; }   // spaces don't consume the sweep
      it.settle[i] = gi * step + Math.random() * 10;             // small jitter softens the edge
      gi++;
    }
  }

  let frame = 0;
  (function tick() {
    let done = true;
    for (const it of items) {
      let out = '';
      for (let i = 0; i < it.text.length; i++) {
        const c = it.text[i];
        if (c === ' ' || c === '\n' || c === '\t') { out += c; continue; }
        if (frame >= it.settle[i]) out += c;
        else { out += pool[(Math.random() * pool.length) | 0]; done = false; }
      }
      it.node.nodeValue = out;
    }
    frame++;
    if (!done) requestAnimationFrame(tick);
    else for (const it of items) it.node.nodeValue = it.text;  // guarantee exact final text
  })();  // first call is synchronous, so the page is already scrambled at first paint
})();

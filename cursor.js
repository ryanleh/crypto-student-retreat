// Custom terminal cursor: a gold block that follows the mouse. No trail, no blink.
// Pairs with the ".caret" block in style.css.
// Safe to remove: delete this file and its <script> tag in index.html.
(function () {
  // ───────────────────────────────────────────────────────────
  const ENABLED = true;    // flip to false to use the normal system cursor
  // ───────────────────────────────────────────────────────────
  if (!ENABLED) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduced) return;                 // keep native cursor on touch / reduced-motion

  const caret = document.createElement('div');
  caret.className = 'caret';
  document.body.appendChild(caret);

  addEventListener('mousemove', (e) => {
    // hide the native cursor only once we have a position to place the block at,
    // so there's never a gap where no cursor shows (e.g. right after a refresh)
    document.documentElement.classList.add('cursor-fx');
    caret.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    caret.classList.add('show');
  });

  document.addEventListener('mouseleave', () => caret.classList.remove('show'));
})();

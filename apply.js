// Submits the application form to Web3Forms via fetch, so the applicant stays on
// our themed page (no redirect) and sees an in-theme success/error message.
// Safe to remove: delete this file and its <script> tag in apply.html.
(function () {
  const form = document.getElementById('apply-form');
  if (!form) return;
  const statusEl = document.getElementById('form-status');
  const btn = form.querySelector('.submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();                       // native validation gates required fields first
    btn.disabled = true;
    statusEl.className = 'form-status';
    statusEl.textContent = 'submitting…';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const json = await res.json();
      if (json.success) {
        btn.textContent = '✓ submitted';                       // stays disabled from above
        statusEl.className = 'form-status ok';
        statusEl.textContent = 'application received — thanks! the organizers will be in touch.';
      } else {
        throw new Error(json.message || 'submission failed');
      }
    } catch (err) {
      statusEl.className = 'form-status err';
      statusEl.innerHTML =
        '✗ something went wrong — please email <a href="mailto:ryanleh@berkeley.edu">ryanleh@berkeley.edu</a> instead.';
      btn.disabled = false;
    }
  });
})();

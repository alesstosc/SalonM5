/**
 * Booking form → Formspree.
 *
 * L'unica cosa da configurare è l'endpoint: l'attributo `action` del form in
 * index.html. Sostituisci REPLACE_WITH_FORM_ID con il tuo id Formspree
 * (https://formspree.io/ → New form → copia l'URL, es. https://formspree.io/f/xyzabcd).
 * Se preferisci tenerlo qui, imposta FORMSPREE_ENDPOINT: vince sull'action.
 */
const FORMSPREE_ENDPOINT = ''; // es. 'https://formspree.io/f/xyzabcd'

(function () {
  const form = document.getElementById('booking');
  if (!form) return;

  const endpoint = (FORMSPREE_ENDPOINT || form.getAttribute('action') || '').trim();
  const button = form.querySelector('[type="submit"]');
  const submitLabel = button ? button.dataset.submitLabel || button.textContent : '';
  const successBox = form.querySelector('[data-form-status="success"]');
  const errorBox = form.querySelector('[data-form-status="error"]');
  const defaultError = errorBox ? errorBox.textContent : 'Something went wrong.';
  let busy = false;

  const isConfigured = () => endpoint.startsWith('https://formspree.io/f/') && !endpoint.includes('REPLACE_WITH_FORM_ID');

  function setBusy(state) {
    busy = state;
    if (!button) return;
    button.disabled = state;
    button.classList.toggle('is-busy', state);
    button.textContent = state ? 'Sending…' : submitLabel;
    button.setAttribute('aria-busy', state ? 'true' : 'false');
  }

  function reset() {
    if (successBox) successBox.hidden = true;
    if (errorBox) errorBox.hidden = true;
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  }

  function show(type, message) {
    const box = type === 'success' ? successBox : errorBox;
    const other = type === 'success' ? errorBox : successBox;
    if (other) other.hidden = true;
    if (!box) return;
    if (message) box.textContent = message;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  form.addEventListener('input', (event) => {
    event.target.classList.remove('is-invalid');
    if (errorBox) errorBox.hidden = true;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    reset();

    // native validation first (name + contact are required fields)
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.querySelectorAll(':invalid').forEach((el) => el.classList.add('is-invalid'));
      form.reportValidity();
      show('error', defaultError);
      return;
    }

    if (!isConfigured()) {
      console.warn('[form] endpoint Formspree non configurato: imposta action="https://formspree.io/f/<id>" in index.html');
      show('error', 'Form non ancora collegato: aggiungi il tuo id Formspree nell’attributo action del form.');
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        form.reset();
        show('success', form.dataset.successMessage || undefined);
      } else {
        const detail = Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((e) => e.message || e.field).join(' ')
          : '';
        show('error', detail || form.dataset.errorMessage || defaultError);
      }
    } catch (err) {
      const offline = err && err.name === 'AbortError' ? 'Request timed out. ' : '';
      show('error', offline + (form.dataset.errorMessage || defaultError));
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  });
})();

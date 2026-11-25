/**
 * Booking form — invio a un endpoint HTTP "form-to-email" senza backend.
 *
 * Provider supportati out of the box:
 *   - Web3Forms  (default, free 250/mese)  https://api.web3forms.com/submit
 *   - Formspree  (free 50/mese)            https://formspree.io/f/<id>
 *   - qualsiasi endpoint che risponda 200/JSON {success:true}
 *
 * Configurazione: tutto sta nell'attributo `action` del form in index.html,
 * più il campo nascosto `access_key` (Web3Forms) o l'id nell'URL (Formspree).
 * In alternativa imposta ENDPOINT_OVERRIDE qui sotto: vince sull'action.
 */
const ENDPOINT_OVERRIDE = ''; // es. 'https://api.web3forms.com/submit'

(function () {
  const form = document.getElementById('booking');
  if (!form) return;

  const endpoint = (ENDPOINT_OVERRIDE || form.getAttribute('action') || '').trim();
  const provider = (form.dataset.provider || detectProvider(endpoint)).toLowerCase();
  const button = form.querySelector('[type="submit"]');
  const submitLabel = button ? button.dataset.submitLabel || button.textContent : '';
  const successBox = form.querySelector('[data-form-status="success"]');
  const errorBox = form.querySelector('[data-form-status="error"]');
  const defaultError = (errorBox && errorBox.textContent.trim()) || 'Something went wrong.';
  let busy = false;

  function detectProvider(url) {
    if (/web3forms/i.test(url)) return 'web3forms';
    if (/formspree/i.test(url)) return 'formspree';
    return 'generic';
  }

  function isConfigured() {
    if (!/^https?:\/\//.test(endpoint)) return false;
    if (/REPLACE_WITH_FORM_ID|YOUR_WEB3FORMS_ACCESS_KEY|YOUR_/.test(endpoint)) return false;
    const key = form.querySelector('input[name="access_key"]');
    if (provider === 'web3forms' && (!key || /YOUR_/.test(key.value))) return false;
    return true;
  }

  function setBusy(state) {
    busy = state;
    if (!button) return;
    button.disabled = state;
    button.classList.toggle('is-busy', state);
    button.textContent = state ? 'Invio…' : submitLabel;
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

  function messageFrom(data) {
    if (!data) return '';
    if (typeof data.errors === 'object' && data.errors) {
      const list = Array.isArray(data.errors) ? data.errors : [data.errors];
      return list.map((e) => (e && (e.message || e.field)) || '').filter(Boolean).join(' ');
    }
    return typeof data.message === 'string' ? data.message : '';
  }

  form.addEventListener('input', (event) => {
    event.target.classList.remove('is-invalid');
    if (errorBox) errorBox.hidden = true;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    reset();

    if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
      form.querySelectorAll(':invalid').forEach((el) => el.classList.add('is-invalid'));
      form.reportValidity();
      show('error', defaultError);
      return;
    }

    if (!isConfigured()) {
      console.warn('[form] endpoint non configurato: aggiungi la tua access key (Web3Forms) o il tuo id (Formspree) nel form di index.html');
      show('error', 'Form non ancora collegato: aggiungi la tua access key nell’attributo action / campo access_key del form.');
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

      // Web3Forms risponde 200 anche in caso di errore: conta il flag `success`.
      const ok = provider === 'web3forms' ? data.success === true : response.ok;

      if (ok) {
        form.reset();
        show('success', form.dataset.successMessage || undefined);
      } else {
        show('error', messageFrom(data) || form.dataset.errorMessage || defaultError);
      }
    } catch (err) {
      const timeoutMsg = err && err.name === 'AbortError' ? 'Request timed out. ' : '';
      show('error', timeoutMsg + (form.dataset.errorMessage || defaultError));
    } finally {
      clearTimeout(timeout);
      setBusy(false);
    }
  });
})();

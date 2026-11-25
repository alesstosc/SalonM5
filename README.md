# SalonM5

Sito statico one-page per un salone di parrucchieri ("Mèche Rouge"): hero, menu e prezzi,
"The five checks", stylists, gallery "Looks", chair six, form di prenotazione e footer.

Il sito è **interamente in italiano**: titoli, testi, listino, nomi degli stili, form,
messaggi di successo/errore, `lang="it"`, meta description e testi alternativi delle immagini.

Nessuna build, nessun `node_modules`: solo HTML, CSS e JS. Si apre `index.html` dal disco
oppure si serve in locale.

## Struttura

```
SalonM5/
├── index.html                 # la pagina (Bootstrap 5 + CSS del tema)
├── assets/
│   ├── bootstrap/             # bootstrap 5.1 min (css + js bundle)
│   ├── css/
│   │   ├── sections.css       # CSS delle sezioni/tema
│   │   └── app.css            # aggiunte: stati del form, helper a11y
│   ├── js/form.js             # invio del form a Web3Forms (fetch + stati)
│   ├── dropdown/              # navbar dropdown
│   ├── fonts/                 # font self-hosted (Bricolage Grotesque 800, Golos Text 400/500/600)
│   ├── images/                # foto del sito (jpg) + logo
│   ├── popup-overlay-plugin/
│   ├── smoothscroll/
│   ├── theme/                 # style.css + script.js del tema
│   └── web/assets/livecss-v1/ # micro-animazioni
├── scripts/serve.mjs          # dev server statico senza dipendenze
└── .github/workflows/         # deploy automatico su GitHub Pages
```

Convenzione: le classi `sm-*` sono quelle del sistema tipografico/sezioni del tema.

## Uso locale

```bash
npm start          # → http://127.0.0.1:5173
# oppure
npx serve .
```

Requisiti: Node.js 18+ (solo per il dev server; la pagina in sé non ne ha bisogno).

## Form di prenotazione → Web3Forms

Il form `#booking` (sezione "Ask for a chair") invia a **Web3Forms**: gratuito fino a
250 messaggi/mese, nessun account, nessun backend.

L'Access Key è già configurata in `index.html`:

```html
<input type="hidden" name="access_key" value="af80fdac-0118-4ca1-a6e5-e26c1a79a7c0">
```

Per cambiarne una nuova: <https://web3forms.com> → inserisci l'email che riceve le
prenotazioni → arriva l'UUID via mail.

> La key è pubblica per natura (sta nel client). Consiglio: nella dashboard Web3Forms
> attiva **Domain restriction** su `alesstosc.github.io` così nessuno può riusarla da
> altri siti, e opzionalmente hCaptcha.

Dettagli dell'invio (`assets/js/form.js`):

- validazione nativa dei campi obbligatori (nome, telefono/email);
- `fetch` AJAX a `https://api.web3forms.com/submit` con `Accept: application/json`
  (niente redirect), timeout 15s;
- Web3Forms risponde `200` anche in caso di errore: lo script legge il flag `success`
  e mostra il `message` del provider (es. "Invalid access key provided");
- bottone in stato "Sending…", alert di successo/errore in pagina, form resettato;
- honeypot `botcheck` + campi `subject`, `from_name`, `source`;
- se JavaScript è disattivato il form fa comunque un POST classico a Web3Forms.

Nota sul test in locale: Web3Forms accetta invii dal dominio pubblicato; da
`http://localhost` la richiesta può essere rifiutata (CORS). Per provare il form usa il
sito su GitHub Pages o aggiungi il dominio consentito in dashboard.

### Alternative gratuite

Lo script è provider-agnostico: basta cambiare l'`action` (e i campi nascosti) per usare
un altro servizio.

| Servizio | Piano free | Account | Note |
|---|---|---|---|
| **Web3Forms** (default) | 250 msg/mese | solo email per la key | API JSON, risposta `success`, honeypot |
| Formspree | 50 msg/mese | sì | `POST https://formspree.io/f/<id>`, redirect o AJAX |
| FormSubmit.co | gratuito, senza quota dichiarata | no (conferma email) | nessuna key: `https://formsubmit.co/<email>` |
| Getform | 50 msg/mese | sì | simile a Formspree |
| Basin | 100 msg/mese | sì | ottimo anti-spam |
| Netlify Forms | 100 msg/mese | — | funziona **solo** su hosting Netlify, non su GitHub Pages |

Per tornare a Formspree: `action="https://formspree.io/f/<id>"`, `data-provider="formspree"`
e rimuovi il campo `access_key`.

## Deploy

Il workflow `.github/workflows/deploy-pages.yml` pubblica il sito su GitHub Pages ad ogni
push su `main` (Settings → Pages → Source: GitHub Actions).

## Note

- Il design e le fotografie provengono da un template di terzi: verifica la licenza prima
  di un uso commerciale.
- Testi, telefono e indirizzo (`test@email.com`, `+10000000000`, "Main Street") sono
  segnaposto: sostituiscili con quelli reali.

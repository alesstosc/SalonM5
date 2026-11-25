# SalonM5

Sito statico one-page per un salone di parrucchieri ("Mèche Rouge"): hero, menu e prezzi,
"The five checks", stylists, gallery "Looks", chair six, form di prenotazione e footer.

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
│   ├── js/form.js             # invio del form a Formspree (fetch + stati)
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

## Form di prenotazione → Formspree

Il form `#booking` (sezione "Ask for a chair") invia a **Formspree**.

1. Crea un form gratuito su <https://formspree.io> e copia l'endpoint
   (formato `https://formspree.io/f/xxxxxxxx`).
2. In `index.html` sostituisci il placeholder nell'attributo `action`:

   ```html
   <form id="booking" action="https://formspree.io/f/REPLACE_WITH_FORM_ID" method="POST" ...>
   ```

   In alternativa puoi mettere l'URL in `assets/js/form.js` nella costante
   `FORMSPREE_ENDPOINT` (ha la precedenza sull'`action`).
3. Il form aggiunge automaticamente: `_subject`, campo `source` e honeypot `_gotcha`.
   Le email arrivano all'indirizzo collegato al form su Formspree.

Come funziona l'invio:

- validazione nativa dei campi obbligatori (nome, telefono/email);
- `fetch` AJAX verso Formspree con `Accept: application/json` (niente redirect);
- messaggi di successo/errore in pagina, bottone in stato "Sending…", timeout 15s;
- se JavaScript è disattivato il form fa comunque un POST classico a Formspree.

Finché l'endpoint non è configurato, l'invio mostra un avviso in pagina con le istruzioni
invece di fallire silenziosamente.

## Deploy

Il workflow `.github/workflows/deploy-pages.yml` pubblica il sito su GitHub Pages ad ogni
push su `main` (Settings → Pages → Source: GitHub Actions).

## Note

- Il design e le fotografie provengono da un template di terzi: verifica la licenza prima
  di un uso commerciale.
- Testi, telefono e indirizzo (`test@email.com`, `+10000000000`, "Main Street") sono
  segnaposto: sostituiscili con quelli reali.

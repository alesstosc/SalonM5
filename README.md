# SalonM5

Clone statico del template **SalonM5** di Mobirise — un one-page site per un salone di
parrucchieri ("Mèche Rouge"): hero, menu/prezzi, "The five checks", stylists, gallery
"Looks", chair six, form di prenotazione e footer.

Sorgente originale: <https://mobirise.com/extensions/salonm5/>

## Cosa c'è dentro

```
SalonM5/
├── index.html                 # la pagina (HTML statico, Bootstrap 5 + CSS Mobirise)
├── assets/
│   ├── bootstrap/             # bootstrap 5.1 min (css + js bundle)
│   ├── dropdown/              # navbar dropdown Mobirise
│   ├── fonts/                 # font self-hosted (Bricolage Grotesque 800, Golos Text 400/500/600)
│   ├── images/                # tutte le foto del template (jpg) + logo
│   ├── mobirise/              # mbr-additional.css: il CSS del tema
│   ├── popup-overlay-plugin/
│   ├── smoothscroll/
│   ├── theme/                 # style.css + script.js del tema
│   ├── web/assets/livecss-v1/ # micro-animazioni "live css"
│   ├── formoid/               # script del form
│   └── ytplayer/
├── scripts/serve.mjs          # dev server statico senza dipendenze
└── .github/workflows/         # deploy automatico su GitHub Pages
```

Nessuna build, nessun `node_modules`: è HTML/CSS/JS puro. Si può aprire `index.html`
direttamente dal disco oppure servirlo in locale.

## Uso locale

```bash
npm start          # → http://127.0.0.1:5173
# oppure
npx serve .
```

Requisiti: Node.js 18+ (solo per il dev server; la pagina in sé non ne ha bisogno).

## Differenze rispetto all'originale

- Font Google **self-hosted** in `assets/fonts/`, così la pagina funziona anche offline.
- Rimossi i Google Tag Manager / tracker di Mobirise.
- Link di navigazione resi relativi (`#sezione` invece di `https://mobirise.com/...`).
- Il file `mbr-additional.css?v=...` è stato rinominato senza query string.

## Note

- Il form di prenotazione (`#form01-a`) è quello demo del template: fa `POST` verso
  `https://mobirise.eu/`. Va collegato a un backend/endpoint reale (Formspree, un server
  proprio, ecc.) per funzionare davvero.
- Il template è di Mobirise: il layout e gli asset restano di proprietà del rispettivo
  autore. Usalo come riferimento/ispirazione per un sito tuo.

## Deploy

Il workflow `.github/workflows/deploy-pages.yml` pubblica il sito su GitHub Pages ad ogni
push su `main` (Settings → Pages → Source: GitHub Actions).

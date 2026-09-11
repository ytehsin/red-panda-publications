# Red Panda Publications

A bright, cream-and-terracotta site for an independent house: list, author tools, e-book reader, and a dashboard for banners and books.

The palette is cream, terracotta, and rust — the red panda on the imprint, not a dark theme.

## Run locally

```bash
npm install
npm run seed:epubs
npm run dev
```

Open [http://localhost:43127](http://localhost:43127).

## Dashboard

Visit `/admin`. Default password: `redpanda` (override with `ADMIN_PASSWORD`). From there you can:

- Switch, edit, and add homepage banners (including images)
- Add as many books as you like, mark free vs paid, set reader / PDF / print prices
- Add chatbot FAQs
- Write blog posts
- Read the inbox (publish, hire, contact, orders)

## Reading licences

- **Free titles** — reading in the e-book reader is free. PDF download is paid. A printed copy is a third price.
- **Paid titles** — reading in the e-book reader is paid as well.

## Free tools

- ISBN to barcode (PNG, SVG, JPEG)
- Cover designer (trim sizes, layouts, fonts, stock or custom images)
- Publisher page maker (five editable templates, including copyright pages)
- PDF to EPUB (paragraph rebuild, columns, embedded images, 200-page tests)
- Typesetter — coming soon
- Audiobook maker — coming soon

E-book reader: fullscreen EPUB reading, which keeps your place on this device.

```bash
npm run test:epub
```

runs the PDF → EPUB suite, including a 200-page specimen.

## Deploy on yasirtehsin.com via GitHub

This repo includes `.github/workflows/pages.yml`. On every push to `main` it builds a static site and publishes **GitHub Pages** with the custom domain **yasirtehsin.com**.

This environment cannot create your GitHub repository or change DNS (there is no GitHub login here). Do this once:

1. On GitHub, create a public repository (for example `red-panda-publications`).
2. Push this project:
   ```bash
   git remote add github https://github.com/YOUR_USER/red-panda-publications.git
   git push -u github main
   ```
3. Repo **Settings → Pages**: Source = **GitHub Actions**.
4. After the **Deploy yasirtehsin.com** workflow is green, add DNS at your domain registrar (this **replaces** whatever is on yasirtehsin.com today, including ZOPE):

   **Apex `yasirtehsin.com`** — A records to:

   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

   **`www.yasirtehsin.com`** — CNAME to `YOUR_USER.github.io`.

5. In Pages settings, confirm Custom domain = `yasirtehsin.com` and enable HTTPS when the certificate is ready.

The PDF converter and dashboard still work on Pages (conversion runs in the browser; dashboard saves in this browser). A Node host such as Vercel is only needed if you want server-side uploads written to disk.

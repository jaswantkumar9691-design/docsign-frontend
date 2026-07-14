# DocSign Frontend (Next.js)

The signing UI for the Document Signature App backend — upload PDFs, place
typed or drawn signatures directly on the page, share a no-login signing
link, finalize a sealed copy, and review the audit trail. Built with
Next.js (App Router), Tailwind CSS, and `react-pdf`.

**Design note:** styled as a "certified document" theme — deep navy trust
color, a notarial crimson "seal" accent for signing actions, and an
off-white parchment background — instead of a generic SaaS look. Typed
signatures render in a cursive signature font; drawn signatures use an
in-browser canvas pad.

---

## 1. Prerequisites

- Node.js 18+ and npm
- The **backend** (`docsign-backend`) running — this frontend is just the
  UI, it doesn't work standalone.

## 2. Setup

```bash
cd docsign-frontend
npm install
cp .env.local.example .env.local
```

`.env.local` just needs to point at your backend:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 3. Run

```bash
npm run dev
```

Open **http://localhost:3000** — it redirects to `/login`.

## 4. Using it

1. **Register** → you're logged in automatically, landing on your
   documents list.
2. **Upload a PDF.** You're taken straight to its detail page.
3. **Click anywhere on the document** to place a signature — type your
   name or draw it on the signature pad.
4. **Copy the share link** and send it to anyone who also needs to sign
   — they don't need an account. They'll be asked for their name/email,
   then can click to place their own signature the same way.
5. Once everyone's signed, click **Finalize & seal**. This calls the
   backend, which burns every signature into the PDF permanently and
   locks the document — no more signatures can be added after that.
6. **Download the signed copy**, or check the **audit trail** at the
   bottom of the page to see who did what and when.

## 5. How PDF viewing/signing works (for anyone extending this)

- `components/PdfSignerCanvas.js` renders the PDF with `react-pdf` and
  overlays an absolutely-positioned click layer. A click captures its
  position as a **fraction of the page's rendered size (0.0–1.0)**, not
  pixels — this matches exactly what the backend's `SignatureField` model
  expects, so a signature placed near the bottom-right of the page lands
  in the same relative spot regardless of screen size or zoom.
- The PDF.js worker is resolved directly from `react-pdf`'s own
  `pdfjs-dist` dependency (`new URL('pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url)`) rather than a hardcoded CDN version — this is the
  approach `react-pdf`'s own docs recommend, specifically because a
  worker/API version mismatch is the single most common way PDF viewers
  built on `pdfjs-dist` break in production.
- Downloading the original/signed PDF (owner-only, requires a JWT) is
  done via `fetch` + blob rather than a plain `<a href>`, since a link
  tag can't attach an `Authorization` header.

## 6. Deploying

**Recommended: Vercel.** Next.js apps deploy on Vercel with zero
configuration — connect the GitHub repo, set the one environment variable
below, and it just works (no Python-version-style surprises to fight,
since there's no Python involved here at all):

1. Push this project to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import the
   repo.
3. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed backend's URL (e.g.
     `https://docsign-backend.onrender.com`)
4. Deploy. Done.

Any other static/Node host that runs `next build && next start` works
too (Netlify, Render as a second Node web service, your own VPS).

**One thing to double check after deploying both halves:** your backend's
CORS is currently wide open (`allow_origins=["*"]"` in `app/main.py`),
which is fine for getting this working, but if you want to lock it down
later, set it to your Vercel URL specifically.

## 7. Project structure

```
docsign-frontend/
├── app/
│   ├── login/, register/
│   ├── documents/                # list + upload
│   │   └── [id]/                 # detail: sign, finalize, share, audit
│   └── sign/[token]/             # public, no-auth signing page
├── components/
│   ├── PdfSignerCanvas.js        # PDF viewer + click-to-place overlay
│   ├── SignaturePad.js           # draw-your-signature canvas
│   └── AuditTrail.js
└── lib/
    ├── api.js                    # fetch wrapper for the FastAPI backend
    └── auth.js                   # token storage
```

## 8. Note on this environment

Same caveat as the backend: no internet access here means `npm install`
and a real `next build` couldn't be run to verify this end-to-end. I
reviewed every file manually (a plain `node --check` gives false passes
on JSX/ESM files, so it wasn't useful for verification here — I read
through the trickiest components, especially `PdfSignerCanvas.js`, by
hand instead). The `react-pdf` worker setup was chosen specifically
because it's the approach documented to avoid the most common
version-mismatch failure mode. Your first `npm run dev` is the real
test — paste me any error and I'll fix it fast.

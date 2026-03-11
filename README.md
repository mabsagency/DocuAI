# DocuAI

DocuAI est une application SaaS gratuite pour scanner, OCR, convertir, éditer et partager des documents.

## Installation

1. `npm install`
2. `npm run dev`
3. Ouvrir `http://localhost:3000`

## Fonctionnalités implémentées dans cette version initiale

- UI Next.js + Tailwind (page principal, sidebar, cartes produit)
- Scanner webcam + import image + recadrage auto + OpenCV.js (WASM)
- OCR réel Tesseract : `POST /api/ocr` avec quotas 30/min et 1000/jour
- Conversion : `image->PDF`, `pdf->text`, `pdf->word`, `word->pdf`
- Import PDF en pages + fusion multi-pages
- Stockage cloud mock : `GET/POST/DELETE /api/cloud-docs` (dossiers, tri, drag-drop)
- Auth NextAuth Credentials + DB stub `lib/db.ts`
- Partage lien via `POST /api/share` + WhatsApp
- Éditeur simple + signature (canvas)

## Développement

- Ajouter suite des composants dans `components/` et `app/`
- Scanner document via caméra/Webcam et recadrage automatique dans `components/DocumentScanner.tsx`
- OCR réel avec Tesseract.js dans `app/api/ocr/route.ts`
- Ajouter stockage cloud et utilisateur (PostgreSQL + Auth)

## Déploiement Vercel

1. Se connecter sur https://vercel.com et créer un nouveau projet.
2. Lier le repository GitHub / dossier local.
3. Ajouter les variables d'environnement dans la section Settings:
   - `NEXT_PUBLIC_SUPABASE_URL` (ex: `https://...supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Public anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` (Service role key, **secret**)
   - `NEXTAUTH_URL` (ex: `https://votre-projet.vercel.app`)
   - `NEXTAUTH_SECRET` (clé secrète JWT)
4. Lancer le déploiement ; Vercel détecte Next.js.
5. Vérifier `https://<projet>.vercel.app/api/users/count` renvoie JSON.

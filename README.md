# Jai Maa Bhadrakali Studio

Wedding photography, cinematic films and Katha live-streaming website with a Node.js admin API.

## Folders

- `frontend/` - public website, admin panel, styles, scripts and studio images.
- `backend/` - Node.js API, login, enquiries, gallery uploads and private JSON data.

## Local run

```bash
cd backend
ADMIN_USER=admin ADMIN_PASSWORD='change-this-password' npm start
```

Open `http://localhost:8000/` for the website and `http://localhost:8000/admin/` for the admin panel.

Never commit `backend/data/site-data.json`, admin passwords, SSH keys or customer enquiries. Set `ADMIN_USER` and a strong `ADMIN_PASSWORD` in the hosting provider's environment settings.

## Hosting

The current free deployment uses two services:

- **Render Static Site:** Root Directory `frontend`, Build Command blank, Publish Directory `.`
- **Vercel Functions:** Root Directory `backend`, Install Command `npm install`, Build and Output Commands blank

Set these Vercel environment variables: `ADMIN_USER`, `ADMIN_PASSWORD`, `FRONTEND_ORIGIN`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key must stay private. Supabase stores settings, enquiries and gallery records; the `gallery` Storage bucket stores uploaded images.

Free services may sleep when unused. Keep the hosting provider's environment variables private.

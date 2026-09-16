# Jai Maa Bhadrakali Studio

Wedding photography, cinematic films and Katha live-streaming website with a Node.js admin API.

## Folders

- `frontend/` - public website, admin panel, styles, scripts and studio images.
- `backend/` - Node.js API, login, enquiries, gallery uploads and private JSON data.
- `deploy/` - Oracle VM and Nginx deployment files.

## Local run

```bash
cd backend
ADMIN_USER=admin ADMIN_PASSWORD='change-this-password' npm start
```

Open `http://localhost:8000/` for the website and `http://localhost:8000/admin/` for the admin panel.

Never commit `backend/data/site-data.json`, admin passwords, SSH keys or customer enquiries. Set `ADMIN_USER` and a strong `ADMIN_PASSWORD` in the hosting provider's environment settings.

## Render deployment

Create a free **Web Service** from this public repository. Leave the root directory blank, set build command to `npm install --prefix backend`, and start command to `npm start --prefix backend`. The backend serves the frontend from the sibling `frontend` folder, so the service must use the repository root as its source.

Free services may sleep when unused. For a permanent VM deployment, see `ORACLE_DEPLOYMENT.md`.

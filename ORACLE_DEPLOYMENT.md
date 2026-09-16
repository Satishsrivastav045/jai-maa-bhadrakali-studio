# Oracle Always Free Deployment

This project now has a Node.js API, admin login and file uploads, so deploy it on an Oracle Ubuntu VM rather than GitHub Pages.

## 1. Create the free VM

Create an Oracle Cloud Always Free Compute VM using Ubuntu. Add ingress rules for TCP ports `22`, `80` and `443`. Oracle documents the Always Free compute resources here:

https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm

Keep the SSH private key on your computer. Never upload it to the project.

## 2. Copy the project to the VM

From this project directory, replace `VM_IP` with the VM public IP:

```bash
rsync -av --exclude node_modules --exclude .git ./ ubuntu@VM_IP:/tmp/jai-maa-bhadrakali-studio/
ssh ubuntu@VM_IP
sudo mkdir -p /var/www/jai-maa-bhadrakali-studio
sudo cp -R /tmp/jai-maa-bhadrakali-studio/. /var/www/jai-maa-bhadrakali-studio/
cd /var/www/jai-maa-bhadrakali-studio
sudo bash deploy/oracle/install.sh
```

Before the final `systemctl restart`, edit `/etc/jai-maa-studio.env` and set a strong `ADMIN_PASSWORD`.

## 3. Create a free subdomain

Create a DuckDNS subdomain, for example `jaimaabhadrakali.duckdns.org`, and point it to the Oracle VM public IP. DuckDNS requires an account and its token; that step cannot be completed from this local project without your account access.

## 4. Configure Nginx

Replace `YOUR_DUCKDNS_SUBDOMAIN.duckdns.org` in `deploy/oracle/nginx.conf.template`, then run on the VM:

```bash
sudo cp deploy/oracle/nginx.conf.template /etc/nginx/sites-available/jai-maa-studio
sudo ln -s /etc/nginx/sites-available/jai-maa-studio /etc/nginx/sites-enabled/jai-maa-studio
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d YOUR_DUCKDNS_SUBDOMAIN.duckdns.org
```

After HTTPS is active:

- Public website: `https://YOUR_DUCKDNS_SUBDOMAIN.duckdns.org/`
- Admin: `https://YOUR_DUCKDNS_SUBDOMAIN.duckdns.org/admin/`

## 5. Backups

Back up `/var/www/jai-maa-bhadrakali-studio/backend/data/site-data.json` and `/var/www/jai-maa-bhadrakali-studio/frontend/assets/uploads/` regularly. The current app uses a JSON file for its small studio dataset; migrate to a managed database when the site grows.

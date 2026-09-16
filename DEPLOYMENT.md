# Jai Maa Bhadrakali Studio Deployment Notes

## Current Project Type

This is now a small Node.js website and API server:

- `index.html`
- `styles.css`
- `script.js`
- `assets/logo.png`
- `robots.txt`
- `sitemap.xml`
- `server.js`
- `package.json`
- `data/site-data.json`

The project includes an authenticated admin workspace at `admin.html`. The Node server stores settings, gallery entries and enquiries in `data/site-data.json` and protects admin API routes with an HTTP-only session cookie.

## Required Business Updates Before Going Live

Update these values in `script.js` inside `studioConfig` (or use the browser admin for local preview settings):

- `phone`
- `email`
- `website`
- `address`
- `socials.youtube`
- `socials.instagram`
- `socials.facebook`
- `socials.googleReviews`
- `socials.directions`

Update these values in `index.html` if the final domain changes:

- canonical URL
- Open Graph URL
- Open Graph image
- Schema.org URL and image

Update `robots.txt` and `sitemap.xml` if the final domain is different.

## Analytics / Lead Tracking

The frontend pushes these events to `window.dataLayer`:

- `whatsapp_click`
- `call_click`
- `date_availability_submit`
- `gallery_filter`
- `copy_link_click`
- `native_share_click`
- `save_card_click`

Add Google Tag Manager or Google Analytics in `index.html` to collect these events.

The visible profile-view counter is a local browser counter, not real visitor analytics. Replace it with an analytics provider before presenting it as a true traffic metric.

## Static Hosting

This can be hosted on:

- Netlify
- Vercel static hosting
- Cloudflare Pages
- GitHub Pages
- Any Apache/Nginx shared hosting

Static hosting is still suitable only for the fallback public page. To use the admin, API and shared enquiries, deploy the project on a Node-compatible host and run `npm start`.

For local development:

```bash
ADMIN_USER=admin ADMIN_PASSWORD='use-a-strong-password' npm start
```

Never use the sample/default password in production. Put `ADMIN_PASSWORD` in the host's environment settings, not in frontend files.

## Future Django Upgrade

If Django admin/content management is needed, migrate the static sections into models for:

- Services
- Gallery images
- Videos
- Packages
- Testimonials
- Contact information
- Social links
- Homepage content
- Location/service pages
- Enquiries

Use environment variables for `SECRET_KEY`, database credentials and any third-party API keys. Do not expose secrets in frontend files.

## Production Admin Checklist

- Replace the JSON file with a managed database when traffic or team size grows.
- Add server-side validation, HTTPS and spam/rate-limit protection.
- Rotate the admin password and session strategy before production launch.
- Connect the final Facebook and Google Business Profile review URLs.

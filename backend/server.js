const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const FRONTEND_ROOT = path.join(ROOT, 'frontend');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const PORT = Number(process.env.PORT || 8000);
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-password';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const sessions = new Map();

const defaults = {
  settings: {
    name: 'Jai Maa Bhadrakali Studio',
    phone: '+918853496825',
    email: 'jaimaabhadrakalistudio@gmail.com',
    website: 'https://jaimaabhadrakalistudio.in/',
    address: 'Shop no 5, Lalganj Ajhara, Near Saryu Montessori School, Pratapgarh, Uttar Pradesh 230128',
  },
  gallery: [
    { id: 'katha-live', url: 'assets/katha-live.jpeg', title: 'Katha Live', category: 'events' },
    { id: 'bride-portrait', url: 'assets/bride-portrait.jpg', title: 'Bride Portrait', category: 'bride' },
    { id: 'wedding-couple', url: 'assets/wedding-couple.jpg', title: 'Wedding Couple', category: 'wedding' },
    { id: 'couple-night', url: 'assets/couple-night.jpg', title: 'Cinematic Couple', category: 'cinematic' },
    { id: 'bride-detail', url: 'assets/bride-detail.jpg', title: 'Bridal Details', category: 'bride' },
    { id: 'krishna-darshan', url: 'assets/krishna-darshan.jpeg', title: 'Devotional Darshan', category: 'events' },
  ],
  leads: [],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaults, null, 2));
  try { return { ...clone(defaults), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) }; } catch { return clone(defaults); }
}
let data = loadData();
function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function json(res, status, payload, headers = {}) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers }); res.end(JSON.stringify(payload)); }
function noContent(res) { res.writeHead(204); res.end(); }
function setCors(res) { if (!FRONTEND_ORIGIN) return; res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS'); }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', (chunk) => { raw += chunk; if (raw.length > 12_000_000) req.destroy(); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Invalid JSON')); } }); req.on('error', reject); }); }
function readRaw(req) { return new Promise((resolve, reject) => { const chunks = []; let size = 0; req.on('data', (chunk) => { size += chunk.length; if (size > 15_000_000) return reject(new Error('File too large')); chunks.push(chunk); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
async function readMultipart(req) { const contentType = req.headers['content-type'] || ''; const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i); if (!boundaryMatch) throw new Error('Multipart boundary missing'); const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`); const raw = await readRaw(req); const fields = {}; let file = null; for (const part of raw.toString('binary').split(boundary.toString('binary'))) { if (!part || part === '--\r\n' || part === '--') continue; const clean = part.replace(/^\r\n/, '').replace(/\r\n--\r\n?$/, '').replace(/\r\n$/, ''); const separator = clean.indexOf('\r\n\r\n'); if (separator < 0) continue; const headers = clean.slice(0, separator); const body = clean.slice(separator + 4); const nameMatch = headers.match(/name="([^"]+)"/); if (!nameMatch) continue; const name = nameMatch[1]; const filenameMatch = headers.match(/filename="([^"]*)"/); if (filenameMatch && filenameMatch[1]) file = { filename: filenameMatch[1], type: (headers.match(/Content-Type:\s*([^\r\n]+)/i) || [])[1] || 'application/octet-stream', data: Buffer.from(body, 'binary') }; else fields[name] = body; } return { fields, file }; }
function cookieValue(req, name) { const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((part) => part.trim().split('='))); return cookies[name]; }
function isAuthed(req) { const token = cookieValue(req, 'jmb_session'); const session = token && sessions.get(token); if (!session || session.expires < Date.now()) { if (token) sessions.delete(token); return false; } return true; }
function requireAuth(req, res) { if (isAuthed(req)) return true; json(res, 401, { error: 'Authentication required' }); return false; }
function safeFilePath(urlPath) { const requested = urlPath === '/' ? '/index.html' : urlPath; const resolved = path.resolve(FRONTEND_ROOT, `.${requested}`); return resolved === FRONTEND_ROOT || resolved.startsWith(`${FRONTEND_ROOT}${path.sep}`) ? resolved : null; }
function contentType(file) { return { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8' }[path.extname(file).toLowerCase()] || 'application/octet-stream'; }
function storeImageData(dataUrl) { const match = String(dataUrl || '').match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/); if (!match) throw new Error('Valid image file required'); const mime = match[1].toLowerCase(); const allowed = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif']; if (!allowed.includes(mime)) throw new Error('JPG, PNG, WebP, GIF ya AVIF image use karein'); const extension = mime === 'jpeg' ? 'jpg' : mime; const uploadDir = path.join(FRONTEND_ROOT, 'assets', 'uploads'); fs.mkdirSync(uploadDir, { recursive: true }); const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`; fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(match[2], 'base64')); return `/assets/uploads/${filename}`; }
function storeImageBuffer(buffer, type) { const mime = String(type || '').toLowerCase().split('/').pop(); const allowed = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif']; if (!allowed.includes(mime)) throw new Error('JPG, PNG, WebP, GIF ya AVIF image use karein'); const extension = mime === 'jpeg' ? 'jpg' : mime; const uploadDir = path.join(FRONTEND_ROOT, 'assets', 'uploads'); fs.mkdirSync(uploadDir, { recursive: true }); const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`; fs.writeFileSync(path.join(uploadDir, filename), buffer); return `/assets/uploads/${filename}`; }

async function handleApi(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/login') {
    const body = await readBody(req);
    if (body.username !== ADMIN_USER || body.password !== ADMIN_PASSWORD) return json(res, 401, { error: 'Invalid username or password' });
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expires: Date.now() + 8 * 60 * 60 * 1000 });
    return json(res, 200, { ok: true }, { 'Set-Cookie': `jmb_session=${token}; HttpOnly; SameSite=${FRONTEND_ORIGIN ? 'None' : 'Lax'}; ${FRONTEND_ORIGIN ? 'Secure; ' : ''}Path=/; Max-Age=28800` });
  }
  if (req.method === 'POST' && pathname === '/api/logout') {
    const token = cookieValue(req, 'jmb_session'); if (token) sessions.delete(token);
    return json(res, 200, { ok: true }, { 'Set-Cookie': `jmb_session=; HttpOnly; SameSite=${FRONTEND_ORIGIN ? 'None' : 'Lax'}; ${FRONTEND_ORIGIN ? 'Secure; ' : ''}Path=/; Max-Age=0` });
  }
  if (req.method === 'GET' && pathname === '/api/session') return json(res, 200, { authenticated: isAuthed(req) });
  if (req.method === 'GET' && pathname === '/api/public') return json(res, 200, { settings: data.settings, gallery: data.gallery });
  if (req.method === 'POST' && pathname === '/api/leads') { const body = await readBody(req); data.leads.push({ ...body, createdAt: new Date().toISOString() }); saveData(); return json(res, 201, { ok: true }); }
  if (!requireAuth(req, res)) return;
  if (req.method === 'GET' && pathname === '/api/settings') return json(res, 200, data.settings);
  if (req.method === 'PUT' && pathname === '/api/settings') { data.settings = { ...data.settings, ...(await readBody(req)) }; saveData(); return json(res, 200, data.settings); }
  if (req.method === 'POST' && pathname === '/api/gallery-upload') { const upload = await readMultipart(req); if (!upload.file) return json(res, 400, { error: 'Photo file missing' }); const item = { id: `custom-${Date.now()}`, url: storeImageBuffer(upload.file.data, upload.file.type), title: String(upload.fields.title || 'Portfolio'), category: String(upload.fields.category || 'wedding') }; data.gallery.push(item); saveData(); return json(res, 201, item); }
  if (req.method === 'POST' && pathname === '/api/upload') {
    const body = await readBody(req);
    return json(res, 201, { url: storeImageData(body.data) });
  }
  if (req.method === 'GET' && pathname === '/api/gallery') return json(res, 200, data.gallery);
  if (req.method === 'POST' && pathname === '/api/gallery') { const body = await readBody(req); let imageUrl = String(body.url || ''); if (!imageUrl && body.data) imageUrl = storeImageData(body.data); const item = { id: `custom-${Date.now()}`, url: imageUrl, title: String(body.title || 'Portfolio'), category: String(body.category || 'wedding') }; if (!item.url) return json(res, 400, { error: 'Photo select karke Add to gallery dabayein' }); data.gallery.push(item); saveData(); return json(res, 201, item); }
  if (req.method === 'DELETE' && pathname.startsWith('/api/gallery/')) { const id = decodeURIComponent(pathname.slice('/api/gallery/'.length)); data.gallery = data.gallery.filter((item) => item.id !== id); saveData(); return noContent(res); }
  if (req.method === 'GET' && pathname === '/api/leads') return json(res, 200, data.leads);
  if (req.method === 'DELETE' && pathname === '/api/leads') { data.leads = []; saveData(); return noContent(res); }
  if (req.method === 'DELETE' && pathname.startsWith('/api/leads/')) { const index = Number(pathname.slice('/api/leads/'.length)); if (Number.isInteger(index)) data.leads.splice(index, 1); saveData(); return noContent(res); }
  return json(res, 404, { error: 'API route not found' });
}

async function handleRequest(req, res) {
  try {
    setCors(res);
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    const { pathname } = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    if (pathname === '/admin' || pathname === '/admin/') { res.writeHead(302, { Location: '/admin.html' }); return res.end(); }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
    const file = safeFilePath(pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return json(res, 404, { error: 'Not found' });
    const cacheHeader = /\.(png|jpe?g|webp|gif)$/i.test(file) ? 'public, max-age=3600' : 'no-cache';
    res.writeHead(200, { 'Content-Type': contentType(file), 'Cache-Control': cacheHeader });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (error) { json(res, 500, { error: error.message || 'Server error' }); }
}

if (require.main === module) {
  http.createServer(handleRequest).listen(PORT, () => console.log(`Jai Maa Bhadrakali Studio server running at http://localhost:${PORT}`));
}

module.exports = { handleRequest };

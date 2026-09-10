// Admin dashboard API — email + password gated (env ADMIN_EMAILS / ADMIN_PASSWORD),
// with Google sign-in as an optional alternative when GOOGLE_CLIENT_ID exists.
// GET  ?config=1             -> { client_id, password: bool } (public)
// POST {email, password}     -> { token } (12h session token, HMAC-signed)
// GET  (Bearer token)        -> aggregated stats from Upstash Redis
const crypto = require('crypto');
const { redis, redisPipeline, day, enabled } = require('./_redis.js');

const SITE = 'https://samanthausedcar.com';
const ALLOWED_ORIGINS = [
    'https://samanthausedcar.com',
    'https://www.samanthausedcar.com',
    'https://abcars-samantha-website.vercel.app',
    'http://localhost:8123',
];
const SESSION_MS = 12 * 60 * 60 * 1000;

const adminEmails = () => String(process.env.ADMIN_EMAILS || '')
    .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
const adminPassword = () => process.env.ADMIN_PASSWORD || '';

let invCache = { at: 0, cars: [] };
async function loadCars() {
    if (invCache.cars.length && Date.now() - invCache.at < 30 * 60 * 1000) return invCache.cars;
    try {
        const r = await fetch(SITE + '/data/vehicles.json');
        if (r.ok) {
            const data = await r.json();
            invCache = { at: Date.now(), cars: data.vehicles || [] };
        }
    } catch (e) { /* keep old cache */ }
    return invCache.cars;
}

// --- session tokens: base64url(email|exp).hmac ---
function signingKey() {
    return crypto.createHash('sha256')
        .update('samantha-admin|' + adminPassword() + '|' + adminEmails().join(','))
        .digest();
}
function safeEqual(a, b) {
    const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
function issueToken(email) {
    const payload = Buffer.from(`${email}|${Date.now() + SESSION_MS}`).toString('base64url');
    const mac = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
    return `${payload}.${mac}`;
}
function verifyToken(token) {
    const [payload, mac] = String(token || '').split('.');
    if (!payload || !mac) return null;
    const expect = crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
    if (!safeEqual(mac, expect)) return null;
    const [email, exp] = Buffer.from(payload, 'base64url').toString().split('|');
    if (!email || !exp || Date.now() > Number(exp)) return null;
    if (!adminEmails().includes(email.toLowerCase())) return null;
    return email;
}

async function verifyGoogle(token) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return null;
    try {
        const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
        if (!r.ok) return null;
        const info = await r.json();
        if (info.aud !== clientId) return null;
        if (info.email_verified !== 'true' && info.email_verified !== true) return null;
        const email = String(info.email || '').toLowerCase();
        return adminEmails().includes(email) ? email : null;
    } catch (e) {
        return null;
    }
}

async function verifyAdmin(req) {
    if (!adminEmails().length || (!adminPassword() && !process.env.GOOGLE_CLIENT_ID)) {
        return { error: 'not_configured' };
    }
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token) return { error: 'no_token' };
    const email = (adminPassword() && verifyToken(token)) || (await verifyGoogle(token));
    return email ? { email } : { error: 'not_allowed' };
}

// Login attempts: 5 per minute per IP (per warm instance)
const attempts = new Map();
function tooManyAttempts(ip) {
    const now = Date.now();
    const rec = attempts.get(ip) || { n: 0, reset: now + 60000 };
    if (now > rec.reset) { rec.n = 0; rec.reset = now + 60000; }
    rec.n += 1;
    attempts.set(ip, rec);
    return rec.n > 5;
}

const parseList = (arr) => (Array.isArray(arr) ? arr : []).map((s) => {
    try { return JSON.parse(s); } catch (e) { return null; }
}).filter(Boolean);

module.exports = async (req, res) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (req.method === 'POST' && req.body && req.body.action === 'reset') {
        // Wipe every analytics key (used to clear test data before real launch)
        const who = await verifyAdmin(req);
        if (who.error) return res.status(401).json({ error: who.error || 'not_allowed' });
        if (!enabled) return res.status(200).json({ ok: true, deleted: 0 });
        const keys = ['pv:total', 'leads:total', 'chat:log', 'leads:log', 'car:clicks', 'geo'];
        for (let i = 0; i < 400; i++) keys.push(`pv:${day(i)}`, `chat:turns:${day(i)}`);
        const r = await redis('DEL', ...keys);
        console.log('admin reset by', who.email, 'deleted', r);
        return res.status(200).json({ ok: true, deleted: r || 0 });
    }

    if (req.method === 'POST') {
        // Password login
        if (!adminPassword() || !adminEmails().length) return res.status(503).json({ error: 'not_configured' });
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
        if (tooManyAttempts(ip)) return res.status(429).json({ error: 'rate_limited' });
        const body = req.body || {};
        const email = String(body.email || '').toLowerCase().trim().slice(0, 120);
        const password = String(body.password || '').slice(0, 200);
        const ok = adminEmails().includes(email) && safeEqual(password, adminPassword());
        if (!ok) {
            console.log('admin login failed for', email || '(empty)');
            return res.status(401).json({ error: 'bad_login' });
        }
        return res.status(200).json({ token: issueToken(email), email: email });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'method' });

    if (req.query && req.query.config) {
        return res.status(200).json({
            client_id: process.env.GOOGLE_CLIENT_ID || null,
            password: !!(adminPassword() && adminEmails().length),
        });
    }

    const who = await verifyAdmin(req);
    if (who.error === 'not_configured') return res.status(503).json({ error: 'not_configured' });
    if (who.error) return res.status(401).json({ error: who.error });

    if (!enabled) {
        return res.status(200).json({ ok: true, storage: false, email: who.email });
    }

    const days = [];
    for (let i = 29; i >= 0; i--) days.push(day(i));
    const cmds = [];
    days.forEach((d) => cmds.push(['GET', `pv:${d}`]));
    days.forEach((d) => cmds.push(['GET', `chat:turns:${d}`]));
    cmds.push(['GET', 'pv:total']);
    cmds.push(['GET', 'leads:total']);
    cmds.push(['LRANGE', 'chat:log', 0, 119]);
    cmds.push(['LRANGE', 'leads:log', 0, 49]);
    cmds.push(['ZRANGE', 'car:clicks', 0, 9, 'REV', 'WITHSCORES']);
    cmds.push(['ZRANGE', 'geo', 0, 11, 'REV', 'WITHSCORES']);

    const out = await redisPipeline(cmds);
    if (!out) return res.status(200).json({ ok: true, storage: false, email: who.email });
    const results = out.map((o) => (o && o.result !== undefined ? o.result : null));

    const pvSeries = results.slice(0, 30).map((v) => parseInt(v, 10) || 0);
    const chatSeries = results.slice(30, 60).map((v) => parseInt(v, 10) || 0);
    const pvTotal = parseInt(results[60], 10) || 0;
    const leadsTotal = parseInt(results[61], 10) || 0;
    const convos = parseList(results[62]);
    const leads = parseList(results[63]);
    const carPairs = results[64] || [];
    const geoPairs = results[65] || [];

    const sum = (arr, n) => arr.slice(-n).reduce((a, b) => a + b, 0);

    const cars = await loadCars();
    const topCars = [];
    for (let i = 0; i < carPairs.length; i += 2) {
        const id = Number(carPairs[i]);
        const car = cars.find((c) => c.id === id);
        topCars.push({
            id: id,
            clicks: parseInt(carPairs[i + 1], 10) || 0,
            title: car ? car.title : `(sold) #${id}`,
            price: car ? car.price : '',
            url: `${SITE}/cars/${id}`,
        });
    }
    const geo = [];
    for (let i = 0; i < geoPairs.length; i += 2) {
        geo.push({ country: geoPairs[i], count: parseInt(geoPairs[i + 1], 10) || 0 });
    }

    return res.status(200).json({
        ok: true,
        storage: true,
        email: who.email,
        stats: {
            pv: { today: pvSeries[29], d7: sum(pvSeries, 7), d30: sum(pvSeries, 30), total: pvTotal },
            chat: { today: chatSeries[29], d7: sum(chatSeries, 7), d30: sum(chatSeries, 30) },
            leads: { total: leadsTotal },
        },
        series: days.map((d, i) => ({ d: d, pv: pvSeries[i], chat: chatSeries[i] })),
        convos: convos,
        leads: leads,
        topCars: topCars,
        geo: geo,
    });
};

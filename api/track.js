// Lightweight analytics beacon: page views, car-page views, country counts.
// Sent as text/plain sendBeacon (CORS "simple request"); body is JSON text.
// Stores aggregates only — no raw IPs, no cookies.
const { redisPipeline, day } = require('./_redis.js');

const ALLOWED_ORIGINS = [
    'https://samanthausedcar.com',
    'https://www.samanthausedcar.com',
    'https://kjhk3082.github.io',
    'https://abcars-samantha-website.vercel.app',
    'http://localhost:8123',
];

module.exports = async (req, res) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).end();
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return res.status(204).end();

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const t = body.t === 'car' ? 'car' : body.t === 'pv' ? 'pv' : null;
    if (t) {
        const country = String(req.headers['x-vercel-ip-country'] || 'ZZ').slice(0, 2);
        const cmds = [
            ['INCR', 'pv:total'],
            ['INCR', `pv:${day()}`],
            ['ZINCRBY', 'geo', 1, country],
        ];
        const id = String(body.id || '');
        if (t === 'car' && /^\d{1,8}$/.test(id)) {
            cmds.push(['ZINCRBY', 'car:clicks', 1, id]);
        }
        await redisPipeline(cmds);
    }
    return res.status(204).end();
};

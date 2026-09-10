// Public aggregate view counts per car (no personal data — just totals from
// the page-view beacons). Used by vehicles.html to show "N views" badges and
// a popularity sort. GET /api/popular -> {views:{"12345":42,...}}
const { redis, enabled } = require('./_redis.js');

let cache = { at: 0, body: null };

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    if (req.method !== 'GET') return res.status(405).json({ error: 'method' });
    if (!enabled) return res.status(200).json({ views: {} });
    try {
        if (!cache.body || Date.now() - cache.at > 60 * 1000) {
            const flat = await redis('ZRANGE', 'car:clicks', 0, 199, 'REV', 'WITHSCORES');
            const views = {};
            if (Array.isArray(flat)) {
                for (let i = 0; i + 1 < flat.length; i += 2) {
                    const id = String(flat[i]).replace(/[^0-9]/g, '');
                    const n = parseInt(flat[i + 1], 10);
                    if (id && n > 0) views[id] = n;
                }
            }
            cache = { at: Date.now(), body: { views: views } };
        }
        return res.status(200).json(cache.body);
    } catch (e) {
        return res.status(200).json({ views: {} });
    }
};

// Upstash Redis REST helper (no dependencies). Silently no-ops when the
// store isn't provisioned so analytics can never break product paths.
const BASE = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || null;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || null;

async function redis(...cmd) {
    if (!BASE || !TOKEN) return null;
    try {
        const r = await fetch(BASE, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cmd),
        });
        if (!r.ok) {
            console.error('redis', cmd[0], r.status, (await r.text()).slice(0, 120));
            return null;
        }
        return (await r.json()).result;
    } catch (e) {
        console.error('redis', cmd[0], e && e.message);
        return null;
    }
}

async function redisPipeline(cmds) {
    if (!BASE || !TOKEN || !cmds || !cmds.length) return null;
    try {
        const r = await fetch(BASE + '/pipeline', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(cmds),
        });
        if (!r.ok) {
            console.error('redis pipeline', r.status, (await r.text()).slice(0, 120));
            return null;
        }
        return r.json();
    } catch (e) {
        console.error('redis pipeline', e && e.message);
        return null;
    }
}

const day = (offsetDays) => {
    const d = new Date();
    if (offsetDays) d.setUTCDate(d.getUTCDate() - offsetDays);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
};

module.exports = { redis, redisPipeline, day, enabled: !!(BASE && TOKEN) };

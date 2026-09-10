// Samantha Used Car — AI assistant backend (Vercel serverless function)
// POST /api/chat  {messages:[{role:'user'|'assistant', content:string}, ...]}
// ->  {reply, cards:[{id,title,price,miles,image,url}], handoff:{...,wa_url}|null}
// Brain: OpenRouter (default model anthropic/claude-haiku-4.5), live inventory
// injected from the site's vehicles.json. No npm dependencies.

const SITE = 'https://samanthausedcar.com';
const WA_PHONE = '821071704513';
const ALLOWED_ORIGINS = [
    'https://samanthausedcar.com',
    'https://www.samanthausedcar.com',
    'https://kjhk3082.github.io',
    'http://localhost:8123',
];
const MODEL = process.env.MODEL || 'anthropic/claude-haiku-4.5';

// --- live inventory (10 min module cache) ---
let invCache = { at: 0, cars: [] };

async function loadCars() {
    if (invCache.cars.length && Date.now() - invCache.at < 10 * 60 * 1000) return invCache.cars;
    const r = await fetch(SITE + '/data/vehicles.json', { headers: { 'user-agent': 'samantha-ai' } });
    if (!r.ok) throw new Error('inventory fetch ' + r.status);
    const data = await r.json();
    invCache = { at: Date.now(), cars: data.vehicles || [] };
    return invCache.cars;
}

const displayTitle = (t) => String(t || '')
    .replace(/^[\s*!]*US[\s.\-]?SPEC[\s*!]*/i, '')
    .replace(/[(（][^()（）]*[가-힣][^()（）]*[)）]/g, '')
    .replace(/\s{2,}/g, ' ').trim();

function systemPrompt(cars) {
    const digest = cars.map((c) =>
        `${c.id}|${displayTitle(c.title)}|${c.price || '$?'}|${c.miles || '?'}mi|${c.category || ''}|${c.transmission || ''}`
    ).join('\n');
    return `You are "Samantha AI", the assistant on samanthausedcar.com — the site of Samantha Kim, a SOFA vehicle specialist selling used cars at Gorilla Motors, minutes from Camp Humphreys, Pyeongtaek, Korea. Buyers are mostly US military / SOFA personnel. Be warm, concise (2-4 sentences), and practical. Reply in English unless the buyer writes Korean.

FACTS you may state (nothing else): every car includes a 1-month engine & transmission warranty, SOFA registration support, free delivery to base, a free loaner car during repairs, and towing/roadside help. Open 7 days: Mon-Fri 9-6, Sat 9-5, Sun 9-4. Contact: phone/WhatsApp +82-10-7170-4513. Never invent specs or history, never negotiate or promise prices/discounts — anything uncertain: "Samantha will confirm."

CONVERSATION FLOW:
1) Learn the buyer's needs — budget, body type (sedan/SUV/minivan/compact), preferred makes, must-haves (US-spec? 7 seats?). Ask at most 1-2 short questions per turn; don't re-ask what they already said.
2) Once you know budget + at least one preference, recommend 3-4 cars from CURRENT INVENTORY below: mostly within budget, plus at most one "stretch pick" about 10-20% above budget (label it and say why it's worth it). Put their numeric ids in card_ids, best match first. In reply give a one-line reason per car using its title (never mention ids). Only use ids that appear in the inventory.
3) If the buyer likes a car or wants to see it, offer: "Want me to pass your info to Samantha on WhatsApp so she can have it ready for you?" Then collect their first name and a preferred time (today PM / tomorrow AM or PM / this weekend / a specific time).
4) When you have name AND time AND the car(s), set handoff.

OUTPUT — strict JSON only, nothing outside the JSON object:
{"reply":"message to the buyer","card_ids":[numbers, max 4, empty if none],"handoff":null or {"ready":true,"name":"...","time":"...","car_ids":[numbers],"budget":"...","note":"one-line buyer summary"}}

Off-topic (not about buying/selling a car with Samantha): steer back politely in one sentence, card_ids [].

CURRENT INVENTORY (id|title|price|miles|category|transmission):
${digest}`;
}

// --- helpers ---
function parseModelJson(text) {
    try { return JSON.parse(text); } catch (e) { /* fall through */ }
    const m = String(text || '').match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e) { /* fall through */ } }
    return { reply: String(text || '').slice(0, 1200), card_ids: [], handoff: null };
}

function buildCards(ids, cars) {
    const out = [];
    for (const id of (Array.isArray(ids) ? ids : []).slice(0, 4)) {
        const car = cars.find((c) => c.id === Number(id));
        if (car) {
            out.push({
                id: car.id,
                title: displayTitle(car.title),
                price: car.price || '',
                miles: car.miles || '',
                image: car.image,
                url: `${SITE}/cars/${car.id}.html`,
            });
        }
    }
    return out;
}

function buildHandoff(h, cars) {
    if (!h || !h.ready || !h.name || !h.time) return null;
    const picked = buildCards(h.car_ids || [], cars);
    const lines = [
        `Hi Samantha! I'm ${h.name}. I talked with the AI assistant on samanthausedcar.com.`,
        picked.length ? 'Interested in:' : null,
        ...picked.map((c) => `- ${c.title} (${c.price}) ${c.url}`),
        h.budget ? `Budget: ${h.budget}` : null,
        `Preferred time: ${h.time}`,
        h.note ? `Notes: ${h.note}` : null,
    ].filter(Boolean);
    return {
        ready: true,
        name: String(h.name).slice(0, 60),
        time: String(h.time).slice(0, 80),
        cars: picked,
        wa_url: `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(lines.join('\n'))}`,
    };
}

// --- naive per-instance rate limit ---
const hits = new Map();
function rateLimited(ip) {
    const now = Date.now();
    const rec = hits.get(ip) || { n: 0, reset: now + 60000 };
    if (now > rec.reset) { rec.n = 0; rec.reset = now + 60000; }
    rec.n += 1;
    hits.set(ip, rec);
    return rec.n > 10;
}

function cors(req, res) {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*'); // curl / server-side tests
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return !origin || ALLOWED_ORIGINS.includes(origin);
}

module.exports = async (req, res) => {
    const originOk = cors(req, res);
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
    if (!originOk) return res.status(403).json({ error: 'origin' });

    if (!process.env.OPENROUTER_API_KEY) {
        return res.status(503).json({ error: 'not_configured' });
    }

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) return res.status(429).json({ error: 'rate_limited' });

    let messages = (req.body && req.body.messages) || [];
    if (!Array.isArray(messages) || !messages.length) {
        return res.status(400).json({ error: 'bad_request' });
    }
    messages = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
        .slice(-12);

    try {
        const cars = await loadCars();
        const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': SITE,
                'X-Title': 'Samantha Used Car AI',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'system', content: systemPrompt(cars) }, ...messages],
                max_tokens: 700,
                temperature: 0.6,
            }),
        });
        if (!r.ok) {
            const detail = await r.text();
            console.error('openrouter', r.status, detail.slice(0, 300));
            return res.status(502).json({ error: 'llm_error' });
        }
        const data = await r.json();
        const raw = data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message.content : '';
        const parsed = parseModelJson(raw);
        return res.status(200).json({
            reply: String(parsed.reply || "Sorry — could you say that again?").slice(0, 2000),
            cards: buildCards(parsed.card_ids, cars),
            handoff: buildHandoff(parsed.handoff, cars),
        });
    } catch (err) {
        console.error('chat error', err && err.message);
        return res.status(500).json({ error: 'server' });
    }
};

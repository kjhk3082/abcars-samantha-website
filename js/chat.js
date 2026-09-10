// Samantha AI — vehicle concierge widget
// Dark-forest glass UI with gold accents (self-contained CSS, no Tailwind dependency).
// Talks to /api/chat (Vercel), renders car cards, hands leads to Samantha's WhatsApp.
(function () {
    const API = window.SAMANTHA_CHAT_API || 'https://abcars-samantha-website.vercel.app/api/chat';
    const IN_CARS = location.pathname.indexOf('/cars/') !== -1;
    const WA_DIRECT = 'https://api.whatsapp.com/send?phone=821071704513';
    const TIME_CHIPS = ['Today PM', 'Tomorrow AM', 'Tomorrow PM', 'This weekend'];
    const TILES = [
        ['🚙', 'SUV under $6,000'],
        ['👨‍👩‍👧', '7-seater family van'],
        ['🦅', 'US-spec sedan'],
        ['💰', 'First car, cheap & solid'],
    ];

    let msgs = [];
    try { msgs = JSON.parse(sessionStorage.getItem('samantha_chat') || '[]'); } catch (e) { msgs = []; }
    let busy = false;

    const esc = function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };
    const track = function (fb, ga) {
        try { if (fb && typeof fbq === 'function') fbq('track', fb); } catch (e) {}
        try { if (ga && typeof gtag === 'function') gtag('event', ga, { page: location.pathname }); } catch (e) {}
    };

    // ---------- styles ----------
    const style = document.createElement('style');
    style.textContent = `
:root{--scg1:#0E1B12;--scg2:#1E3325;--scGold:#D2A867;--scGold2:#B98F52;--scCream:#EFE9DA;--scLine:rgba(239,233,218,.10)}
#sc-fab{position:fixed;right:20px;bottom:${IN_CARS ? '84px' : '20px'};z-index:90;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;
  background:radial-gradient(120% 120% at 30% 20%,#2E4B36 0%,#16281C 70%);
  box-shadow:0 6px 24px rgba(10,20,13,.45),inset 0 0 0 1.5px rgba(210,168,103,.55);
  display:flex;align-items:center;justify-content:center;transition:transform .2s ease,box-shadow .2s ease}
#sc-fab:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(10,20,13,.55),inset 0 0 0 1.5px rgba(210,168,103,.9)}
#sc-fab::after{content:'';position:absolute;inset:-4px;border-radius:50%;border:1.5px solid rgba(210,168,103,.35);animation:sc-halo 2.6s ease-out infinite}
#sc-fab .sc-fab-s{font-family:'Syncopate',sans-serif;font-weight:700;font-size:19px;color:var(--scCream);line-height:1}
#sc-fab .sc-fab-dot{position:absolute;top:5px;right:6px;width:11px;height:11px;border-radius:50%;background:#25D366;border:2.5px solid #16281C}
#sc-fab .sc-fab-label{position:absolute;right:72px;top:50%;transform:translateY(-50%) translateX(6px);opacity:0;pointer-events:none;
  background:#0E1B12;color:var(--scGold);font-family:'Space Grotesk',monospace;font-size:10px;letter-spacing:.14em;font-weight:700;
  padding:8px 12px;border-radius:999px;border:1px solid rgba(210,168,103,.4);white-space:nowrap;transition:all .2s ease}
#sc-fab:hover .sc-fab-label{opacity:1;transform:translateY(-50%) translateX(0)}
@keyframes sc-halo{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.45);opacity:0}}

#sc-panel{position:fixed;right:20px;bottom:20px;z-index:95;width:400px;max-width:calc(100vw - 24px);height:640px;max-height:calc(100vh - 40px);
  display:none;flex-direction:column;overflow:hidden;border-radius:26px;
  background:linear-gradient(160deg,var(--scg2) 0%,var(--scg1) 55%,#0B150E 100%);
  border:1px solid rgba(239,233,218,.12);box-shadow:0 30px 80px rgba(5,12,8,.6),0 4px 18px rgba(5,12,8,.4);
  animation:sc-pop .32s cubic-bezier(.22,1.2,.36,1)}
#sc-panel.sc-on{display:flex}
#sc-panel::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(420px 260px at 85% -5%,rgba(210,168,103,.14),transparent 60%),
             radial-gradient(360px 240px at -10% 110%,rgba(37,211,102,.08),transparent 60%)}
@keyframes sc-pop{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
@media (max-width:639px){#sc-panel{right:0;left:0;bottom:0;width:100%;max-width:100%;height:90vh;border-radius:26px 26px 0 0}}

.sc-head{position:relative;display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid var(--scLine)}
.sc-ava{position:relative;width:42px;height:42px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 32% 28%,#33523D,#152619);box-shadow:inset 0 0 0 1.5px rgba(210,168,103,.55)}
.sc-ava span{font-family:'Syncopate',sans-serif;font-weight:700;font-size:15px;color:var(--scCream)}
.sc-ava i{position:absolute;bottom:0;right:0;width:11px;height:11px;border-radius:50%;background:#25D366;border:2px solid #14231A}
.sc-head-name{font-family:'Syncopate',sans-serif;font-weight:700;font-size:13px;letter-spacing:.02em;color:var(--scCream)}
.sc-head-name b{color:var(--scGold);font-weight:700}
.sc-head-sub{font-family:'Space Grotesk',monospace;font-size:9px;letter-spacing:.18em;color:rgba(239,233,218,.5);margin-top:3px}
.sc-head-sub em{color:#3fd97c;font-style:normal}
.sc-hbtn{background:none;border:1px solid var(--scLine);color:rgba(239,233,218,.55);border-radius:999px;cursor:pointer;
  font-family:'Space Grotesk',monospace;transition:all .15s ease}
.sc-hbtn:hover{color:var(--scCream);border-color:rgba(210,168,103,.5)}
.sc-hbtn.sc-reset{font-size:9px;letter-spacing:.12em;padding:7px 11px}
.sc-hbtn.sc-x{font-size:13px;width:30px;height:30px;padding:0}

#sc-msgs{position:relative;flex:1;overflow-y:auto;padding:18px 14px 10px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
#sc-msgs::-webkit-scrollbar{width:4px}
#sc-msgs::-webkit-scrollbar-thumb{background:rgba(210,168,103,.35);border-radius:2px}

.sc-hero{margin:auto 0;text-align:center;padding:12px 10px 4px;animation:sc-rise .4s ease-out}
.sc-orb{position:relative;width:76px;height:76px;margin:0 auto 18px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 32% 26%,#395843,#16281C);box-shadow:inset 0 0 0 1.5px rgba(210,168,103,.6),0 0 44px rgba(63,217,124,.22),0 0 90px rgba(210,168,103,.14)}
.sc-orb span{font-family:'Syncopate',sans-serif;font-weight:700;font-size:27px;color:var(--scCream)}
.sc-orb::after{content:'';position:absolute;inset:-9px;border-radius:50%;border:1px solid rgba(210,168,103,.28);animation:sc-halo 3s ease-out infinite}
.sc-hero h3{font-family:'Syncopate',sans-serif;font-size:15px;font-weight:700;color:var(--scCream);margin:0 0 7px;letter-spacing:.01em}
.sc-hero p{font-family:'Space Grotesk',sans-serif;font-size:11.5px;line-height:1.65;color:rgba(239,233,218,.55);margin:0 auto 18px;max-width:270px}
.sc-tiles{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 4px}
.sc-tile{display:flex;flex-direction:column;align-items:flex-start;gap:7px;padding:12px 13px;border-radius:16px;cursor:pointer;text-align:left;
  background:rgba(239,233,218,.045);border:1px solid var(--scLine);transition:all .18s ease}
.sc-tile:hover{background:rgba(210,168,103,.12);border-color:rgba(210,168,103,.45);transform:translateY(-2px)}
.sc-tile b{font-size:17px;line-height:1}
.sc-tile span{font-family:'Space Grotesk',sans-serif;font-size:10.5px;font-weight:600;color:var(--scCream);line-height:1.35}
@keyframes sc-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

.sc-row{display:flex;gap:9px;align-items:flex-end;animation:sc-rise .26s ease-out}
.sc-row.sc-user{justify-content:flex-end}
.sc-mava{width:28px;height:28px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 32% 28%,#33523D,#152619);box-shadow:inset 0 0 0 1px rgba(210,168,103,.5)}
.sc-mava span{font-family:'Syncopate',sans-serif;font-weight:700;font-size:10px;color:var(--scCream)}
.sc-bub{max-width:80%;padding:11px 14px;font-family:'Space Grotesk',sans-serif;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word}
.sc-bub.sc-bot{background:rgba(239,233,218,.06);border:1px solid var(--scLine);color:var(--scCream);border-radius:16px 16px 16px 5px}
.sc-bub.sc-usr{background:linear-gradient(135deg,var(--scGold),var(--scGold2));color:#182518;font-weight:600;border-radius:16px 16px 5px 16px;
  box-shadow:0 4px 14px rgba(210,168,103,.25)}

.sc-typing{display:flex;gap:5px;padding:13px 15px}
.sc-typing i{width:6px;height:6px;border-radius:50%;background:var(--scGold);animation:sc-dot 1.15s infinite}
.sc-typing i:nth-child(2){animation-delay:.14s}.sc-typing i:nth-child(3){animation-delay:.28s}
@keyframes sc-dot{0%,60%,100%{transform:translateY(0);opacity:.3}30%{transform:translateY(-4px);opacity:1}}

.sc-cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 8px 37px;scroll-snap-type:x mandatory;animation:sc-rise .3s ease-out}
.sc-cards::-webkit-scrollbar{height:4px}
.sc-cards::-webkit-scrollbar-thumb{background:rgba(210,168,103,.35);border-radius:2px}
.sc-card{scroll-snap-align:start;flex:none;width:178px;border-radius:16px;overflow:hidden;text-decoration:none;background:#FBFAF6;
  border:1px solid rgba(239,233,218,.2);transition:transform .2s ease,box-shadow .2s ease}
.sc-card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(0,0,0,.45),0 0 0 1.5px var(--scGold)}
.sc-card img{width:100%;height:96px;object-fit:cover;display:block}
.sc-card .sc-ci{padding:10px 12px 11px}
.sc-card .sc-ct{font-family:'Space Grotesk',sans-serif;font-size:10.5px;font-weight:700;color:#152017;line-height:1.35;margin:0 0 6px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sc-card .sc-cp{display:flex;align-items:baseline;justify-content:space-between;gap:6px}
.sc-card .sc-cp b{font-family:'Syncopate',sans-serif;font-size:13px;color:#1F3A29}
.sc-card .sc-cp span{font-family:'Space Grotesk',monospace;font-size:8.5px;letter-spacing:.06em;color:#8a8a80}
.sc-card .sc-view{display:block;margin:0 12px 11px;text-align:center;font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;
  letter-spacing:.14em;color:#1F3A29;border:1px solid rgba(31,58,41,.25);border-radius:999px;padding:6px 0}
.sc-card:hover .sc-view{background:#1F3A29;color:#EFE9DA}

.sc-handoff{margin-left:37px;border-radius:18px;padding:15px;animation:sc-rise .3s ease-out;
  background:linear-gradient(135deg,rgba(210,168,103,.18),rgba(210,168,103,.08));border:1px solid rgba(210,168,103,.4)}
.sc-handoff h4{font-family:'Syncopate',sans-serif;font-size:10.5px;color:var(--scGold);margin:0 0 6px;letter-spacing:.05em}
.sc-handoff p{font-family:'Space Grotesk',sans-serif;font-size:10.5px;line-height:1.6;color:rgba(239,233,218,.7);margin:0 0 11px}
.sc-wa{display:block;text-align:center;background:#25D366;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;
  border-radius:999px;padding:12px 0;text-decoration:none;box-shadow:0 6px 18px rgba(37,211,102,.3);transition:filter .15s ease}
.sc-wa:hover{filter:brightness(1.08)}
.sc-handoff small{display:block;text-align:center;font-family:'Space Grotesk',monospace;font-size:7.5px;letter-spacing:.16em;color:rgba(210,168,103,.8);margin-top:9px}

.sc-fallback{margin-left:37px;display:flex;gap:8px;animation:sc-rise .3s ease-out}
.sc-fallback a{flex:1;text-align:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:10px;border-radius:999px;padding:10px 0;text-decoration:none}
.sc-fallback .sc-call{background:var(--scCream);color:#15201a}
.sc-fallback .sc-wa2{background:#25D366;color:#fff}

#sc-chips{display:flex;flex-wrap:wrap;gap:7px;padding:4px 14px 8px}
#sc-chips button{font-family:'Space Grotesk',monospace;font-size:10px;font-weight:600;color:var(--scGold);cursor:pointer;
  background:rgba(210,168,103,.07);border:1px solid rgba(210,168,103,.35);border-radius:999px;padding:7px 13px;transition:all .15s ease}
#sc-chips button:hover{background:var(--scGold);color:#182518}

.sc-dock{display:flex;align-items:center;gap:9px;padding:11px 14px 15px}
#sc-input{flex:1;background:rgba(239,233,218,.06);border:1px solid var(--scLine);border-radius:999px;padding:13px 18px;outline:none;
  font-family:'Space Grotesk',sans-serif;font-size:12px;color:var(--scCream);transition:border-color .15s ease,background .15s ease}
#sc-input::placeholder{color:rgba(239,233,218,.35)}
#sc-input:focus{border-color:rgba(210,168,103,.6);background:rgba(239,233,218,.09)}
#sc-send{width:46px;height:46px;flex:none;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--scGold),var(--scGold2));color:#182518;box-shadow:0 5px 16px rgba(210,168,103,.35);transition:transform .15s ease,filter .15s ease}
#sc-send:hover{transform:scale(1.06);filter:brightness(1.05)}
#sc-send:active{transform:scale(.96)}
`;
    document.head.appendChild(style);

    // ---------- DOM ----------
    const root = document.createElement('div');
    root.innerHTML = ''
        + '<button id="sc-fab" type="button" aria-label="Chat with Samantha AI">'
        + '  <span class="sc-fab-s">S</span><span class="sc-fab-dot"></span>'
        + '  <span class="sc-fab-label">FIND MY CAR · AI</span>'
        + '</button>'
        + '<div id="sc-panel" role="dialog" aria-label="Samantha AI chat">'
        + '  <div class="sc-head">'
        + '    <div class="sc-ava"><span>S</span><i></i></div>'
        + '    <div style="flex:1">'
        + '      <div class="sc-head-name">SAMANTHA <b>AI</b></div>'
        + '      <div class="sc-head-sub"><em>●</em> ONLINE · VEHICLE CONCIERGE · CAMP HUMPHREYS</div>'
        + '    </div>'
        + '    <button id="sc-clear" type="button" class="sc-hbtn sc-reset" title="New chat">RESET</button>'
        + '    <button id="sc-close" type="button" class="sc-hbtn sc-x" aria-label="Close">✕</button>'
        + '  </div>'
        + '  <div id="sc-msgs"></div>'
        + '  <div id="sc-chips"></div>'
        + '  <div class="sc-dock">'
        + '    <input id="sc-input" type="text" maxlength="500" placeholder="Tell me budget, type, must-haves…">'
        + '    <button id="sc-send" type="button" aria-label="Send">'
        + '      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>'
        + '    </button>'
        + '  </div>'
        + '</div>';
    document.body.appendChild(root);

    const panel = document.getElementById('sc-panel');
    const fab = document.getElementById('sc-fab');
    const msgsBox = document.getElementById('sc-msgs');
    const chipsBox = document.getElementById('sc-chips');
    const input = document.getElementById('sc-input');

    function save() {
        try { sessionStorage.setItem('samantha_chat', JSON.stringify(msgs.slice(-30))); } catch (e) {}
    }

    const AVA = '<div class="sc-mava"><span>S</span></div>';

    function heroHtml() {
        const h = new Date().getHours();
        const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
        return '<div class="sc-hero">'
            + '<div class="sc-orb"><span>S</span></div>'
            + '<h3>' + hello + ' 👋</h3>'
            + '<p>I\'m Samantha\'s AI concierge. Tell me your budget and what you need — I\'ll match you with cars on our lot right now, then hand you to Samantha on WhatsApp.</p>'
            + '<div class="sc-tiles">' + TILES.map(function (t) {
                return '<button type="button" class="sc-tile" data-sc-chip="' + esc(t[1]) + '"><b>' + t[0] + '</b><span>' + esc(t[1]) + '</span></button>';
            }).join('') + '</div>'
            + '</div>';
    }

    function rowHtml(m) {
        if (m.role === 'user') {
            return '<div class="sc-row sc-user"><div class="sc-bub sc-usr">' + esc(m.content) + '</div></div>';
        }
        return '<div class="sc-row">' + AVA + '<div class="sc-bub sc-bot">' + esc(m.content) + '</div></div>';
    }

    function cardsHtml(cards) {
        return '<div class="sc-cards">' + cards.map(function (c) {
            return '<a class="sc-card" href="' + esc(c.url) + '" target="_blank" rel="noopener">'
                + '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy">'
                + '<div class="sc-ci"><p class="sc-ct">' + esc(c.title) + '</p>'
                + '<div class="sc-cp"><b>' + esc(c.price) + '</b>' + (c.miles ? '<span>' + esc(c.miles) + ' MI</span>' : '') + '</div></div>'
                + '<span class="sc-view">VIEW DETAILS →</span>'
                + '</a>';
        }).join('') + '</div>';
    }

    function handoffHtml(h) {
        return '<div class="sc-handoff">'
            + '<h4>✦ READY FOR SAMANTHA</h4>'
            + '<p>Your picks, budget and time are packed into one message — tap below, review it, and hit send in WhatsApp.</p>'
            + '<a class="sc-wa" href="' + esc(h.wa_url) + '" target="_blank" rel="noopener" data-sc-lead>💬 &nbsp;SEND TO SAMANTHA</a>'
            + '<small>SHE REPLIES DURING BUSINESS HOURS · OPEN 7 DAYS</small>'
            + '</div>';
    }

    function fallbackHtml() {
        return '<div class="sc-fallback">'
            + '<a class="sc-call" href="tel:01071704513">📞 CALL</a>'
            + '<a class="sc-wa2" href="' + WA_DIRECT + '" target="_blank" rel="noopener">💬 WHATSAPP</a>'
            + '</div>';
    }

    function render(extraChips) {
        let html = '';
        if (!msgs.length && !busy) {
            html = heroHtml();
        } else {
            msgs.forEach(function (m) {
                html += rowHtml(m);
                if (m.cards && m.cards.length) html += cardsHtml(m.cards);
                if (m.handoff) html += handoffHtml(m.handoff);
                if (m.fallback) html += fallbackHtml();
            });
            if (busy) html += '<div class="sc-row">' + AVA + '<div class="sc-bub sc-bot sc-typing"><i></i><i></i><i></i></div></div>';
        }
        msgsBox.innerHTML = html;
        msgsBox.scrollTop = msgsBox.scrollHeight;

        const chips = (msgs.length && extraChips) ? extraChips : [];
        chipsBox.innerHTML = chips.map(function (c) {
            return '<button type="button" data-sc-chip="' + esc(c) + '">' + esc(c) + '</button>';
        }).join('');
        chipsBox.style.display = chips.length ? '' : 'none';
    }

    async function send(text) {
        text = (text || '').trim();
        if (!text || busy) return;
        msgs.push({ role: 'user', content: text });
        busy = true;
        input.value = '';
        save();
        render();
        try {
            const r = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: msgs.map(function (m) { return { role: m.role, content: m.content }; }) }),
            });
            busy = false;
            if (!r.ok) {
                msgs.push({
                    role: 'assistant',
                    content: r.status === 429
                        ? 'Lots of chats right now — give me a minute and try again, or reach Samantha directly:'
                        : "I'm having a moment 😅 — you can reach Samantha directly while I recover:",
                    fallback: true,
                });
                save(); render();
                return;
            }
            const data = await r.json();
            const m = { role: 'assistant', content: data.reply || '…' };
            if (data.cards && data.cards.length) m.cards = data.cards;
            if (data.handoff && data.handoff.ready) m.handoff = data.handoff;
            msgs.push(m);
            save();
            const askTime = !m.handoff && /\b(time|when|schedule|available)\b/i.test(m.content);
            render(askTime ? TIME_CHIPS : null);
        } catch (e) {
            busy = false;
            msgs.push({ role: 'assistant', content: 'Connection hiccup — reach Samantha directly, or try again:', fallback: true });
            save(); render();
        }
    }

    // ---------- events ----------
    fab.addEventListener('click', function () {
        panel.classList.add('sc-on');
        fab.style.display = 'none';
        track(null, 'chat_open');
        render();
        if (window.matchMedia('(min-width: 640px)').matches) input.focus();
    });
    document.getElementById('sc-close').addEventListener('click', function () {
        panel.classList.remove('sc-on');
        fab.style.display = '';
    });
    document.getElementById('sc-clear').addEventListener('click', function () {
        msgs = [];
        save();
        render();
    });
    document.getElementById('sc-send').addEventListener('click', function () { send(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });
    panel.addEventListener('click', function (e) {
        const chip = e.target.closest('[data-sc-chip]');
        if (chip) send(chip.getAttribute('data-sc-chip'));
        if (e.target.closest('[data-sc-lead]')) track('Lead', 'chat_lead');
    });
})();

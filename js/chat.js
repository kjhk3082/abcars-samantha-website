// Samantha AI — chat widget, designed as a native extension of the site's
// editorial system: paper white, black hairlines, Syncopate display, mono labels,
// single blue accent (#0047FF), inventory-card grammar. Self-contained CSS.
(function () {
    const API = window.SAMANTHA_CHAT_API || 'https://abcars-samantha-website.vercel.app/api/chat';
    const IN_CARS = location.pathname.indexOf('/cars/') !== -1;
    const WA_DIRECT = 'https://api.whatsapp.com/send?phone=821071704513';
    const TIME_CHIPS = ['TODAY PM', 'TOMORROW AM', 'TOMORROW PM', 'THIS WEEKEND'];
    const STARTERS = ['SUV UNDER $6,000', 'FAMILY MINIVAN', 'US-SPEC SEDAN', 'CHEAP FIRST CAR'];

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
#sc-fab{position:fixed;right:20px;bottom:${IN_CARS ? '86px' : '20px'};z-index:90;display:flex;align-items:center;gap:11px;
  background:#111;color:#fff;border:none;cursor:pointer;border-radius:999px;padding:18px 26px;
  font-family:'Space Grotesk',monospace;font-size:12.5px;font-weight:700;letter-spacing:.14em;
  box-shadow:0 12px 34px rgba(0,0,0,.26);transition:background .18s ease,transform .18s ease}
#sc-fab:hover{background:#0047FF;transform:translateY(-2px)}
#sc-fab .sc-dot{width:8px;height:8px;border-radius:50%;background:#0047FF;transition:background .18s ease}
#sc-fab:hover .sc-dot{background:#fff}
#sc-teaser{position:fixed;right:20px;bottom:${IN_CARS ? '158px' : '92px'};z-index:89;max-width:250px;background:#fff;
  border:1px solid rgba(0,0,0,.15);border-radius:14px 14px 4px 14px;padding:13px 15px;cursor:pointer;
  box-shadow:0 14px 36px rgba(0,0,0,.18);animation:sc-teaser-in .4s cubic-bezier(.22,1,.36,1)}
#sc-teaser p{font-family:'Space Grotesk',monospace;font-size:10.5px;line-height:1.65;color:#111;margin:0}
#sc-teaser b{color:#0047FF}
#sc-teaser .sc-t-x{position:absolute;top:-9px;left:-9px;width:21px;height:21px;background:#111;color:#fff;
  border-radius:50%;border:none;font-size:9px;font-weight:700;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}
#sc-teaser .sc-t-x:hover{background:#0047FF}
@keyframes sc-teaser-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

#sc-panel{position:fixed;right:20px;bottom:20px;z-index:95;width:396px;max-width:calc(100vw - 24px);height:632px;max-height:calc(100vh - 40px);
  display:none;flex-direction:column;overflow:hidden;background:#F2F2F2;border:1px solid rgba(0,0,0,.15);border-radius:20px;
  box-shadow:0 32px 80px rgba(0,0,0,.28),0 4px 16px rgba(0,0,0,.12);animation:sc-pop .24s cubic-bezier(.22,1,.36,1)}
#sc-panel.sc-on{display:flex}
@keyframes sc-pop{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (max-width:639px){#sc-panel{right:0;left:0;bottom:0;width:100%;max-width:100%;height:90vh;border-radius:20px 20px 0 0;border-left:none;border-right:none;border-bottom:none}}

.sc-head{background:#fff;padding:18px 18px 0;flex:none}
.sc-head-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.sc-title{font-family:'Syncopate',sans-serif;font-weight:700;font-size:17px;letter-spacing:-.02em;color:#111;text-transform:uppercase;line-height:1}
.sc-title i{font-style:normal;color:#0047FF}
.sc-meta{font-family:'Space Grotesk',monospace;font-size:8.5px;font-weight:700;letter-spacing:.22em;color:#8b8b85;margin-top:7px;text-transform:uppercase}
.sc-meta b{color:#0047FF;font-weight:700}
.sc-actions{display:flex;gap:6px;flex:none}
.sc-hbtn{background:none;border:1px solid rgba(0,0,0,.2);color:#111;border-radius:999px;cursor:pointer;
  font-family:'Space Grotesk',monospace;font-weight:700;transition:all .15s ease}
.sc-hbtn:hover{background:#111;color:#fff;border-color:#111}
.sc-reset{font-size:8.5px;letter-spacing:.14em;padding:7px 11px}
.sc-x{font-size:12px;width:28px;height:28px;padding:0;line-height:1}
.sc-rule{border-bottom:2px solid #111;margin-top:14px}

#sc-msgs{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
#sc-msgs::-webkit-scrollbar{width:4px}
#sc-msgs::-webkit-scrollbar-thumb{background:rgba(0,0,0,.2);border-radius:2px}

.sc-hero{margin:auto 0;padding:6px 6px 12px;animation:sc-rise .3s ease-out}
.sc-hero-kicker{font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;letter-spacing:.24em;color:#0047FF;margin-bottom:12px}
.sc-hero h3{font-family:'Syncopate',sans-serif;font-weight:700;font-size:26px;line-height:1.02;letter-spacing:-.02em;color:#111;margin:0 0 14px;text-transform:uppercase}
.sc-hero h3 i{font-style:normal;color:#0047FF}
.sc-hero p{font-family:'Space Grotesk',monospace;font-size:10.5px;line-height:1.7;color:#6b6b66;margin:0 0 18px;max-width:300px}
.sc-hero-rule{border-bottom:1px solid rgba(0,0,0,.35);margin-bottom:14px}
.sc-starters{display:flex;flex-direction:column}
.sc-starter{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;background:none;border:none;
  border-bottom:1px solid rgba(0,0,0,.12);cursor:pointer;padding:13px 2px;text-align:left;transition:padding .15s ease}
.sc-starter .sc-sn{font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;color:#0047FF;width:22px;flex:none}
.sc-starter .sc-sl{flex:1;font-family:'Space Grotesk',monospace;font-size:11px;font-weight:700;letter-spacing:.08em;color:#111}
.sc-starter .sc-sa{font-size:13px;color:#111;opacity:0;transform:translateX(-6px);transition:all .15s ease}
.sc-starter:hover{padding-left:8px}
.sc-starter:hover .sc-sa{opacity:1;transform:none;color:#0047FF}
@keyframes sc-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.sc-row{display:flex;animation:sc-rise .2s ease-out}
.sc-row.sc-user{justify-content:flex-end}
.sc-bub{max-width:84%;padding:11px 14px;font-family:'Space Grotesk',sans-serif;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;border-radius:14px}
.sc-bub.sc-bot{background:#fff;border:1px solid rgba(0,0,0,.08);color:#111;border-bottom-left-radius:4px}
.sc-bub.sc-usr{background:#111;color:#fff;border-bottom-right-radius:4px}
.sc-tag{font-family:'Space Grotesk',monospace;font-size:8px;font-weight:700;letter-spacing:.2em;color:#8b8b85;margin:2px 2px 4px;text-transform:uppercase}
.sc-tag.sc-tr{text-align:right}

.sc-typing{display:flex;gap:4px;padding:13px 15px}
.sc-typing i{width:5px;height:5px;border-radius:50%;background:#111;animation:sc-dotb 1.1s infinite}
.sc-typing i:nth-child(2){animation-delay:.13s}.sc-typing i:nth-child(3){animation-delay:.26s}
@keyframes sc-dotb{0%,60%,100%{transform:translateY(0);opacity:.25}30%{transform:translateY(-3px);opacity:1}}

.sc-cards{display:flex;gap:10px;overflow-x:auto;padding:2px 2px 10px;scroll-snap-type:x mandatory;animation:sc-rise .25s ease-out}
.sc-cards::-webkit-scrollbar{height:4px}
.sc-cards::-webkit-scrollbar-thumb{background:rgba(0,0,0,.2);border-radius:2px}
.sc-card{scroll-snap-align:start;flex:none;width:176px;background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:12px;overflow:hidden;
  text-decoration:none;transition:border-color .15s ease,transform .15s ease}
.sc-card:hover{border-color:#0047FF;transform:translateY(-2px)}
.sc-card img{width:100%;height:94px;object-fit:cover;display:block}
.sc-ci{padding:10px 12px 12px}
.sc-ct-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px}
.sc-ct{font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:700;color:#111;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sc-cn{font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;color:#0047FF;flex:none}
.sc-cp{display:flex;align-items:baseline;justify-content:space-between;gap:6px}
.sc-cp b{font-family:'Syncopate',sans-serif;font-size:12.5px;font-weight:700;color:#111}
.sc-cp span{font-family:'Space Grotesk',monospace;font-size:8px;letter-spacing:.06em;color:#8b8b85}
.sc-cv{display:block;border-top:1px solid rgba(0,0,0,.08);padding:8px 12px;font-family:'Space Grotesk',monospace;
  font-size:8.5px;font-weight:700;letter-spacing:.18em;color:#8b8b85;transition:color .15s ease}
.sc-card:hover .sc-cv{color:#0047FF}

.sc-handoff{background:#111;border-radius:14px;padding:16px;animation:sc-rise .25s ease-out}
.sc-handoff h4{font-family:'Syncopate',sans-serif;font-size:11px;font-weight:700;color:#fff;margin:0 0 4px;text-transform:uppercase}
.sc-handoff h4 i{font-style:normal;color:#0047FF}
.sc-handoff p{font-family:'Space Grotesk',monospace;font-size:10px;line-height:1.65;color:rgba(255,255,255,.6);margin:0 0 12px}
.sc-wa{display:block;text-align:center;background:#25D366;color:#fff;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:12px;
  letter-spacing:.04em;border-radius:999px;padding:13px 0;text-decoration:none;transition:filter .15s ease}
.sc-wa:hover{filter:brightness(1.08)}
.sc-handoff small{display:block;font-family:'Space Grotesk',monospace;font-size:7.5px;letter-spacing:.2em;color:rgba(255,255,255,.35);margin-top:10px;text-align:center;text-transform:uppercase}

.sc-fallback{display:flex;gap:8px;animation:sc-rise .25s ease-out}
.sc-fallback a{flex:1;text-align:center;font-family:'Space Grotesk',monospace;font-weight:700;font-size:9.5px;letter-spacing:.12em;
  border-radius:999px;padding:11px 0;text-decoration:none;transition:all .15s ease}
.sc-call{background:#111;color:#fff}.sc-call:hover{background:#0047FF}
.sc-wa2{background:#25D366;color:#fff}

#sc-chips{display:flex;flex-wrap:wrap;gap:6px;padding:2px 14px 8px}
#sc-chips button{font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;letter-spacing:.1em;color:#111;cursor:pointer;
  background:#fff;border:1px solid rgba(0,0,0,.2);border-radius:999px;padding:8px 13px;transition:all .15s ease}
#sc-chips button:hover{background:#111;color:#fff;border-color:#111}

.sc-form{background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:14px;padding:4px 14px 14px;animation:sc-rise .25s ease-out}
.sc-fl{font-family:'Space Grotesk',monospace;font-size:8px;font-weight:700;letter-spacing:.18em;color:#8b8b85;margin:12px 2px 6px;display:flex;align-items:center;gap:7px;text-transform:uppercase}
.sc-fl b{color:#0047FF}
.sc-fl i{color:#e03131;font-style:normal}
.sc-fi{width:100%;box-sizing:border-box;background:#F2F2F2;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:11px 13px;outline:none;
  font-family:'Space Grotesk',monospace;font-size:11.5px;color:#111;transition:border-color .15s ease,background .15s ease}
.sc-fi::placeholder{color:#a3a39d}
.sc-fi:focus{border-color:#111;background:#fff}
.sc-fi.sc-err{border-color:#e03131}
.sc-ftimes{display:flex;flex-wrap:wrap;gap:6px}
.sc-ft{font-family:'Space Grotesk',monospace;font-size:9px;font-weight:700;letter-spacing:.08em;background:#fff;color:#111;
  border:1px solid rgba(0,0,0,.2);border-radius:999px;padding:7px 12px;cursor:pointer;transition:all .15s ease}
.sc-ft:hover{border-color:#111}
.sc-ft.sc-onft{background:#111;color:#fff;border-color:#111}
.sc-fsub{width:100%;margin-top:14px;background:#111;color:#fff;border:none;border-radius:999px;padding:13px 0;
  font-family:'Space Grotesk',monospace;font-size:10px;font-weight:700;letter-spacing:.16em;cursor:pointer;transition:background .15s ease}
.sc-fsub:hover{background:#0047FF}
.sc-fnote{font-family:'Space Grotesk',monospace;font-size:7.5px;letter-spacing:.14em;color:#a3a39d;text-align:center;margin-top:9px;text-transform:uppercase}
.sc-dock{flex:none;background:#fff;border-top:1px solid rgba(0,0,0,.1);padding:12px 14px;display:flex;align-items:center;gap:9px}
#sc-input{flex:1;background:#F2F2F2;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:13px 18px;outline:none;
  font-family:'Space Grotesk',monospace;font-size:11.5px;color:#111;transition:border-color .15s ease,background .15s ease}
#sc-input::placeholder{color:#a3a39d;letter-spacing:.02em}
#sc-input:focus{border-color:#111;background:#fff}
#sc-send{width:44px;height:44px;flex:none;border-radius:50%;border:none;cursor:pointer;background:#111;color:#fff;
  display:flex;align-items:center;justify-content:center;transition:background .15s ease,transform .1s ease}
#sc-send:hover{background:#0047FF}
#sc-send:active{transform:scale(.94)}
`;
    document.head.appendChild(style);

    // ---------- DOM ----------
    const root = document.createElement('div');
    root.innerHTML = ''
        + '<button id="sc-fab" type="button" aria-label="Chat with Samantha AI"><span class="sc-dot"></span>ASK AI</button>'
        + '<div id="sc-panel" role="dialog" aria-label="Samantha AI chat">'
        + '  <div class="sc-head">'
        + '    <div class="sc-head-top">'
        + '      <div>'
        + '        <div class="sc-title">Samantha AI<i>.</i></div>'
        + '        <div class="sc-meta"><b>●</b> Live inventory · Camp Humphreys</div>'
        + '      </div>'
        + '      <div class="sc-actions">'
        + '        <button id="sc-clear" type="button" class="sc-hbtn sc-reset" title="New chat">RESET</button>'
        + '        <button id="sc-close" type="button" class="sc-hbtn sc-x" aria-label="Close">✕</button>'
        + '      </div>'
        + '    </div>'
        + '    <div class="sc-rule"></div>'
        + '  </div>'
        + '  <div id="sc-msgs"></div>'
        + '  <div id="sc-chips"></div>'
        + '  <div class="sc-dock">'
        + '    <input id="sc-input" type="text" maxlength="500" placeholder="BUDGET, TYPE, MUST-HAVES…">'
        + '    <button id="sc-send" type="button" aria-label="Send">'
        + '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>'
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

    function heroHtml() {
        return '<div class="sc-hero">'
            + '<p class="sc-hero-kicker">AI CAR MATCH — 24/7</p>'
            + '<h3>Find<br>your car<i>.</i></h3>'
            + '<p>Tell me your budget and what you need it for. I match you from the cars on our lot right now, then hand you to Samantha on WhatsApp.</p>'
            + '<div class="sc-hero-rule"></div>'
            + '<div class="sc-starters">' + STARTERS.map(function (s, i) {
                return '<button type="button" class="sc-starter" data-sc-chip="' + esc(s) + '">'
                    + '<span class="sc-sn">0' + (i + 1) + '</span>'
                    + '<span class="sc-sl">' + esc(s) + '</span>'
                    + '<span class="sc-sa">→</span></button>';
            }).join('') + '</div>'
            + '</div>';
    }

    function rowHtml(m, i, arr) {
        const prev = arr[i - 1];
        const firstOfGroup = !prev || prev.role !== m.role;
        let html = '';
        if (m.role === 'user') {
            if (firstOfGroup) html += '<div class="sc-tag sc-tr">You</div>';
            html += '<div class="sc-row sc-user"><div class="sc-bub sc-usr">' + esc(m.content) + '</div></div>';
        } else {
            if (firstOfGroup) html += '<div class="sc-tag">Samantha AI</div>';
            html += '<div class="sc-row"><div class="sc-bub sc-bot">' + esc(m.content) + '</div></div>';
        }
        return html;
    }

    function cardsHtml(cards) {
        return '<div class="sc-cards">' + cards.map(function (c, i) {
            return '<a class="sc-card" href="' + esc(c.url) + '" target="_blank" rel="noopener">'
                + '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy">'
                + '<div class="sc-ci">'
                + '<div class="sc-ct-row"><span class="sc-ct">' + esc(c.title) + '</span><span class="sc-cn">0' + (i + 1) + '</span></div>'
                + '<div class="sc-cp"><b>' + esc(c.price) + '</b>' + (c.miles ? '<span>' + esc(c.miles) + ' MILES</span>' : '') + '</div>'
                + '</div>'
                + '<span class="sc-cv">VIEW DETAILS →</span>'
                + '</a>';
        }).join('') + '</div>';
    }

    function handoffHtml(h) {
        return '<div class="sc-handoff">'
            + '<h4>Ready for Samantha<i>.</i></h4>'
            + '<p>Your picks, budget and preferred time are packed into one message. Tap, review, hit send in WhatsApp.</p>'
            + '<a class="sc-wa" href="' + esc(h.wa_url) + '" target="_blank" rel="noopener" data-sc-lead>💬&ensp;SEND TO SAMANTHA</a>'
            + '<small>Replies in business hours · Open 7 days</small>'
            + '</div>';
    }

    function fallbackHtml() {
        return '<div class="sc-fallback">'
            + '<a class="sc-call" href="tel:01071704513">📞 CALL</a>'
            + '<a class="sc-wa2" href="' + WA_DIRECT + '" target="_blank" rel="noopener">💬 WHATSAPP</a>'
            + '</div>';
    }

    function formHtml() {
        return '<div class="sc-form">'
            + '<div class="sc-fl"><b>01</b> NAME <i>*</i></div>'
            + '<input class="sc-fi" id="sc-f-name" type="text" maxlength="40" placeholder="Your first name" autocomplete="name">'
            + '<div class="sc-fl"><b>02</b> PHONE — OPTIONAL, FOR A DIRECT CALL / TEXT</div>'
            + '<input class="sc-fi" id="sc-f-phone" type="tel" maxlength="20" placeholder="010-1234-5678" autocomplete="tel">'
            + '<div class="sc-fl"><b>03</b> WHEN WORKS FOR YOU?</div>'
            + '<div class="sc-ftimes">' + TIME_CHIPS.map(function (t) {
                return '<button type="button" class="sc-ft" data-sc-time="' + esc(t) + '">' + esc(t) + '</button>';
            }).join('') + '</div>'
            + '<button type="button" class="sc-fsub" id="sc-f-sub">SEND MY INFO TO SAMANTHA →</button>'
            + '<div class="sc-fnote">Goes only to Samantha — via your own WhatsApp message</div>'
            + '</div>';
    }

    function submitForm() {
        const nameEl = document.getElementById('sc-f-name');
        if (!nameEl) return;
        const name = nameEl.value.trim();
        if (!name) {
            nameEl.classList.add('sc-err');
            nameEl.focus();
            return;
        }
        const phone = (document.getElementById('sc-f-phone').value || '').replace(/[^0-9+\-() ]/g, '').trim();
        const timeEl = document.querySelector('.sc-ft.sc-onft');
        const time = timeEl ? timeEl.getAttribute('data-sc-time') : 'Flexible';
        track(null, 'lead_form_submit');
        send('CONTACT FORM → Name: ' + name + ' · Phone: ' + (phone || '—') + ' · Time: ' + time);
    }

    function render(extraChips) {
        let html = '';
        if (!msgs.length && !busy) {
            html = heroHtml();
        } else {
            msgs.forEach(function (m, i, arr) {
                html += rowHtml(m, i, arr);
                if (m.cards && m.cards.length) html += cardsHtml(m.cards);
                if (m.handoff) html += handoffHtml(m.handoff);
                if (m.fallback) html += fallbackHtml();
                if (m.ask === 'contact' && i === arr.length - 1 && !busy) html += formHtml();
            });
            if (busy) html += '<div class="sc-row"><div class="sc-bub sc-bot sc-typing"><i></i><i></i><i></i></div></div>';
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
                        : "I'm having a moment — you can reach Samantha directly while I recover:",
                    fallback: true,
                });
                save(); render();
                return;
            }
            const data = await r.json();
            const m = { role: 'assistant', content: data.reply || '…' };
            if (data.cards && data.cards.length) m.cards = data.cards;
            if (data.handoff && data.handoff.ready) m.handoff = data.handoff;
            if (data.ask === 'contact' && !m.handoff) m.ask = 'contact';
            msgs.push(m);
            save();
            const askTime = !m.handoff && !m.ask && /\b(time|when|schedule|available)\b/i.test(m.content);
            render(askTime ? TIME_CHIPS : null);
            if (m.ask) {
                const nameEl = document.getElementById('sc-f-name');
                if (nameEl && window.matchMedia('(min-width: 640px)').matches) nameEl.focus();
            }
        } catch (e) {
            busy = false;
            msgs.push({ role: 'assistant', content: 'Connection hiccup — reach Samantha directly, or try again:', fallback: true });
            save(); render();
        }
    }

    // ---------- teaser bubble (once per session) ----------
    let teaser = null;
    function hideTeaser(remember) {
        if (teaser) { teaser.remove(); teaser = null; }
        if (remember) {
            try { sessionStorage.setItem('samantha_chat_teaser', '1'); } catch (e) {}
        }
    }
    function showTeaser() {
        let seen = null;
        try { seen = sessionStorage.getItem('samantha_chat_teaser'); } catch (e) {}
        if (seen || msgs.length || panel.classList.contains('sc-on')) return;
        teaser = document.createElement('div');
        teaser.id = 'sc-teaser';
        teaser.innerHTML = '<button type="button" class="sc-t-x" aria-label="Dismiss">✕</button>'
            + '<p><b>Not sure which car?</b><br>Tell me your budget — I match you from the cars on the lot in seconds.</p>';
        document.body.appendChild(teaser);
        teaser.addEventListener('click', function (e) {
            if (e.target.closest('.sc-t-x')) { hideTeaser(true); return; }
            hideTeaser(true);
            fab.click();
        });
    }
    setTimeout(showTeaser, 1200);

    // ---------- events ----------
    fab.addEventListener('click', function () {
        hideTeaser(true);
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
        const ft = e.target.closest('.sc-ft');
        if (ft) {
            document.querySelectorAll('.sc-ft').forEach(function (b) { b.classList.remove('sc-onft'); });
            ft.classList.add('sc-onft');
        }
        if (e.target.closest('#sc-f-sub')) submitForm();
        if (e.target.id === 'sc-f-name') e.target.classList.remove('sc-err');
    });
    panel.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sc-fi')) submitForm();
    });
})();

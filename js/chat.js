// Samantha AI — floating chat widget (vanilla JS + site Tailwind + scoped keyframes)
// Talks to the serverless brain (chatbot/api/chat.js on Vercel), renders car cards,
// and hands interested buyers off to Samantha's WhatsApp with a prefilled summary.
(function () {
    const API = window.SAMANTHA_CHAT_API || 'https://abcars-samantha-website.vercel.app/api/chat';
    const IN_CARS = location.pathname.indexOf('/cars/') !== -1;
    const WA_DIRECT = 'https://api.whatsapp.com/send?phone=821071704513';
    const GREETING = "Hi, I'm Samantha's AI 👋 Tell me your budget and what you need the car for — I'll match you with cars sitting on our lot right now.";
    const STARTERS = ['🚙 SUV under $6,000', '👨‍👩‍👧 Family minivan', '🇺🇸 US-spec sedan', '💰 Cheap first car'];
    const TIME_CHIPS = ['Today PM', 'Tomorrow AM', 'Tomorrow PM', 'This weekend'];

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

    // --- scoped styles (animations & bits Tailwind build doesn't carry) ---
    const style = document.createElement('style');
    style.textContent = [
        '@keyframes sc-pop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}',
        '@keyframes sc-msg{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
        '@keyframes sc-dot{0%,60%,100%{transform:translateY(0);opacity:.35}30%{transform:translateY(-4px);opacity:1}}',
        '@keyframes sc-ping{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.2);opacity:0}}',
        '#sc-panel{animation:sc-pop .28s cubic-bezier(.22,1,.36,1)}',
        '.sc-anim{animation:sc-msg .25s ease-out}',
        '.sc-dot{width:6px;height:6px;border-radius:9999px;background:#2C4732;display:inline-block;animation:sc-dot 1.2s infinite}',
        '.sc-dot:nth-child(2){animation-delay:.15s}.sc-dot:nth-child(3){animation-delay:.3s}',
        '#sc-msgs{scroll-behavior:smooth}',
        '#sc-msgs::-webkit-scrollbar{width:5px}#sc-msgs::-webkit-scrollbar-thumb{background:#c9c9c2;border-radius:3px}',
        '.sc-cards{scroll-snap-type:x mandatory}.sc-cards>a{scroll-snap-align:start}',
        '.sc-card:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.12)}',
        '.sc-card{transition:transform .2s ease, box-shadow .2s ease}',
        '@media (max-width:639px){#sc-panel{left:0!important;right:0!important;bottom:0!important;width:100%!important;max-height:88vh!important;height:88vh!important;border-radius:1.5rem 1.5rem 0 0!important}}',
    ].join('');
    document.head.appendChild(style);

    // --- DOM ---
    const AVATAR = '<div class="w-8 h-8 shrink-0 rounded-full bg-[#2C4732] flex items-center justify-center"><span class="font-display text-[#EFE3C8] text-[11px] leading-none">S</span></div>';
    const root = document.createElement('div');
    root.innerHTML = ''
        + '<button id="sc-open" type="button" aria-label="Chat with Samantha AI" class="fixed right-4 ' + (IN_CARS ? 'bottom-20 md:bottom-6' : 'bottom-5') + ' z-[90] flex items-center gap-2.5 bg-[#2C4732] text-[#EFE3C8] pl-2 pr-5 py-2 rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">'
        + '  <span class="relative flex w-9 h-9 items-center justify-center rounded-full bg-[#EFE3C8]/10 border border-[#EFE3C8]/20">'
        + '    <span class="font-display text-sm leading-none">S</span>'
        + '    <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#2C4732]"></span>'
        + '  </span>'
        + '  <span class="text-left leading-tight"><span class="block font-display text-[11px]">ASK AI</span>'
        + '  <span class="block font-mono text-[8px] text-[#D2A867] tracking-widest">FIND MY CAR</span></span>'
        + '</button>'
        + '<div id="sc-panel" class="hidden fixed right-4 bottom-5 z-[95] w-[392px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[76vh] bg-[#F7F6F2] rounded-3xl shadow-2xl border border-black/10 flex-col overflow-hidden">'
        + '  <div class="relative bg-[#2C4732] px-4 py-3.5 flex items-center gap-3">'
        + '    <div class="relative w-10 h-10 rounded-full bg-[#EFE3C8]/10 border border-[#EFE3C8]/25 flex items-center justify-center">'
        + '      <span class="font-display text-[#EFE3C8] text-base leading-none">S</span>'
        + '      <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#2C4732]"></span>'
        + '    </div>'
        + '    <div class="flex-1">'
        + '      <p class="font-display text-[#EFE3C8] text-sm leading-tight">SAMANTHA AI</p>'
        + '      <p class="font-mono text-[#D2A867] text-[9px] tracking-widest mt-0.5">● ONLINE · CAR MATCHMAKER</p>'
        + '    </div>'
        + '    <button id="sc-clear" type="button" title="New chat" class="text-[#EFE3C8]/50 hover:text-white font-mono text-[10px] px-2 py-1 border border-[#EFE3C8]/20 rounded-full">RESET</button>'
        + '    <button id="sc-close" type="button" aria-label="Close" class="text-[#EFE3C8]/70 hover:text-white text-lg leading-none px-1.5 py-1">✕</button>'
        + '  </div>'
        + '  <div id="sc-msgs" class="flex-1 overflow-y-auto px-3 py-4 space-y-3"></div>'
        + '  <div id="sc-chips" class="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 bg-white/80 border-t border-black/5"></div>'
        + '  <div class="px-3 pb-3 pt-1 bg-white/80 flex items-center gap-2">'
        + '    <input id="sc-input" type="text" maxlength="500" placeholder="e.g. SUV around $7k, low miles…" class="flex-1 bg-[#F2F2F2] border border-black/10 focus:border-[#2C4732] focus:bg-white rounded-full px-4 py-3 font-mono text-xs outline-none transition-colors">'
        + '    <button id="sc-send" type="button" aria-label="Send" class="w-11 h-11 shrink-0 bg-[#2C4732] text-[#EFE3C8] rounded-full font-bold hover:bg-[#0047FF] hover:text-white transition-colors flex items-center justify-center">'
        + '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>'
        + '    </button>'
        + '  </div>'
        + '</div>';
    document.body.appendChild(root);

    const panel = document.getElementById('sc-panel');
    const openBtn = document.getElementById('sc-open');
    const msgsBox = document.getElementById('sc-msgs');
    const chipsBox = document.getElementById('sc-chips');
    const input = document.getElementById('sc-input');

    function save() {
        try { sessionStorage.setItem('samantha_chat', JSON.stringify(msgs.slice(-30))); } catch (e) {}
    }

    function bubble(role, html, anim) {
        if (role === 'user') {
            return '<div class="flex justify-end' + (anim ? ' sc-anim' : '') + '">'
                + '<div class="bg-[#0047FF] text-white rounded-2xl rounded-br-md px-3.5 py-2.5 font-mono text-xs leading-relaxed max-w-[82%] whitespace-pre-wrap break-words shadow-sm">' + html + '</div></div>';
        }
        return '<div class="flex items-end gap-2' + (anim ? ' sc-anim' : '') + '">' + AVATAR
            + '<div class="bg-white text-[#111] border border-black/5 rounded-2xl rounded-bl-md px-3.5 py-2.5 font-mono text-xs leading-relaxed max-w-[82%] whitespace-pre-wrap break-words shadow-sm">' + html + '</div></div>';
    }

    function cardsHtml(cards) {
        if (!cards || !cards.length) return '';
        return '<div class="sc-cards flex gap-2.5 overflow-x-auto pb-2 pl-10 sc-anim">' + cards.map(function (c) {
            return '<a href="' + esc(c.url) + '" target="_blank" rel="noopener" class="sc-card w-44 shrink-0 bg-white rounded-xl border border-black/10 overflow-hidden">'
                + '<div class="relative"><img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy" class="w-full h-24 object-cover">'
                + '<span class="absolute bottom-1.5 right-1.5 bg-[#2C4732]/90 text-[#EFE3C8] font-mono text-[8px] px-1.5 py-0.5 rounded-full">VIEW →</span></div>'
                + '<div class="p-2.5">'
                + '<p class="font-bold text-[10px] leading-snug mb-1">' + esc(c.title) + '</p>'
                + '<div class="flex items-baseline justify-between gap-1">'
                + '<p class="font-display text-sm text-[#0047FF]">' + esc(c.price) + '</p>'
                + (c.miles ? '<p class="font-mono text-[8px] text-gray-500">' + esc(c.miles) + ' MI</p>' : '')
                + '</div></div></a>';
        }).join('') + '</div>';
    }

    function handoffHtml(h) {
        if (!h || !h.ready) return '';
        return '<div class="ml-10 bg-[#2C4732] rounded-2xl p-3.5 sc-anim">'
            + '<p class="font-display text-[#EFE3C8] text-[11px] mb-1">READY FOR SAMANTHA 🤝</p>'
            + '<p class="font-mono text-[#EFE3C8]/70 text-[10px] leading-relaxed mb-2.5">Your info & picks are packed into one message — tap, review, and hit send in WhatsApp.</p>'
            + '<a href="' + esc(h.wa_url) + '" target="_blank" rel="noopener" data-sc-lead class="block bg-[#25D366] text-white text-center font-bold text-xs rounded-full py-3 hover:brightness-110 transition-all">💬 SEND TO SAMANTHA</a>'
            + '<p class="font-mono text-[#D2A867] text-[8px] tracking-wider text-center mt-2">SHE REPLIES DURING BUSINESS HOURS · 7 DAYS</p>'
            + '</div>';
    }

    function fallbackHtml() {
        return '<div class="ml-10 flex gap-2 sc-anim">'
            + '<a href="tel:01071704513" class="flex-1 bg-black text-white text-center font-bold text-[10px] rounded-full py-2.5">📞 CALL</a>'
            + '<a href="' + WA_DIRECT + '" target="_blank" rel="noopener" class="flex-1 bg-[#25D366] text-white text-center font-bold text-[10px] rounded-full py-2.5">💬 WHATSAPP</a>'
            + '</div>';
    }

    function typingHtml() {
        return '<div class="flex items-end gap-2 sc-anim">' + AVATAR
            + '<div class="bg-white border border-black/5 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1"><span class="sc-dot"></span><span class="sc-dot"></span><span class="sc-dot"></span></div></div>';
    }

    function render(extraChips, animateLast) {
        let html = bubble('assistant', esc(GREETING));
        msgs.forEach(function (m, i) {
            const anim = animateLast && i === msgs.length - 1;
            html += bubble(m.role, esc(m.content), anim);
            if (m.cards && m.cards.length) html += cardsHtml(m.cards);
            if (m.handoff) html += handoffHtml(m.handoff);
            if (m.fallback) html += fallbackHtml();
        });
        if (busy) html += typingHtml();
        msgsBox.innerHTML = html;
        msgsBox.scrollTop = msgsBox.scrollHeight;

        let chips = [];
        if (!msgs.length) chips = STARTERS;
        else if (extraChips) chips = extraChips;
        chipsBox.innerHTML = chips.map(function (c) {
            return '<button type="button" data-sc-chip class="font-mono text-[10px] bg-white border border-black/15 hover:border-[#2C4732] hover:bg-[#2C4732] hover:text-[#EFE3C8] rounded-full px-3 py-1.5 transition-colors">' + esc(c) + '</button>';
        }).join('');
        chipsBox.style.display = chips.length ? '' : 'none';
    }

    async function send(text) {
        text = (text || '').trim();
        if (!text || busy) return;
        msgs.push({ role: 'user', content: text.replace(/^[^\w$]+\s*/, '') || text });
        busy = true;
        input.value = '';
        save();
        render(null, true);
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
                save(); render(null, true);
                return;
            }
            const data = await r.json();
            const m = { role: 'assistant', content: data.reply || '…' };
            if (data.cards && data.cards.length) m.cards = data.cards;
            if (data.handoff && data.handoff.ready) m.handoff = data.handoff;
            msgs.push(m);
            save();
            const askTime = !m.handoff && /\b(time|when|schedule|available)\b/i.test(m.content);
            render(askTime ? TIME_CHIPS : null, true);
        } catch (e) {
            busy = false;
            msgs.push({ role: 'assistant', content: 'Connection hiccup — reach Samantha directly, or try again:', fallback: true });
            save(); render(null, true);
        }
    }

    // --- events ---
    openBtn.addEventListener('click', function () {
        panel.classList.remove('hidden');
        panel.classList.add('flex');
        openBtn.classList.add('hidden');
        track(null, 'chat_open');
        render();
        if (window.matchMedia('(min-width: 640px)').matches) input.focus();
    });
    document.getElementById('sc-close').addEventListener('click', function () {
        panel.classList.add('hidden');
        panel.classList.remove('flex');
        openBtn.classList.remove('hidden');
    });
    document.getElementById('sc-clear').addEventListener('click', function () {
        msgs = [];
        save();
        render();
    });
    document.getElementById('sc-send').addEventListener('click', function () { send(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(input.value); });
    chipsBox.addEventListener('click', function (e) {
        const chip = e.target.closest('[data-sc-chip]');
        if (chip) send(chip.textContent);
    });
    msgsBox.addEventListener('click', function (e) {
        if (e.target.closest('[data-sc-lead]')) track('Lead', 'chat_lead');
    });
})();

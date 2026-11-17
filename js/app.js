/* Santa's Little Helper: UI */
(function () {
  'use strict';
  const L = window.SLH, D = window.SLH_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const app = $('#app'), nav = $('#nav'), layer = $('#layer');

  // ---------- Storage (never throws) ----------
  const KEY = 'slh-v1';
  const DEFAULT = () => ({
    lists: [], events: [], letters: [], nice: [], advent: [], myMatches: [],
    elf: { name: '', plan: {}, done: [], found: [] },
    shop: { budget: '', people: [] }, currency: '$'
  });
  let state = DEFAULT();
  try { const raw = localStorage.getItem(KEY); if (raw) state = Object.assign(DEFAULT(), JSON.parse(raw)); } catch (e) {}
  state.elf = Object.assign(DEFAULT().elf, state.elf); state.shop = Object.assign(DEFAULT().shop, state.shop);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  const ui = { tab: 'home', listsTab: 'lists', santaTab: 'tracker', guTab: 'elf', eventId: null, creating: false,
    unlocked: false, filters: { age: 'any', interest: 'any', max: '' }, deck: 0, demo: null, wishCount: 3, highlight: null, libEffort: 'all' };
  try { ui.unlocked = sessionStorage.getItem('slh-gu') === '1'; } catch (e) {}

  // ---------- Helpers ----------
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const money = n => state.currency + (Math.round(Number(n || 0) * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const pad = n => String(n).padStart(2, '0');
  const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const today = () => dkey(new Date());
  const tomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return dkey(d); };
  const seasonYear = () => new Date().getFullYear();
  const fmtTime = ms => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const fmtDay = ms => new Date(ms).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtDate = s => { if (!s) return ''; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); };
  const missionById = id => D.ELF_MISSIONS.find(m => m.id === id);
  const baseUrl = () => location.href.split('#')[0];

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  function modal(html, opts) {
    opts = opts || {};
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + '</div>';
    const close = () => { bg.remove(); if (opts.onClose) opts.onClose(); };
    bg.addEventListener('click', e => { if (e.target === bg && !opts.sticky) close(); if (e.target.closest('[data-close]')) close(); });
    layer.appendChild(bg);
    const first = bg.querySelector('input,textarea,select');
    if (first && !opts.noFocus) setTimeout(() => first.focus(), 50);
    return { el: bg, close };
  }
  function confirmBox(text, yesLabel, onYes) {
    const m = modal('<h2>' + esc(text) + '</h2><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="cfYes">' + esc(yesLabel || 'Yes') + '</button></div>');
    m.el.querySelector('#cfYes').onclick = () => { m.close(); onYes(); };
  }
  function copyText(text, okMsg) {
    const fallback = () => {
      const m = modal('<h2>Copy this</h2><p class="muted small">Press and hold (or Ctrl/Cmd + C) to copy.</p><textarea readonly style="min-height:140px">' + esc(text) + '</textarea><button class="btn block" data-close style="margin-top:10px">Done</button>', { noFocus: true });
      const ta = m.el.querySelector('textarea'); ta.focus(); ta.select();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(okMsg || 'Copied!'), fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function burst(x, y, emojis) {
    const set = emojis || ['✨', '⭐', '❄️', '🎉', '🎁'];
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span'); s.className = 'burst'; s.textContent = set[i % set.length];
      s.style.left = x + 'px'; s.style.top = y + 'px';
      const a = Math.random() * Math.PI * 2, r = 60 + Math.random() * 90;
      s.style.setProperty('--x', Math.cos(a) * r + 'px'); s.style.setProperty('--y', Math.sin(a) * r + 'px');
      document.body.appendChild(s); setTimeout(() => s.remove(), 1300);
    }
  }
  function burstAt(el) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }

  // ---------- Navigation ----------
  const TABS = [
    ['home', '🏠', 'Home'], ['lists', '🎁', 'Gifts'], ['exchange', '🎩', 'Exchange'],
    ['santa', '🎅', 'Santa'], ['elf', '🧝', 'Elf Scout'], ['grownups', '🔒', 'Grown-ups']
  ];
  function renderNav() {
    nav.innerHTML = TABS.map(([id, e, label]) => {
      const badge = id === 'santa' && unreadCount() ? ' 📬' : '';
      return '<a href="#' + id + '" class="' + (ui.tab === id ? 'on' : '') + '"' + (ui.tab === id ? ' aria-current="page"' : '') + '><span class="e">' + e + '</span>' + label + badge + '</a>';
    }).join('');
  }
  function go(tab) { if (location.hash !== '#' + tab) location.hash = tab; else route(); }
  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith('ss') && h.length > 3) { showReveal(h.slice(2)); history.replaceState(null, '', '#exchange'); ui.tab = 'exchange'; }
    else if (h.startsWith('wl') && h.length > 3) { showSharedList(h.slice(2)); history.replaceState(null, '', '#lists'); ui.tab = 'lists'; }
    else ui.tab = TABS.some(t => t[0] === h) ? h : 'home';
    render();
    window.scrollTo(0, 0);
  }
  function render() {
    renderNav();
    const v = VIEWS[ui.tab] || VIEWS.home;
    app.innerHTML = '<section class="view">' + v() + '</section>';
    tick();
  }

  // ---------- HOME ----------
  function unreadCount() { return state.letters.filter(l => l.kind === 'santa' && !l.read).length; }
  function countdownHTML() {
    const ms = L.msUntilChristmas(Date.now());
    if (ms === 0) return '<div class="count"><div style="min-width:220px"><b>🎄 Today! 🎄</b><span>Merry Christmas</span></div></div>';
    const t = L.splitDuration(ms);
    return '<div class="count"><div><b>' + t.days + '</b><span>days</span></div><div><b>' + pad(t.hours) + '</b><span>hours</span></div><div><b>' + pad(t.minutes) + '</b><span>min</span></div><div><b>' + pad(t.seconds) + '</b><span>sec</span></div></div>';
  }
  function viewHome() {
    const now = Date.now(), d = new Date(now), dec = d.getMonth() === 11;
    const unread = unreadCount();
    let h = '';
    if (unread) h += '<div class="card berry row between"><div><h3 style="margin:0">📬 You have ' + (unread > 1 ? unread + ' letters' : 'a letter') + ' from Santa!</h3><div class="small muted">Delivered straight from the North Pole.</div></div><button class="btn gold sm" data-act="openMailbox">Open</button></div>';
    h += '<div class="card pine center"><h2 class="festive" style="font-size:1.9rem;margin:0">Countdown to Christmas</h2><div id="cd">' + countdownHTML() + '</div><div class="small muted">' + (dec && d.getDate() === 24 ? 'Santa is on his way tonight! 🦌' : 'Every second brings the sleigh a little closer.') + '</div></div>';
    h += '<div class="grid g3" style="margin-bottom:14px">' + [
      ['santa', 'letters', '✉️', 'Write to Santa'], ['santa', 'tracker', '🛷', 'Track Santa'],
      ['exchange', '', '🎩', 'Draw names'], ['lists', 'lists', '📝', 'Wish lists'],
      ['lists', 'ideas', '💡', 'Gift ideas'], ['elf', '', '🔍', 'Elf Scout']
    ].map(([t, sub, e, l]) => '<button class="card center" style="margin:0;cursor:pointer" data-act="quick" data-tab="' + t + '" data-sub="' + sub + '"><div style="font-size:1.8rem">' + e + '</div><b>' + l + '</b></button>').join('') + '</div>';

    // Advent
    const opened = state.advent || [];
    h += '<div class="card"><div class="row between"><h2 style="margin:0">🗓️ Advent Calendar</h2><span class="small muted">' + (dec ? 'Open a door each day!' : 'Doors open December 1') + '</span></div><div class="advent" style="margin-top:12px">';
    D.ADVENT.forEach(a => {
      const un = L.adventUnlocked(a.day, now), op = un && opened.includes(seasonYear() + '-' + a.day);
      const isToday = dec && d.getDate() === a.day;
      h += '<button class="door ' + (un ? (op ? 'open' : '') : 'locked') + (isToday && !op ? ' today' : '') + '" data-act="door" data-day="' + a.day + '" aria-label="Day ' + a.day + '">' + (op ? a.emoji : a.day + (un ? '' : '<div style="font-size:.6rem">🔒</div>')) + '</button>';
    });
    h += '</div></div>';

    // Nice list
    h += '<div class="card"><h2>⭐ Nice List Meter</h2><p class="muted small" style="margin-top:-4px">Tap the star each time someone does something kind. Fill the meter to earn a Nice List certificate!</p>';
    if (!state.nice.length) h += '<div class="empty"><span class="e">🌟</span>Add a little helper to start collecting stars.</div>';
    state.nice.forEach(k => {
      const goal = 20, pct = Math.min(100, k.stars / goal * 100);
      h += '<div class="item" style="align-items:center"><div class="avatar">' + esc(k.emoji || '🧒') + '</div><div class="grow"><div class="row between"><b>' + esc(k.name) + '</b><span class="small">' + k.stars + ' / ' + goal + (k.stars >= goal ? ' 🏅' : '') + '</span></div><div class="meter"><i style="width:' + pct + '%"></i></div></div>' +
        '<button class="btn gold sm" data-act="star" data-id="' + k.id + '" aria-label="Add a star">⭐ +1</button><button class="icon-btn" data-act="niceMenu" data-id="' + k.id + '" aria-label="Options">⋯</button></div>';
    });
    h += '<form data-form="addNice" class="row" style="margin-top:10px"><input type="text" name="name" placeholder="Name" maxlength="30" class="grow" required style="flex:1"><button class="btn green">Add</button></form></div>';

    // Install
    h += '<div class="card"><h3>📲 Get the app on your phone</h3><p class="small muted" style="margin:0"><b>iPhone/iPad:</b> open in Safari, tap Share, then <i>Add to Home Screen</i>. <b>Android:</b> tap the browser menu, then <i>Install app</i> or <i>Add to Home screen</i>. It works offline too.</p></div>';
    return h;
  }

  // ---------- GIFTS (lists + ideas) ----------
  const EMOJIS = ['🧒', '👧', '👦', '👩', '👨', '👵', '👴', '👶', '🐶', '🐱', '⭐', '🎅'];
  function viewLists() {
    let h = '<div class="seg">' + [['lists', '📝 Wish Lists'], ['ideas', '💡 Gift Ideas'], ['swap', '🐘 Swap Gifts']].map(([k, l]) => '<button data-act="listsTab" data-k="' + k + '" class="' + (ui.listsTab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
    if (ui.listsTab === 'ideas') return h + viewIdeas();
    if (ui.listsTab === 'swap') return h + '<div class="card"><h2>🐘 White Elephant & Yankee Swap ideas</h2><p class="muted small">Funny, useful or "steal-worthy" gifts that work for anyone.</p>' + D.ELEPHANT_IDEAS.map(x => '<div class="item"><span class="e">🎁</span><div class="t">' + esc(x) + '</div></div>').join('') + '</div>';
    h += '<div class="card"><h2>Make a wish list</h2><form data-form="addList" class="row"><select name="emoji" style="width:auto">' + EMOJIS.map(e => '<option>' + e + '</option>').join('') + '</select><input type="text" name="name" placeholder="Whose list? (e.g. Maya)" maxlength="30" required style="flex:1;min-width:140px"><button class="btn green">Create</button></form></div>';
    if (!state.lists.length) h += '<div class="card empty"><span class="e">📝</span>No wish lists yet. Make one for each person in the family, then share it with grandparents and friends!</div>';
    state.lists.forEach(l => {
      h += '<div class="card"><div class="row"><div class="avatar">' + esc(l.emoji) + '</div><div class="grow"><h3 style="margin:0">' + esc(l.name) + '\'s Wish List</h3><div class="small muted">' + l.items.length + ' wish' + (l.items.length === 1 ? '' : 'es') + '</div></div>' +
        '<button class="btn ghost sm" data-act="shareList" data-id="' + l.id + '">🔗 Share</button><button class="icon-btn" data-act="delList" data-id="' + l.id + '" aria-label="Delete list">🗑️</button></div>';
      l.items.forEach(it => {
        h += '<div class="item"><button class="icon-btn" data-act="topItem" data-l="' + l.id + '" data-id="' + it.id + '" title="Most wanted" aria-label="Toggle most wanted">' + (it.top ? '⭐' : '☆') + '</button><div class="grow"><div class="t">' + esc(it.title) + (it.top ? ' <span class="badge">Most wanted</span>' : '') + '</div>' +
          (it.link ? '<a class="small" href="' + esc(safeUrl(it.link)) + '" target="_blank" rel="noopener">' + esc(shortUrl(it.link)) + '</a>' : '') + (it.note ? '<div class="small muted">' + esc(it.note) + '</div>' : '') + '</div>' +
          '<button class="icon-btn" data-act="delItem" data-l="' + l.id + '" data-id="' + it.id + '" aria-label="Remove">✕</button></div>';
      });
      h += '<form data-form="addItem" data-l="' + l.id + '" style="margin-top:8px"><div class="row"><input type="text" name="title" placeholder="Add a wish..." maxlength="80" required style="flex:2;min-width:150px"><input type="url" name="link" placeholder="Link (optional)" style="flex:1;min-width:120px"><button class="btn sm">Add</button></div></form></div>';
    });
    return h;
  }
  function safeUrl(u) { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : '#'; } catch (e) { return '#'; } }
  function shortUrl(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } }
  function viewIdeas() {
    const f = ui.filters;
    const opt = (v, l, cur) => '<option value="' + v + '"' + (String(cur) === String(v) ? ' selected' : '') + '>' + l + '</option>';
    let h = '<div class="card"><h2>💡 Gift Idea Finder</h2><div class="grid g3">' +
      '<div><label class="f">Who is it for?</label><select data-change="filter" data-k="age">' + opt('any', 'Anyone', f.age) + D.AGE_GROUPS.map(a => opt(a.id, a.label, f.age)).join('') + '</select></div>' +
      '<div><label class="f">They love...</label><select data-change="filter" data-k="interest">' + opt('any', 'Anything', f.interest) + D.INTERESTS.map(a => opt(a.id, a.label, f.interest)).join('') + '</select></div>' +
      '<div><label class="f">Budget up to</label><select data-change="filter" data-k="max">' + opt('', 'Any budget', f.max) + [10, 25, 50, 100].map(n => opt(n, money(n), f.max)).join('') + '</select></div></div>' +
      '<button class="btn gold" style="margin-top:12px" data-act="surprise">🎲 Surprise me</button></div>';
    const res = L.filterGifts(D.GIFTS, f).sort((a, b) => a.price - b.price);
    if (!res.length) return h + '<div class="card empty"><span class="e">🤔</span>No matches. Try a different interest or a bigger budget.</div>';
    h += '<div class="grid g3">' + res.map(g => '<div class="tile" id="gift-' + g.id + '"' + (ui.highlight === g.id ? ' style="outline:3px solid var(--gold)"' : '') + '><div class="e">' + g.emoji + '</div><b>' + esc(g.name) + '</b><div class="small muted">' + (g.price ? 'About ' + money(g.price) : 'Free / homemade') + '</div><button class="btn ghost sm" data-act="ideaAdd" data-id="' + g.id + '">+ Add to a list</button></div>').join('') + '</div>';
    h += '<p class="small muted center">Prices are rough guides. Ideas only, we don\'t sell anything.</p>';
    return h;
  }

  // ---------- EXCHANGE ----------
  function viewExchange() {
    if (ui.eventId) { const ev = state.events.find(e => e.id === ui.eventId); if (ev) return viewEvent(ev); ui.eventId = null; }
    let h = '<div class="card pine"><h2 class="festive" style="font-size:1.8rem">Gift Exchanges</h2><p class="muted" style="margin-top:0">Run a Secret Santa or White Elephant in minutes. Draw names, keep them secret, and send each person a private link.</p><button class="btn gold" data-act="newEvent">➕ New gift exchange</button></div>';
    if (ui.creating) h += eventForm();
    if (!state.events.length && !ui.creating) h += '<div class="card empty"><span class="e">🎩</span>No exchanges yet.</div>';
    state.events.forEach(ev => {
      h += '<button class="card row" style="width:100%;text-align:left;cursor:pointer" data-act="openEvent" data-id="' + ev.id + '"><div class="avatar">' + (ev.type === 'elephant' ? '🐘' : '🎅') + '</div><div class="grow"><b>' + esc(ev.name) + '</b><div class="small muted">' + (ev.type === 'elephant' ? 'White Elephant' : 'Secret Santa') + ' · ' + ev.people.length + ' people' + (ev.date ? ' · ' + fmtDate(ev.date) : '') + '</div></div>' + (ev.matches ? '<span class="badge green">Drawn</span>' : '') + '<span>›</span></button>';
    });
    if (state.myMatches.length) {
      h += '<div class="card"><h3>🤫 My Secret Santa matches</h3><p class="small muted" style="margin-top:0">Saved from links you opened. Tap to peek.</p>' + state.myMatches.map((m, i) => '<div class="item"><span class="e">🎁</span><div class="grow"><b>' + esc(m.e) + '</b><div class="small muted">for ' + esc(m.g) + '</div></div><button class="btn ghost sm" data-act="peekMine" data-i="' + i + '">Peek</button></div>').join('') + '</div>';
    }
    return h;
  }
  function eventForm(ev) {
    ev = ev || { name: '', type: 'secret', date: '', budget: '', people: [], note: '' };
    return '<form class="card" data-form="saveEvent" data-id="' + (ev.id || '') + '"><h2>' + (ev.id ? 'Edit exchange' : 'New gift exchange') + '</h2>' +
      '<label class="f">Name</label><input type="text" name="name" maxlength="50" required value="' + esc(ev.name) + '" placeholder="Smith Family Christmas">' +
      '<label class="f">Type</label><select name="type"><option value="secret"' + (ev.type === 'secret' ? ' selected' : '') + '>🎅 Secret Santa (draw names)</option><option value="elephant"' + (ev.type === 'elephant' ? ' selected' : '') + '>🐘 White Elephant / Yankee Swap</option></select>' +
      '<div class="grid g2"><div><label class="f">Exchange date</label><input type="date" name="date" value="' + esc(ev.date) + '"></div><div><label class="f">Spending limit</label><input type="number" name="budget" min="0" step="1" value="' + esc(ev.budget) + '" placeholder="25"></div></div>' +
      '<label class="f">Who\'s playing? (one name per line)</label><textarea name="people" placeholder="Mom&#10;Dad&#10;Maya&#10;Grandpa Joe">' + esc(ev.people.join('\n')) + '</textarea>' +
      '<label class="f">Note for everyone (optional)</label><input type="text" name="note" maxlength="140" value="' + esc(ev.note) + '" placeholder="Bring it wrapped! Party starts at 6.">' +
      '<div class="row" style="margin-top:14px;justify-content:flex-end"><button type="button" class="btn ghost" data-act="cancelEvent">Cancel</button><button class="btn green">Save</button></div></form>';
  }
  function viewEvent(ev) {
    let h = '<button class="btn ghost sm" data-act="backEvents" style="margin-bottom:10px">‹ All exchanges</button>';
    if (ui.editing) return h + eventForm(ev);
    h += '<div class="card pine"><div class="row between"><div><span class="badge">' + (ev.type === 'elephant' ? '🐘 White Elephant' : '🎅 Secret Santa') + '</span><h2 style="margin:8px 0 2px">' + esc(ev.name) + '</h2><div class="small muted">' + [ev.date && fmtDate(ev.date), ev.budget && 'Limit ' + money(ev.budget), ev.people.length + ' people'].filter(Boolean).join(' · ') + '</div>' + (ev.note ? '<div class="small" style="margin-top:6px">📌 ' + esc(ev.note) + '</div>' : '') + '</div>' +
      '<div class="row"><button class="btn ghost sm" data-act="editEvent">Edit</button><button class="btn ghost sm" data-act="delEvent" data-id="' + ev.id + '">Delete</button></div></div></div>';
    h += '<div class="card"><h3>👥 Players</h3><div>' + (ev.people.length ? ev.people.map(p => '<span class="chip">' + esc(p) + '<button data-act="rmPerson" data-p="' + esc(p) + '" aria-label="Remove ' + esc(p) + '">✕</button></span>').join('') : '<span class="muted small">Add at least 3 people.</span>') + '</div>' +
      '<form data-form="addPerson" class="row" style="margin-top:8px"><input type="text" name="name" placeholder="Add a player" maxlength="30" required style="flex:1"><button class="btn green sm">Add</button></form></div>';
    return h + (ev.type === 'elephant' ? elephantHTML(ev) : secretHTML(ev));
  }
  function secretHTML(ev) {
    let h = '<div class="card"><h3>🚫 Who shouldn\'t draw each other?</h3><p class="small muted" style="margin-top:0">Couples, siblings, or last year\'s matches. Works both ways.</p>' +
      (ev.exclusions.length ? ev.exclusions.map((x, i) => '<span class="chip">' + esc(x[0]) + ' ✕ ' + esc(x[1]) + '<button data-act="rmExcl" data-i="' + i + '" aria-label="Remove rule">✕</button></span>').join('') : '') +
      (ev.people.length >= 2 ? '<form data-form="addExcl" class="row" style="margin-top:8px"><select name="a" style="flex:1">' + ev.people.map(p => '<option>' + esc(p) + '</option>').join('') + '</select><span>and</span><select name="b" style="flex:1">' + ev.people.map((p, i) => '<option' + (i === 1 ? ' selected' : '') + '>' + esc(p) + '</option>').join('') + '</select><button class="btn ghost sm">Add rule</button></form>' : '') + '</div>';
    h += '<div class="card">';
    if (!ev.matches) {
      h += '<h3>🎩 Draw names</h3><p class="small muted">The draw happens on this device and stays hidden. You\'ll get a private link for each player, or pass the phone around.</p><button class="btn block" data-act="draw"' + (ev.people.length < 3 ? ' disabled style="opacity:.5"' : '') + '>🎩 Draw names</button>' + (ev.people.length < 3 ? '<p class="small muted center">Add at least 3 players.</p>' : '');
    } else {
      h += '<div class="row between"><h3 style="margin:0">✅ Names drawn!</h3><span class="small muted">' + fmtDay(ev.drawnAt) + '</span></div><p class="small muted">Send each person their own link (they only see their match), or use "Show here" to pass this phone around.</p>';
      ev.people.forEach(p => {
        h += '<div class="item" style="align-items:center"><div class="avatar">🎁</div><div class="grow"><b>' + esc(p) + '</b><div class="small muted">' + (ev.sent && ev.sent.includes(p) ? 'Link copied ✓' : 'Not sent yet') + '</div></div><button class="btn ghost sm" data-act="copyMatch" data-p="' + esc(p) + '">🔗 Copy link</button><button class="btn ghost sm" data-act="showMatch" data-p="' + esc(p) + '">📱 Show here</button></div>';
      });
      h += '<div class="sep"></div><div class="row"><button class="btn ghost sm" data-act="redraw">🔄 Redraw</button><button class="btn ghost sm" data-act="revealAll">👀 Organizer: see all</button></div>';
    }
    return h + '</div>';
  }
  function elephantHTML(ev) {
    const g = ev.game || (ev.game = { order: [], turn: 0, gifts: [], maxSteals: 3 });
    let h = '<div class="card"><details><summary>📜 How to play</summary><ol class="small">' + D.WE_RULES.map(r => '<li>' + esc(r) + '</li>').join('') + '</ol></details><div class="row" style="margin-top:8px"><label class="small"><b>Max steals per gift</b></label><input type="number" min="1" max="9" value="' + g.maxSteals + '" data-change="maxSteals" style="width:80px"></div></div>';
    h += '<div class="card"><div class="row between"><h3 style="margin:0">🔢 Turn order</h3><button class="btn gold sm" data-act="shuffleOrder">🔀 Shuffle</button></div>';
    if (!g.order.length) h += '<p class="small muted">Shuffle to pick who goes first.</p>';
    else {
      const cur = g.order[g.turn] || g.order[0];
      h += '<div class="center" style="margin:10px 0"><div class="small muted">Now picking</div><div class="reveal-name" style="font-size:2rem">' + esc(cur) + '</div><div class="row" style="justify-content:center"><button class="btn ghost sm" data-act="turn" data-d="-1">‹ Back</button><button class="btn green" data-act="turn" data-d="1">Next player ›</button></div></div>' +
        '<div>' + g.order.map((p, i) => '<span class="chip" style="' + (i === g.turn ? 'background:var(--gold-2)' : '') + '">' + (i + 1) + '. ' + esc(p) + '</span>').join('') + '</div>';
    }
    h += '</div><div class="card"><h3>🎁 Gift board</h3><p class="small muted" style="margin-top:0">Log each gift as it\'s opened, then tap "Stolen!" when it changes hands.</p>';
    g.gifts.forEach((gf, i) => {
      const frozen = gf.steals >= g.maxSteals;
      h += '<div class="item" style="align-items:center"><span class="e">' + (frozen ? '🧊' : '🎁') + '</span><div class="grow"><b>' + esc(gf.name) + '</b><div class="small muted">Stolen ' + gf.steals + '/' + g.maxSteals + (frozen ? ' · <b>Frozen!</b>' : '') + '</div></div>' +
        '<select data-change="giftHolder" data-i="' + i + '" style="width:auto;max-width:130px">' + ev.people.map(p => '<option' + (p === gf.holder ? ' selected' : '') + '>' + esc(p) + '</option>').join('') + '</select>' +
        '<button class="btn sm" data-act="steal" data-i="' + i + '"' + (frozen ? ' disabled style="opacity:.4"' : '') + '>Stolen!</button></div>';
    });
    h += '<form data-form="addGift" class="row" style="margin-top:8px"><input type="text" name="name" placeholder="What was opened?" maxlength="60" required style="flex:1"><button class="btn green sm">Add</button></form></div>';
    return h;
  }
  function matchPayload(ev, giver) {
    const r = ev.matches[giver];
    const list = state.lists.find(l => l.name.trim().toLowerCase() === r.toLowerCase());
    return { t: 'ss', e: ev.name, g: giver, r, b: ev.budget || '', d: ev.date || '', n: ev.note || '', c: state.currency, w: list ? list.items.slice(0, 10).map(i => i.title) : [] };
  }
  function revealHTML(p) {
    return '<div class="center"><div style="font-size:2.6rem">🎁</div><div class="small muted">' + esc(p.e) + '</div><h2>' + esc(p.g) + ', you are Secret Santa for...</h2><div class="reveal-name festive">' + esc(p.r) + '</div>' +
      (p.b ? '<div><span class="badge">Spending limit: ' + esc((p.c || '$') + p.b) + '</span></div>' : '') + (p.d ? '<div class="small" style="margin-top:6px">📅 Exchange: ' + esc(fmtDate(p.d)) + '</div>' : '') +
      (p.n ? '<div class="small" style="margin-top:6px">📌 ' + esc(p.n) + '</div>' : '') +
      (p.w && p.w.length ? '<div class="card" style="text-align:left;margin-top:12px"><b>' + esc(p.r) + '\'s wish list</b>' + p.w.map(w => '<div class="small">• ' + esc(w) + '</div>').join('') + '</div>' : '') + '</div>';
  }
  function passPhone(p, after) {
    const m = modal('<div class="center"><div style="font-size:3rem">🤫</div><h2>Pass the phone to <span style="color:var(--berry)">' + esc(p.g) + '</span></h2><p class="muted">Everyone else, no peeking!</p><button class="btn block" id="rv">I\'m ' + esc(p.g) + '. Show me!</button><button class="btn ghost block" data-close style="margin-top:8px">Cancel</button></div>', { sticky: true });
    m.el.querySelector('#rv').onclick = () => {
      m.el.querySelector('.modal').innerHTML = revealHTML(p) + '<button class="btn green block" style="margin-top:14px" data-close>Got it, hide it!</button>' + (after ? '<button class="btn ghost block" style="margin-top:8px" id="sv">Save to my matches</button>' : '');
      const sv = m.el.querySelector('#sv'); if (sv) sv.onclick = () => { after(); m.close(); };
      burst(window.innerWidth / 2, window.innerHeight / 2.5);
    };
  }
  function showReveal(code) {
    const p = L.decodeShare(code);
    if (!p || p.t !== 'ss') { setTimeout(() => toast('Hmm, that Secret Santa link looks broken.'), 100); return; }
    setTimeout(() => passPhone(p, () => {
      if (!state.myMatches.some(m => m.e === p.e && m.g === p.g)) { state.myMatches.push(p); save(); }
      toast('Saved under Exchange'); render();
    }), 50);
  }

  // ---------- SANTA (tracker, letters, mailbox) ----------
  const WORLD = [
    [[-168, 66], [-162, 70], [-140, 70], [-120, 74], [-95, 72], [-80, 73], [-62, 66], [-55, 52], [-66, 45], [-75, 35], [-80, 32], [-81, 25], [-83, 29], [-90, 30], [-97, 27], [-97, 20], [-90, 21], [-87, 16], [-83, 10], [-79, 8], [-85, 10], [-92, 14], [-105, 20], [-110, 23], [-112, 30], [-117, 32], [-124, 40], [-124, 48], [-133, 57], [-150, 60], [-165, 62]],
    [[-55, 60], [-43, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77], [-55, 70]],
    [[-80, 8], [-60, 10], [-50, 0], [-35, -7], [-40, -22], [-48, -28], [-58, -38], [-65, -42], [-68, -55], [-75, -50], [-73, -38], [-71, -18], [-81, -5], [-78, 2]],
    [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [3, 51], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [45, 68], [70, 73], [100, 77], [140, 72], [180, 68], [180, 65], [160, 60], [155, 52], [142, 47], [135, 43], [129, 35], [122, 40], [121, 31], [117, 24], [108, 21], [106, 10], [100, 13], [103, 1], [98, 8], [92, 20], [80, 15], [77, 8], [72, 20], [67, 25], [57, 25], [50, 30], [48, 29], [56, 22], [52, 16], [43, 13], [35, 28], [34, 31], [36, 36], [28, 37], [26, 40], [22, 37], [18, 40], [12, 44], [15, 38], [8, 44], [3, 43], [0, 38], [-6, 36]],
    [[-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [40, -2], [40, -15], [35, -25], [20, -35], [17, -30], [12, -17], [13, -5], [9, 4], [-8, 4], [-17, 14]],
    [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [140, -38], [132, -32], [115, -34]],
    [[172, -34], [178, -38], [174, -41], [167, -46], [170, -42]], [[130, 31], [135, 34], [140, 36], [141, 41], [145, 44], [141, 45], [139, 38], [132, 34]],
    [[-5, 50], [1, 51], [0, 53], [-3, 58], [-6, 57], [-3, 54], [-5, 52]], [[44, -25], [50, -15], [49, -12], [43, -17]],
    [[95, 5], [105, -6], [115, -8], [119, -5], [117, 6], [110, 2], [100, 2]], [[-24, 64], [-14, 65], [-18, 66]]
  ];
  const px = lon => (lon + 180), py = lat => (90 - lat);
  function mapSVG(st) {
    const now = st.now;
    let s = '<svg class="map" viewBox="0 0 360 165" role="img" aria-label="Map of Santa\'s route">';
    for (let i = 0; i < 40; i++) { const x = (i * 97) % 360, y = (i * 53) % 160; s += '<circle cx="' + x + '" cy="' + y + '" r="' + (i % 3 ? .35 : .6) + '" fill="#fff" opacity=".6"/>'; }
    WORLD.forEach(poly => { s += '<polygon points="' + poly.map(([lo, la]) => px(lo).toFixed(1) + ',' + py(la).toFixed(1)).join(' ') + '" fill="#2d6a4f" stroke="#40916c" stroke-width=".4" opacity=".9"/>'; });
    const stops = st.schedule.stops;
    let prev = null;
    stops.forEach(p => {
      const visited = p.at <= now;
      if (visited && prev && Math.abs(p.lon - prev.lon) < 180) s += '<line x1="' + px(prev.lon) + '" y1="' + py(prev.lat) + '" x2="' + px(p.lon) + '" y2="' + py(p.lat) + '" stroke="#ffd166" stroke-width=".6" stroke-dasharray="1.5 1.5"/>';
      if (visited) prev = p;
      s += '<circle cx="' + px(p.lon) + '" cy="' + py(p.lat) + '" r="' + (visited ? 1.6 : 1.1) + '" fill="' + (visited ? '#ffd166' : '#ffffff') + '" opacity="' + (visited ? 1 : .55) + '"><title>' + esc(p.name) + '</title></circle>';
    });
    s += '<text x="180" y="7" text-anchor="middle" font-size="5">🏠</text>';
    if (st.phase !== 'preparing' && st.phase !== 'home') s += '<text x="' + px(st.pos.lon) + '" y="' + (py(st.pos.lat) + 2) + '" text-anchor="middle" font-size="9" style="filter:drop-shadow(0 0 3px #ffd166)">🛷</text>';
    return s + '</svg>';
  }
  function trackerNow() {
    if (!ui.demo) return Date.now();
    const t = ui.demo.simStart + (Date.now() - ui.demo.realStart) * ui.demo.speed;
    return t;
  }
  function trackerHTML() {
    const now = trackerNow();
    const st = L.santaStatus(now, D.SANTA_STOPS); st.now = now;
    if (ui.demo && now > st.schedule.land + 120000) { ui.demo = null; }
    let h = '';
    if (ui.demo) h += '<div class="row between" style="margin-bottom:8px"><span class="badge red">▶ Flight preview (sped up)</span><button class="btn ghost sm" data-act="stopDemo">Stop preview</button></div>';
    h += mapSVG(st);
    const fact = D.SANTA_FACTS[Math.floor(Date.now() / 10000) % D.SANTA_FACTS.length];
    if (st.phase === 'preparing') {
      const t = L.splitDuration(st.msUntilTakeoff);
      const days = st.msUntilTakeoff / 86400000;
      const pct = n => Math.max(5, Math.min(99, Math.round(100 - days * n)));
      h += '<h2 style="margin-top:14px">🏔️ Santa is getting ready at the North Pole</h2>' +
        '<div class="grid g3"><div class="stat"><span>Takeoff in</span><b>' + t.days + 'd ' + pad(t.hours) + 'h ' + pad(t.minutes) + 'm ' + pad(t.seconds) + 's</b></div><div class="stat"><span>Takeoff (your time)</span><b>' + fmtDay(st.schedule.depart) + '</b><span>' + fmtTime(st.schedule.depart) + '</span></div><div class="stat"><span>First stop</span><b>' + esc(st.next.name.split(',')[0]) + '</b></div></div>' +
        '<div style="margin-top:12px" class="small">' + [['Toys built', pct(1.2)], ['Presents wrapped', pct(2)], ['Reindeer training', pct(1.5)], ['Sleigh polished', pct(3)]].map(([l, p]) => '<div class="row between"><span>' + l + '</span><span>' + p + '%</span></div><div class="meter" style="margin-bottom:6px"><i style="width:' + p + '%"></i></div>').join('') + '</div>' +
        '<p class="small muted">Live tracking starts on Christmas Eve. Want to see how it works?</p><button class="btn gold" data-act="demo">▶ Preview the flight</button>';
    } else if (st.phase === 'home') {
      h += '<h2 style="margin-top:14px">🏠 Santa made it home!</h2><p>Every present has been delivered. The reindeer are fast asleep and Mrs. Claus has the cocoa on. See you next Christmas Eve!</p><div class="stat"><span>Presents delivered</span><b>' + L.TOTAL_GIFTS.toLocaleString() + '</b></div>';
    } else {
      const nextIn = st.next && st.next.at ? L.splitDuration(st.next.at - now) : null;
      const myMidnight = new Date(now); myMidnight.setHours(24, 0, 0, 0);
      h += '<h2 style="margin-top:14px">' + (st.phase === 'returning' ? '🏠 Heading home to the North Pole!' : '🛷 Santa is flying!') + '</h2>' +
        '<div class="grid g3"><div class="stat"><span>Presents delivered</span><b>' + st.delivered.toLocaleString() + '</b></div>' +
        '<div class="stat"><span>Last stop</span><b>' + esc(st.stop.name.split(',')[0]) + '</b><span>' + esc((st.stop.name.split(',')[1] || '').trim()) + '</span></div>' +
        '<div class="stat"><span>Next stop</span><b>' + esc(st.next.name.split(',')[0]) + '</b><span>' + (nextIn ? 'in ' + (nextIn.hours ? nextIn.hours + 'h ' : '') + nextIn.minutes + 'm ' + pad(nextIn.seconds) + 's' : '') + '</span></div></div>' +
        '<div style="margin-top:10px"><div class="row between small"><span>Journey</span><span>' + Math.round(st.progress * 100) + '%</span></div><div class="meter"><i style="width:' + (st.progress * 100).toFixed(1) + '%"></i></div></div>' +
        (!ui.demo ? '<p class="small" style="margin-top:10px">🌙 Santa only comes when everyone is asleep. He usually reaches your area around midnight, so be in bed early!</p>' : '');
    }
    h += '<p class="small muted" style="margin-top:12px">✨ ' + esc(fact) + '</p>';
    return h;
  }
  function viewSanta() {
    const unread = unreadCount();
    let h = '<div class="seg">' + [['tracker', '🛷 Tracker'], ['letters', '✉️ Write'], ['mailbox', '📬 Mailbox' + (unread ? ' (' + unread + ')' : '')]].map(([k, l]) => '<button data-act="santaTab" data-k="' + k + '" class="' + (ui.santaTab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
    if (ui.santaTab === 'tracker') return h + '<div class="card sky" id="trk">' + trackerHTML() + '</div>';
    if (ui.santaTab === 'mailbox') return h + mailboxHTML();
    let w = '';
    for (let i = 0; i < ui.wishCount; i++) w += '<input type="text" name="wish" maxlength="60" placeholder="Wish #' + (i + 1) + '" style="margin-bottom:6px">';
    return h + '<form class="card" data-form="letter"><h2 class="festive" style="font-size:1.8rem">Dear Santa...</h2>' +
      '<div class="grid g2"><div><label class="f">My name is</label><input type="text" name="name" maxlength="30" required></div><div><label class="f">I am this many years old</label><input type="number" name="age" min="1" max="120"></div></div>' +
      '<label class="f">This Christmas I wish for...</label>' + w + (ui.wishCount < 6 ? '<button type="button" class="btn ghost sm" data-act="moreWish">+ Another wish</button>' : '') +
      '<label class="f">Something kind I did this year</label><textarea name="deed" maxlength="200" placeholder="I helped my little brother tie his shoes"></textarea>' +
      '<label class="f">A question for Santa</label><input type="text" name="question" maxlength="120" placeholder="How are the reindeer?">' +
      '<button class="btn block" style="margin-top:16px">📮 Send to the North Pole</button></form>';
  }
  function mailboxHTML() {
    if (!state.letters.length) return '<div class="card empty"><span class="e">📭</span>The mailbox is empty. Write a letter to Santa and his reply will appear here!</div>';
    return '<div class="card">' + state.letters.slice().sort((a, b) => b.ts - a.ts).map(l => {
      const fromSanta = l.kind === 'santa';
      return '<button class="item" style="width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left;cursor:pointer" data-act="openLetter" data-id="' + l.id + '"><span class="e">' + (fromSanta ? (l.read ? '📜' : '💌') : '✉️') + '</span><div class="grow"><div class="t">' + (fromSanta ? 'From Santa to ' + esc(l.to) : esc(l.name) + '\'s letter + Santa\'s reply') + (fromSanta && !l.read ? ' <span class="badge red">New</span>' : '') + '</div><div class="small muted">' + fmtDay(l.ts) + '</div></div><span>›</span></button>';
    }).join('') + '</div>';
  }
  function openLetter(l) {
    let h;
    if (l.kind === 'santa') h = '<div class="parchment">' + esc(l.text) + '</div>';
    else h = '<div class="parchment kid">Dear Santa,\n\nMy name is ' + esc(l.name) + (l.age ? ' and I am ' + esc(l.age) : '') + '.' + (l.wishes.length ? '\n\nThis Christmas I wish for:\n' + l.wishes.map(w => '• ' + esc(w)).join('\n') : '') + (l.deed ? '\n\nSomething kind I did: ' + esc(l.deed) : '') + (l.question ? '\n\nMy question: ' + esc(l.question) : '') + '\n\nLove, ' + esc(l.name) + '</div><h3 style="margin:22px 0 14px" class="center">⬇️ Santa wrote back! ⬇️</h3><div class="parchment">' + esc(l.reply) + '</div>';
    const m = modal(h + '<div class="row" style="margin-top:16px;justify-content:space-between"><button class="btn ghost sm" data-act="delLetter" data-id="' + l.id + '">🗑️ Delete</button><button class="btn green" data-close>Close</button></div>', { noFocus: true });
    if (l.kind === 'santa' && !l.read) { l.read = true; save(); render(); burst(window.innerWidth / 2, 120, ['❄️', '⭐', '🎅', '✨']); }
    return m;
  }

  // ---------- ELF SCOUT (kid-safe) ----------
  function todaysMission() {
    const planned = state.elf.plan[today()];
    if (planned && missionById(planned)) return missionById(planned);
    return D.ELF_MISSIONS[L.hashString(today()) % D.ELF_MISSIONS.length];
  }
  function viewElf() {
    const name = state.elf.name || 'the elf';
    const m = todaysMission();
    const foundToday = state.elf.found.includes(today());
    const deck = D.ELF_MISSIONS[((ui.deck % D.ELF_MISSIONS.length) + D.ELF_MISSIONS.length) % D.ELF_MISSIONS.length];
    let h = '<div class="scout"><div class="peek">🧝</div><div class="small muted" style="font-weight:800;letter-spacing:1px;text-transform:uppercase">Today\'s Scout Question</div><div class="q">' + esc(m.kid) + '</div>' +
      (foundToday ? '<div class="badge green" style="font-size:1rem;padding:8px 16px">✅ You found ' + esc(name) + ' today!</div>' : '<button class="btn block" data-act="foundElf">🔍 I found ' + esc(name) + '!</button>') + '</div>';
    const n = state.elf.found.length;
    h += '<div class="card" style="margin-top:14px"><div class="row between"><h3 style="margin:0">🏅 Scout Badge</h3><b>' + n + ' day' + (n === 1 ? '' : 's') + ' spotted</b></div><div style="font-size:1.4rem;margin-top:6px;letter-spacing:2px">' + ('⭐'.repeat(Math.min(n, 24)) || '<span class="small muted">Find the elf to earn your first star!</span>') + '</div></div>';
    h += '<div class="card"><h3>🔎 More things to look for</h3><p class="small muted" style="margin-top:0">Elves are sneaky. Keep your scout eyes open!</p><div class="center" style="padding:10px 4px;font-weight:800;font-size:1.1rem;color:var(--pine);min-height:60px">' + esc(deck.kid) + '</div><div class="row" style="justify-content:center"><button class="btn ghost sm" data-act="deck" data-d="-1">‹</button><button class="btn ghost sm" data-act="deck" data-d="1">Another one ›</button></div></div>';
    h += '<div class="card"><h3>📜 Elf Scout Rules</h3><div class="small">🙅 Don\'t touch the elf, or it might lose its magic.<br>🌙 Every night the elf flies to the North Pole to tell Santa what it saw.<br>💬 You can tell the elf your wishes, it\'s a great listener!<br>⭐ Be kind, the elf notices everything.</div></div>';
    h += '<p class="center small muted">Grown-ups: plan tonight\'s spot in the <a href="#grownups">Grown-Up Corner 🔒</a></p>';
    return h;
  }

  // ---------- GROWN-UP CORNER (gated) ----------
  function viewGrownups() {
    if (!ui.unlocked) return '<div class="card center"><div class="lock">🔒</div><h2>Grown-Up Corner</h2><p class="muted">Elf plans, gift shopping and Santa\'s desk live here, safely away from curious eyes.</p><button class="btn green" data-act="unlock">I\'m a grown-up</button></div>';
    let h = '<div class="row between" style="margin-bottom:10px"><h2 style="margin:0">🔓 Grown-Up Corner</h2><button class="btn ghost sm" data-act="lock">🔒 Lock</button></div>';
    h += '<div class="seg">' + [['elf', '🧝 Elf Plans'], ['shop', '🛍️ Gifts & Budget'], ['desk', '🎅 Santa\'s Desk'], ['data', '⚙️ Settings']].map(([k, l]) => '<button data-act="guTab" data-k="' + k + '" class="' + (ui.guTab === k ? 'on' : '') + '">' + l + '</button>').join('') + '</div>';
    if (ui.guTab === 'shop') return h + shopHTML();
    if (ui.guTab === 'desk') return h + deskHTML();
    if (ui.guTab === 'data') return h + dataHTML();
    return h + elfPlanHTML();
  }
  function missionCard(m, extra) {
    return '<div class="card" style="margin-bottom:10px"><div class="row between"><b>' + esc(m.title) + '</b><span class="badge ' + (m.effort === 'quick' ? 'green' : m.effort === 'big' ? 'red' : '') + '">' + ({ quick: '⚡ 2 min', medium: '⏱️ 10 min', big: '🌟 Big one' })[m.effort] + '</span></div>' +
      '<div class="small" style="margin:6px 0">' + esc(m.setup) + '</div><div class="small muted">Props: ' + m.props.map(esc).join(', ') + '</div>' +
      '<div class="small muted" style="margin-top:4px">Kids will see: <i>"' + esc(m.kid) + '"</i></div>' + (extra || '') + '</div>';
  }
  function elfPlanHTML() {
    const e = state.elf, y = seasonYear();
    const tKey = tomorrow(), tm = missionById(e.plan[tKey]);
    let h = '<div class="card pine"><h3>🌙 Tonight\'s setup <span class="small muted">(for ' + fmtDate(tKey) + ' morning)</span></h3>';
    if (tm) {
      const done = e.done.includes(tKey);
      h += '<div style="color:var(--ink)">' + missionCard(tm) + '</div><div class="row"><button class="btn ' + (done ? 'ghost' : 'gold') + ' sm" data-act="elfDone" data-k="' + tKey + '">' + (done ? '✅ Set up! (undo)' : '✓ Mark as set up') + '</button><button class="btn ghost sm" data-act="planDay" data-k="' + tKey + '">Change</button></div>';
    } else {
      const picks = L.shuffle(D.ELF_MISSIONS.filter(m => m.effort === 'quick' && m.id !== 'goodbye'), L.mulberry32(L.hashString(tKey))).slice(0, 3);
      h += '<p class="small muted">Nothing planned yet. Here are three quick ideas:</p>' + picks.map(m => '<div style="color:var(--ink)">' + missionCard(m, '<button class="btn green sm" style="margin-top:8px" data-act="assign" data-k="' + tKey + '" data-m="' + m.id + '">Use tonight</button>') + '</div>').join('');
    }
    h += '</div>';
    h += '<div class="card"><h3>🧝 Your elf</h3><div class="row"><input type="text" data-change="elfName" value="' + esc(e.name) + '" placeholder="Elf\'s name (e.g. Jingles)" maxlength="24" style="flex:1"></div><p class="small muted">Shown to kids in Elf Scout.</p></div>';
    // calendar
    h += '<div class="card"><div class="row between"><h3 style="margin:0">🗓️ December plan</h3><button class="btn gold sm" data-act="autoPlan">✨ Fill empty days</button></div><p class="small muted">Each day is what kids find that <b>morning</b>, so set it up the night before. Tap a day to change it.</p><div class="cal">';
    for (let d = 1; d <= 24; d++) {
      const k = y + '-12-' + pad(d), m = missionById(e.plan[k]);
      h += '<button class="d' + (m ? ' has' : '') + (e.done.includes(k) ? ' done' : '') + (k === tKey ? ' tonight' : '') + '" data-act="planDay" data-k="' + k + '"><b>' + d + '</b>' + (m ? esc(m.title) : '<span class="muted">+</span>') + '</button>';
    }
    h += '</div></div>';
    // props for next 7 days
    const props = {}; const base = new Date();
    for (let i = 0; i < 8; i++) { const dd = new Date(base); dd.setDate(base.getDate() + i); const m = missionById(e.plan[dkey(dd)]); if (m) m.props.forEach(p => { props[p] = (props[p] || 0) + 1; }); }
    h += '<div class="card"><h3>🛒 Props for the week ahead</h3>' + (Object.keys(props).length ? Object.keys(props).map(p => '<span class="chip">' + esc(p) + '</span>').join('') : '<span class="small muted">Plan some days to see your shopping list.</span>') + '</div>';
    // library (collapsed so the planner stays short)
    h += '<div class="card"><details' + (ui.libOpen ? ' open' : '') + ' data-lib><summary>📚 Browse all ' + D.ELF_MISSIONS.length + ' ideas</summary><div class="row" style="margin:10px 0"><span class="small muted">Show</span><select data-change="libEffort" style="width:auto">' + [['all', 'All'], ['quick', '⚡ Quick'], ['medium', '⏱️ Medium'], ['big', '🌟 Big']].map(([v, l]) => '<option value="' + v + '"' + (ui.libEffort === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></div>' +
      D.ELF_MISSIONS.filter(m => ui.libEffort === 'all' || m.effort === ui.libEffort).map(m => missionCard(m, '<button class="btn ghost sm" style="margin-top:8px" data-act="assign" data-k="' + tKey + '" data-m="' + m.id + '">Use tonight</button>')).join('') + '</details></div>';
    return h;
  }
  function shopHTML() {
    const s = state.shop;
    const all = s.people.flatMap(p => p.gifts);
    const planned = all.reduce((a, g) => a + Number(g.price || 0), 0);
    const spent = all.filter(g => g.status !== 'idea').reduce((a, g) => a + Number(g.price || 0), 0);
    const budget = Number(s.budget || 0);
    let h = '<div class="card pine"><h3>💰 Holiday budget</h3><div class="row"><span>' + esc(state.currency) + '</span><input type="number" min="0" data-change="shopBudget" value="' + esc(s.budget) + '" placeholder="Total budget" style="flex:1;max-width:200px"></div>' +
      '<div class="grid g3" style="margin-top:10px"><div class="stat"><span>Spent</span><b>' + money(spent) + '</b></div><div class="stat"><span>Planned</span><b>' + money(planned) + '</b></div><div class="stat"><span>' + (budget && planned > budget ? 'Over by' : 'Left') + '</span><b>' + (budget ? money(Math.abs(budget - planned)) : '–') + '</b></div></div>' +
      (budget ? '<div class="meter" style="margin-top:10px"><i style="width:' + Math.min(100, planned / budget * 100) + '%;' + (planned > budget ? 'background:#ff6b6b' : '') + '"></i></div>' : '') + '</div>';
    h += '<div class="card"><h3>➕ Add someone to shop for</h3><form data-form="addShopPerson" class="row"><input type="text" name="name" placeholder="Name" maxlength="30" required style="flex:2;min-width:120px"><input type="number" name="budget" placeholder="Budget" min="0" style="flex:1;min-width:90px"><button class="btn green">Add</button></form></div>';
    const ST = { idea: '💡 Idea', bought: '🛍️ Bought', wrapped: '🎁 Wrapped' };
    s.people.forEach(p => {
      const tot = p.gifts.reduce((a, g) => a + Number(g.price || 0), 0);
      h += '<div class="card"><div class="row between"><div><h3 style="margin:0">' + esc(p.name) + '</h3><div class="small muted">' + money(tot) + (p.budget ? ' of ' + money(p.budget) : '') + ' · ' + p.gifts.filter(g => g.status === 'wrapped').length + '/' + p.gifts.length + ' wrapped</div></div><div class="row">' +
        (state.lists.length ? '<select data-change="importList" data-p="' + p.id + '" style="width:auto;max-width:150px"><option value="">Import wishes...</option>' + state.lists.map(l => '<option value="' + l.id + '">' + esc(l.emoji + ' ' + l.name) + '</option>').join('') + '</select>' : '') +
        '<button class="icon-btn" data-act="delShopPerson" data-p="' + p.id + '" aria-label="Remove person">🗑️</button></div></div>' +
        (p.budget ? '<div class="meter" style="margin:8px 0"><i style="width:' + Math.min(100, tot / p.budget * 100) + '%;' + (tot > p.budget ? 'background:#ff6b6b' : '') + '"></i></div>' : '');
      p.gifts.forEach(g => {
        h += '<div class="item" style="align-items:center"><div class="grow"><div class="t">' + esc(g.title) + '</div><div class="small muted">' + (g.price ? money(g.price) : 'No price yet') + '</div></div><button class="btn ghost sm" data-act="cycleGift" data-p="' + p.id + '" data-g="' + g.id + '">' + ST[g.status] + '</button><button class="icon-btn" data-act="delGift" data-p="' + p.id + '" data-g="' + g.id + '" aria-label="Remove">✕</button></div>';
      });
      h += '<form data-form="addShopGift" data-p="' + p.id + '" class="row" style="margin-top:8px"><input type="text" name="title" placeholder="Gift" maxlength="60" required style="flex:2;min-width:120px"><input type="number" name="price" placeholder="Price" min="0" step="0.01" style="flex:1;min-width:80px"><button class="btn sm">Add</button></form></div>';
    });
    return h;
  }
  const DESK_TEMPLATES = {
    nice: { label: '🏅 Nice List Certificate', text: n => 'OFFICIAL NICE LIST CERTIFICATE\n\nThis certifies that\n\n' + n.toUpperCase() + '\n\nhas been officially placed on Santa\'s Nice List for being kind, helpful and full of Christmas spirit this year.\n\nSigned at the North Pole,\nSanta Claus\nHead Elf (witness)' },
    cookies: { label: '🍪 Thanks for the cookies', text: n => 'Dear ' + n + ',\n\nThank you for the delicious cookies and milk! They gave me just the energy I needed for the rest of my trip. The reindeer loved the carrots too. Rudolph ate two!\n\nMerry Christmas,\nSanta' },
    elf: { label: '🧝 Elf report', text: n => 'Dear ' + n + ',\n\nYour elf has been sending me wonderful reports every night. I heard about how hard you have been trying to be kind and helpful. Keep it up, I am very proud of you!\n\nWith love from the North Pole,\nSanta' },
    reminder: { label: '🔔 Gentle reminder', text: n => 'Dear ' + n + ',\n\nThe elves tell me it has been a little tricky lately to listen and be gentle. Everyone has hard days, even elves! I know you can show everyone your kindest self. I\'ll be watching for it.\n\nYour friend,\nSanta' },
    custom: { label: '✍️ Write my own', text: n => 'Dear ' + n + ',\n\n\n\nLove,\nSanta' }
  };
  function deskHTML() {
    const kids = Array.from(new Set(state.nice.map(k => k.name).concat(state.letters.filter(l => l.kind !== 'santa').map(l => l.name))));
    return '<div class="card"><h3>🎅 Write a letter from Santa</h3><p class="small muted" style="margin-top:0">It will appear in the Santa tab mailbox as a new letter from the North Pole.</p><form data-form="desk">' +
      '<label class="f">To</label><input type="text" name="to" required maxlength="30" list="kidnames" placeholder="Child\'s name"><datalist id="kidnames">' + kids.map(k => '<option value="' + esc(k) + '">').join('') + '</datalist>' +
      '<label class="f">Letter type</label><select name="tpl" data-change="deskTpl">' + Object.keys(DESK_TEMPLATES).map(k => '<option value="' + k + '">' + DESK_TEMPLATES[k].label + '</option>').join('') + '</select>' +
      '<label class="f">Message</label><textarea name="text" id="deskText" style="min-height:200px;font-family:Georgia,serif">' + esc(DESK_TEMPLATES.nice.text('Your name')) + '</textarea>' +
      '<button class="btn block" style="margin-top:12px">📬 Deliver to the mailbox</button></form></div>';
  }
  function dataHTML() {
    return '<div class="card"><h3>💱 Currency symbol</h3><input type="text" maxlength="3" data-change="currency" value="' + esc(state.currency) + '" style="max-width:100px"></div>' +
      '<div class="card"><h3>💾 Backup & move to another device</h3><p class="small muted" style="margin-top:0">Everything is saved only on this device. Copy a backup code to keep it safe or move it to another phone.</p><div class="row"><button class="btn green sm" data-act="backup">Copy backup code</button><button class="btn ghost sm" data-act="restore">Restore from code</button></div></div>' +
      '<div class="card"><h3>🧹 Start fresh</h3><p class="small muted" style="margin-top:0">Deletes all lists, exchanges, letters and plans on this device.</p><button class="btn sm" data-act="reset">Erase everything</button></div>' +
      '<p class="small muted center">Santa\'s Little Helper keeps no accounts and sends no data anywhere. 🎄</p>';
  }
  function unlockFlow() {
    const a = 6 + Math.floor(Math.random() * 7), b = 11 + Math.floor(Math.random() * 9);
    let tries = 0;
    const m = modal('<div class="center"><div class="lock">🔒</div><h2>Grown-ups only</h2><p class="muted">To continue, what is <b>' + a + ' × ' + b + '</b>?</p><form id="gate"><input type="number" inputmode="numeric" name="ans" style="text-align:center;font-size:1.4rem" required><button class="btn green block" style="margin-top:10px">Unlock</button></form><p class="small muted" id="gmsg"></p></div>');
    m.el.querySelector('#gate').onsubmit = ev => {
      ev.preventDefault();
      if (Number(new FormData(ev.target).get('ans')) === a * b) {
        ui.unlocked = true; try { sessionStorage.setItem('slh-gu', '1'); } catch (e) {}
        m.close(); render();
      } else { tries++; m.el.querySelector('#gmsg').textContent = tries >= 3 ? 'Hmm! Better ask a grown-up for help. 😉' : 'Not quite, try again.'; ev.target.reset(); }
    };
  }

  // ---------- Actions ----------
  const ev = () => state.events.find(e => e.id === ui.eventId);
  const ACT = {
    quick: el => { const t = el.dataset.tab, s = el.dataset.sub; if (t === 'santa' && s) ui.santaTab = s; if (t === 'lists' && s) ui.listsTab = s; if (t === 'exchange') ui.eventId = null; go(t); },
    openMailbox: () => { ui.santaTab = 'mailbox'; go('santa'); },
    door: el => {
      const day = Number(el.dataset.day), a = D.ADVENT[day - 1];
      if (!L.adventUnlocked(day, Date.now())) { toast('No peeking! 🎅 This door opens on December ' + day + '.'); return; }
      const k = seasonYear() + '-' + day;
      if (!state.advent.includes(k)) { state.advent.push(k); save(); burstAt(el); }
      modal('<div class="center"><div style="font-size:3.5rem">' + a.emoji + '</div><div class="small muted">December ' + day + '</div><h2>' + esc(a.title) + '</h2><p>' + esc(a.tip) + '</p><button class="btn green block" data-close>Yay!</button></div>', { onClose: render });
    },
    star: el => { const k = state.nice.find(x => x.id === el.dataset.id); if (!k) return; k.stars++; save(); burstAt(el); if (k.stars === 20) setTimeout(() => modal('<div class="center"><div style="font-size:4rem">🏅</div><h2>' + esc(k.name) + ' is officially on the Nice List!</h2><p>20 kind deeds! Santa is so proud.</p><button class="btn green block" data-close>Hooray!</button></div>'), 400); render(); },
    niceMenu: el => {
      const k = state.nice.find(x => x.id === el.dataset.id); if (!k) return;
      const m = modal('<h2>' + esc(k.name) + '</h2><div class="grid"><button class="btn ghost" id="nm1">➖ Remove a star</button><button class="btn ghost" id="nm2">🔄 Reset stars</button><button class="btn" id="nm3">🗑️ Remove from meter</button><button class="btn ghost" data-close>Close</button></div>');
      m.el.querySelector('#nm1').onclick = () => { k.stars = Math.max(0, k.stars - 1); save(); m.close(); render(); };
      m.el.querySelector('#nm2').onclick = () => { k.stars = 0; save(); m.close(); render(); };
      m.el.querySelector('#nm3').onclick = () => { state.nice = state.nice.filter(x => x !== k); save(); m.close(); render(); };
    },
    listsTab: el => { ui.listsTab = el.dataset.k; render(); },
    shareList: el => {
      const l = state.lists.find(x => x.id === el.dataset.id); if (!l) return;
      const url = baseUrl() + '#wl' + L.encodeShare({ t: 'wl', n: l.name, e: l.emoji, i: l.items.map(i => [i.title, i.link || '', i.top ? 1 : 0]) });
      copyText('🎁 Here is ' + l.name + '\'s Christmas wish list: ' + url, 'Link copied! Paste it in a text or email.');
    },
    delList: el => { const l = state.lists.find(x => x.id === el.dataset.id); confirmBox('Delete ' + l.name + '\'s wish list?', 'Delete', () => { state.lists = state.lists.filter(x => x !== l); save(); render(); }); },
    topItem: el => { const l = state.lists.find(x => x.id === el.dataset.l), it = l && l.items.find(i => i.id === el.dataset.id); if (it) { it.top = !it.top; save(); render(); } },
    delItem: el => { const l = state.lists.find(x => x.id === el.dataset.l); if (l) { l.items = l.items.filter(i => i.id !== el.dataset.id); save(); render(); } },
    surprise: () => {
      const res = L.filterGifts(D.GIFTS, ui.filters); if (!res.length) return;
      const g = res[Math.floor(Math.random() * res.length)]; ui.highlight = g.id; render();
      const t = document.getElementById('gift-' + g.id); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => burstAt(t), 350); }
    },
    ideaAdd: el => {
      const g = D.GIFTS.find(x => x.id === el.dataset.id);
      const m = modal('<h2>Add "' + esc(g.name) + '" to...</h2><div class="grid">' + state.lists.map(l => '<button class="btn ghost" data-l="' + l.id + '">' + esc(l.emoji + ' ' + l.name) + '</button>').join('') + '</div><form id="nl" class="row" style="margin-top:12px"><input type="text" name="name" placeholder="New list for..." maxlength="30" required style="flex:1"><button class="btn green sm">Create & add</button></form>');
      const add = l => { l.items.push({ id: uid(), title: g.emoji + ' ' + g.name }); save(); m.close(); toast('Added to ' + l.name + '\'s list'); };
      m.el.querySelectorAll('[data-l]').forEach(b => b.onclick = () => add(state.lists.find(l => l.id === b.dataset.l)));
      m.el.querySelector('#nl').onsubmit = e => { e.preventDefault(); const l = { id: uid(), name: new FormData(e.target).get('name').trim(), emoji: '🎁', items: [] }; state.lists.push(l); add(l); };
    },
    newEvent: () => { ui.creating = true; render(); },
    cancelEvent: () => { ui.creating = false; ui.editing = false; render(); },
    openEvent: el => { ui.eventId = el.dataset.id; ui.editing = false; render(); window.scrollTo(0, 0); },
    backEvents: () => { ui.eventId = null; ui.editing = false; render(); },
    editEvent: () => { ui.editing = true; render(); },
    delEvent: el => confirmBox('Delete this exchange?', 'Delete', () => { state.events = state.events.filter(e => e.id !== el.dataset.id); ui.eventId = null; save(); render(); }),
    rmPerson: el => {
      const e = ev(), p = el.dataset.p;
      const doIt = () => { e.people = e.people.filter(x => x !== p); e.exclusions = e.exclusions.filter(x => !x.includes(p)); e.matches = null; e.sent = []; save(); render(); };
      if (e.matches) confirmBox('Removing ' + p + ' means drawing names again. Continue?', 'Remove', doIt); else doIt();
    },
    rmExcl: el => { const e = ev(); e.exclusions.splice(Number(el.dataset.i), 1); e.matches = null; save(); render(); },
    draw: () => {
      const e = ev(); const m = L.drawSecretSanta(e.people, e.exclusions);
      if (!m) { modal('<h2>🤔 Can\'t make a fair draw</h2><p>With these rules, there\'s no way for everyone to get someone. Try removing a "shouldn\'t draw" rule or adding more players.</p><button class="btn block" data-close>OK</button>'); return; }
      e.matches = m; e.drawnAt = Date.now(); e.sent = []; save(); render(); toast('🎩 Names drawn and kept secret!');
    },
    redraw: () => confirmBox('Redraw names? Links you already sent will no longer match.', 'Redraw', () => { ev().matches = null; ACT.draw(); }),
    copyMatch: el => {
      const e = ev(), p = el.dataset.p;
      const url = baseUrl() + '#ss' + L.encodeShare(matchPayload(e, p));
      e.sent = Array.from(new Set((e.sent || []).concat(p))); save();
      copyText('🎅 Hi ' + p + '! Your Secret Santa match for "' + e.name + '" is ready' + (e.budget ? ' (limit ' + money(e.budget) + ')' : '') + '. Open this when nobody is peeking: ' + url, 'Link for ' + p + ' copied! Send it just to them.');
      render();
    },
    showMatch: el => passPhone(matchPayload(ev(), el.dataset.p)),
    revealAll: () => confirmBox('Show every match? Only do this if you\'re organizing and not playing.', 'Show all', () => {
      const e = ev(); modal('<h2>All matches</h2>' + e.people.map(p => '<div class="item"><b class="grow">' + esc(p) + '</b><span>🎁 → ' + esc(e.matches[p]) + '</span></div>').join('') + '<button class="btn block" data-close style="margin-top:12px">Hide</button>');
    }),
    peekMine: el => { const p = state.myMatches[Number(el.dataset.i)]; modal(revealHTML(p) + '<div class="row" style="margin-top:14px"><button class="btn ghost sm" id="rmm">Remove</button><button class="btn green grow" data-close>Close</button></div>').el.querySelector('#rmm').onclick = function () { state.myMatches.splice(Number(el.dataset.i), 1); save(); this.closest('.modal-bg').remove(); render(); }; },
    shuffleOrder: el => { const e = ev(); if (e.people.length < 2) { toast('Add players first'); return; } e.game.order = L.shuffle(e.people); e.game.turn = 0; save(); render(); },
    turn: el => { const g = ev().game; g.turn = (g.turn + Number(el.dataset.d) + g.order.length) % g.order.length; save(); render(); },
    steal: el => { const g = ev().game, gf = g.gifts[Number(el.dataset.i)]; gf.steals++; save(); render(); toast(gf.steals >= g.maxSteals ? '🧊 ' + gf.name + ' is now frozen!' : 'Stolen! Now pick who has it.'); },
    santaTab: el => { ui.santaTab = el.dataset.k; render(); },
    demo: () => { const s = L.santaStatus(Date.now(), D.SANTA_STOPS).schedule; ui.demo = { simStart: s.depart - 60000, realStart: Date.now(), speed: (s.land - s.depart) / 90000 }; render(); },
    stopDemo: () => { ui.demo = null; render(); },
    moreWish: () => { const vals = Array.from(document.querySelectorAll('[name=wish]')).map(i => i.value); ui.wishCount++; const f = document.querySelector('[data-form=letter]'); const keep = new FormData(f); render(); const f2 = document.querySelector('[data-form=letter]'); ['name', 'age', 'deed', 'question'].forEach(n => { f2.elements[n].value = keep.get(n) || ''; }); document.querySelectorAll('[name=wish]').forEach((i, k) => { i.value = vals[k] || ''; }); },
    openLetter: el => { const l = state.letters.find(x => x.id === el.dataset.id); if (l) openLetter(l); },
    delLetter: el => { state.letters = state.letters.filter(l => l.id !== el.dataset.id); save(); el.closest('.modal-bg').remove(); render(); },
    foundElf: el => { if (!state.elf.found.includes(today())) state.elf.found.push(today()); save(); burstAt(el); setTimeout(render, 500); },
    deck: el => { ui.deck += Number(el.dataset.d); render(); },
    unlock: unlockFlow,
    lock: () => { ui.unlocked = false; try { sessionStorage.removeItem('slh-gu'); } catch (e) {} render(); },
    guTab: el => { ui.guTab = el.dataset.k; render(); },
    elfDone: el => { const k = el.dataset.k, d = state.elf.done; if (d.includes(k)) d.splice(d.indexOf(k), 1); else { d.push(k); burstAt(el); } save(); render(); },
    assign: el => { state.elf.plan[el.dataset.k] = el.dataset.m; save(); toast('Planned for ' + fmtDate(el.dataset.k) + ' 🧝'); render(); },
    planDay: el => {
      const k = el.dataset.k, cur = state.elf.plan[k];
      const m = modal('<h2>🧝 ' + fmtDate(k) + '</h2><p class="small muted">What will kids find that morning?</p><select id="pd">' + '<option value="">Nothing planned</option>' + D.ELF_MISSIONS.map(x => '<option value="' + x.id + '"' + (x.id === cur ? ' selected' : '') + '>' + esc(x.title) + '</option>').join('') + '</select><div id="pdInfo" style="margin-top:10px"></div><div class="row" style="justify-content:flex-end;margin-top:12px"><button class="btn ghost" data-close>Cancel</button><button class="btn green" id="pdSave">Save</button></div>', { noFocus: true });
      const sel = m.el.querySelector('#pd'), info = m.el.querySelector('#pdInfo');
      const show = () => { const x = missionById(sel.value); info.innerHTML = x ? missionCard(x) : ''; };
      sel.onchange = show; show();
      m.el.querySelector('#pdSave').onclick = () => { if (sel.value) state.elf.plan[k] = sel.value; else delete state.elf.plan[k]; save(); m.close(); render(); };
    },
    autoPlan: () => {
      const y = seasonYear(), plan = state.elf.plan;
      const used = new Set(Object.values(plan));
      let pool = L.shuffle(D.ELF_MISSIONS.filter(m => !used.has(m.id) && m.id !== 'goodbye'));
      let filled = 0;
      for (let d = 1; d <= 24; d++) {
        const k = y + '-12-' + pad(d); if (plan[k]) continue;
        if (d === 24 && !used.has('goodbye')) { plan[k] = 'goodbye'; filled++; continue; }
        if (!pool.length) pool = L.shuffle(D.ELF_MISSIONS.filter(m => m.id !== 'goodbye'));
        const dow = new Date(y, 11, d - 1).getDay(); // the night before
        let i = pool.findIndex(m => (dow === 5 || dow === 6) ? true : m.effort !== 'big');
        if (i < 0) i = 0;
        plan[k] = pool.splice(i, 1)[0].id; filled++;
      }
      save(); render(); toast(filled ? '✨ Planned ' + filled + ' days (bigger setups land on weekends)' : 'Every day is already planned!');
    },
    delShopPerson: el => confirmBox('Remove this person and their gifts?', 'Remove', () => { state.shop.people = state.shop.people.filter(p => p.id !== el.dataset.p); save(); render(); }),
    cycleGift: el => { const p = state.shop.people.find(x => x.id === el.dataset.p), g = p.gifts.find(x => x.id === el.dataset.g); g.status = { idea: 'bought', bought: 'wrapped', wrapped: 'idea' }[g.status]; save(); if (g.status === 'wrapped') burstAt(el); render(); },
    delGift: el => { const p = state.shop.people.find(x => x.id === el.dataset.p); p.gifts = p.gifts.filter(g => g.id !== el.dataset.g); save(); render(); },
    backup: () => copyText(JSON.stringify(state), 'Backup code copied! Keep it somewhere safe.'),
    restore: () => {
      const m = modal('<h2>Restore from backup</h2><p class="small muted">Paste your backup code. This replaces what\'s on this device.</p><textarea id="rs"></textarea><div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn ghost" data-close>Cancel</button><button class="btn green" id="rsGo">Restore</button></div>');
      m.el.querySelector('#rsGo').onclick = () => { try { const d = JSON.parse(m.el.querySelector('#rs').value); if (!d || typeof d !== 'object' || !Array.isArray(d.lists)) throw 0; state = Object.assign(DEFAULT(), d); save(); m.close(); toast('Restored! 🎄'); render(); } catch (e) { toast('That code didn\'t work. Check you copied all of it.'); } };
    },
    reset: () => confirmBox('Erase everything on this device?', 'Erase', () => { state = DEFAULT(); save(); render(); toast('All clean!'); })
  };
  const FORMS = {
    addNice: (f, d) => { state.nice.push({ id: uid(), name: d.get('name').trim(), emoji: '🧒', stars: 0 }); save(); render(); },
    addList: (f, d) => { state.lists.push({ id: uid(), name: d.get('name').trim(), emoji: d.get('emoji'), items: [] }); save(); render(); },
    addItem: (f, d) => { const l = state.lists.find(x => x.id === f.dataset.l); l.items.push({ id: uid(), title: d.get('title').trim(), link: (d.get('link') || '').trim() }); save(); render(); const nf = document.querySelector('[data-form=addItem][data-l="' + l.id + '"] input'); if (nf) nf.focus(); },
    saveEvent: (f, d) => {
      const people = Array.from(new Set(String(d.get('people')).split(/\n|,/).map(s => s.trim()).filter(Boolean)));
      const data = { name: d.get('name').trim(), type: d.get('type'), date: d.get('date'), budget: d.get('budget'), people, note: d.get('note').trim() };
      if (f.dataset.id) {
        const e = state.events.find(x => x.id === f.dataset.id);
        if (e.people.join('|') !== people.join('|')) { e.matches = null; e.exclusions = e.exclusions.filter(x => people.includes(x[0]) && people.includes(x[1])); }
        Object.assign(e, data); ui.editing = false;
      } else { const e = Object.assign({ id: uid(), exclusions: [], matches: null, sent: [] }, data); state.events.push(e); ui.eventId = e.id; }
      ui.creating = false; save(); render();
    },
    addPerson: (f, d) => {
      const e = ev(), n = d.get('name').trim();
      if (e.people.some(p => p.toLowerCase() === n.toLowerCase())) { toast(n + ' is already playing'); return; }
      const doIt = () => { e.people.push(n); e.matches = null; save(); render(); };
      if (e.matches) confirmBox('Adding ' + n + ' means drawing names again. Continue?', 'Add', doIt); else doIt();
    },
    addExcl: (f, d) => {
      const e = ev(), a = d.get('a'), b = d.get('b');
      if (a === b) { toast('Pick two different people'); return; }
      if (e.exclusions.some(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a))) return;
      e.exclusions.push([a, b]); e.matches = null; save(); render();
    },
    addGift: (f, d) => { const e = ev(); const g = e.game; g.gifts.push({ name: d.get('name').trim(), holder: g.order[g.turn] || e.people[0], steals: 0 }); save(); render(); },
    letter: (f, d) => {
      const letter = { name: d.get('name').trim(), age: d.get('age'), wishes: d.getAll('wish').map(s => s.trim()).filter(Boolean), goodDeed: d.get('deed').trim(), question: d.get('question').trim() };
      const reply = L.santaReply(letter, D.REPLY_PARTS);
      const rec = { id: uid(), ts: Date.now(), kind: 'kid', name: letter.name, age: letter.age, wishes: letter.wishes, deed: letter.goodDeed, question: letter.question, reply };
      state.letters.push(rec); save(); ui.wishCount = 3;
      const m = modal('<div class="center"><div class="envelope">✉️</div><h2>Flying to the North Pole...</h2><p class="muted">The mail elves are on it!</p></div>', { sticky: true, noFocus: true });
      setTimeout(() => { m.close(); ui.santaTab = 'mailbox'; render(); openLetter(rec); burst(window.innerWidth / 2, 140, ['❄️', '⭐', '🎅', '✨']); }, 2600);
    },
    addShopPerson: (f, d) => { state.shop.people.push({ id: uid(), name: d.get('name').trim(), budget: Number(d.get('budget')) || 0, gifts: [] }); save(); render(); },
    addShopGift: (f, d) => { const p = state.shop.people.find(x => x.id === f.dataset.p); p.gifts.push({ id: uid(), title: d.get('title').trim(), price: Number(d.get('price')) || 0, status: 'idea' }); save(); render(); },
    desk: (f, d) => { state.letters.push({ id: uid(), ts: Date.now(), kind: 'santa', to: d.get('to').trim(), text: d.get('text'), read: false }); save(); toast('📬 Delivered! It\'s waiting in the Santa tab mailbox.'); render(); }
  };
  const CHANGE = {
    filter: el => { ui.filters[el.dataset.k] = el.value; ui.highlight = null; render(); },
    maxSteals: el => { ev().game.maxSteals = Math.max(1, Number(el.value) || 3); save(); render(); },
    giftHolder: el => { ev().game.gifts[Number(el.dataset.i)].holder = el.value; save(); },
    elfName: el => { state.elf.name = el.value.trim(); save(); },
    libEffort: el => { ui.libEffort = el.value; ui.libOpen = true; render(); },
    shopBudget: el => { state.shop.budget = el.value; save(); render(); },
    importList: el => {
      const l = state.lists.find(x => x.id === el.value), p = state.shop.people.find(x => x.id === el.dataset.p); if (!l || !p) return;
      l.items.forEach(i => { if (!p.gifts.some(g => g.title === i.title)) p.gifts.push({ id: uid(), title: i.title, price: 0, status: 'idea' }); });
      save(); render(); toast('Imported ' + l.items.length + ' wishes as ideas');
    },
    deskTpl: el => { const f = el.form, n = f.elements.to.value.trim() || 'Your name'; f.elements.text.value = DESK_TEMPLATES[el.value].text(n); },
    currency: el => { state.currency = el.value.trim() || '$'; save(); }
  };
  document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el, e); } });
  document.addEventListener('submit', e => { const f = e.target; if (f.dataset && FORMS[f.dataset.form]) { e.preventDefault(); FORMS[f.dataset.form](f, new FormData(f)); } });
  document.addEventListener('change', e => { const el = e.target; if (el.dataset && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el); });

  // ---------- Shared wish list import ----------
  function showSharedList(code) {
    const p = L.decodeShare(code);
    if (!p || p.t !== 'wl') { setTimeout(() => toast('Hmm, that wish list link looks broken.'), 100); return; }
    setTimeout(() => {
      const m = modal('<div class="center"><div style="font-size:3rem">' + esc(p.e || '🎁') + '</div><h2>' + esc(p.n) + '\'s Wish List</h2></div>' + (p.i || []).map(([t, link, top]) => '<div class="item"><span class="e">' + (top ? '⭐' : '🎁') + '</span><div class="grow"><div class="t">' + esc(t) + '</div>' + (link ? '<a class="small" href="' + esc(safeUrl(link)) + '" target="_blank" rel="noopener">' + esc(shortUrl(link)) + '</a>' : '') + '</div></div>').join('') +
        '<button class="btn green block" id="slSave" style="margin-top:12px">Save to my wish lists</button><button class="btn ghost block" data-close style="margin-top:8px">Close</button>', { noFocus: true });
      m.el.querySelector('#slSave').onclick = () => { state.lists.push({ id: uid(), name: p.n, emoji: p.e || '🎁', items: (p.i || []).map(([t, link, top]) => ({ id: uid(), title: t, link, top: !!top })) }); save(); m.close(); ui.listsTab = 'lists'; render(); toast('Saved!'); };
    }, 50);
  }

  // ---------- Live updates ----------
  function tick() {
    if (ui.tab === 'home') { const c = document.getElementById('cd'); if (c) c.innerHTML = countdownHTML(); }
    if (ui.tab === 'santa' && ui.santaTab === 'tracker') { const t = document.getElementById('trk'); if (t) t.innerHTML = trackerHTML(); }
  }
  setInterval(tick, 1000);

  // ---------- Snow, install, offline ----------
  (function snow() { const s = $('#snow'); let h = ''; for (let i = 0; i < 18; i++) h += '<i style="left:' + Math.random() * 100 + '%;font-size:' + (8 + Math.random() * 12) + 'px;animation-duration:' + (9 + Math.random() * 12) + 's;animation-delay:-' + Math.random() * 20 + 's">❄</i>'; s.innerHTML = h; })();
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.remove('hide'); });
  $('#installBtn').addEventListener('click', () => { if (deferred) { deferred.prompt(); deferred = null; $('#installBtn').classList.add('hide'); } });
  try { if ('serviceWorker' in navigator && location.protocol === 'https:' && window.top === window) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}

  const VIEWS = { home: viewHome, lists: viewLists, exchange: viewExchange, santa: viewSanta, elf: viewElf, grownups: viewGrownups };
  window.addEventListener('hashchange', route);
  // Tapping the tab you're already on goes back to its start.
  nav.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || a.getAttribute('href') !== '#' + ui.tab) return;
    if (ui.tab === 'exchange') { ui.eventId = null; ui.editing = false; ui.creating = false; }
    render(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  route();
})();

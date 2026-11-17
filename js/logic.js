/* Santa's Little Helper: pure logic (no DOM). Works in the browser (window.SLH) and Node (module.exports). */
(function (root) {
  'use strict';

  // ---------- Random ----------
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- Secret Santa ----------
  /**
   * names: string[] (unique, trimmed), exclusions: [a, b][] (symmetric: a can't get b and b can't get a)
   * Returns { giver: receiver } or null if impossible.
   */
  function drawSecretSanta(names, exclusions, rng) {
    rng = rng || Math.random;
    const people = names.map(n => String(n).trim()).filter(Boolean);
    if (people.length < 2) return null;
    if (new Set(people.map(p => p.toLowerCase())).size !== people.length) return null;
    const blocked = new Set();
    (exclusions || []).forEach(([a, b]) => {
      if (!a || !b) return;
      blocked.add(a.toLowerCase() + '|' + b.toLowerCase());
      blocked.add(b.toLowerCase() + '|' + a.toLowerCase());
    });
    const ok = (g, r) => g !== r && !blocked.has(g.toLowerCase() + '|' + r.toLowerCase());
    // Most constrained givers first, ties shuffled.
    const givers = shuffle(people, rng).sort((x, y) =>
      people.filter(r => ok(x, r)).length - people.filter(r => ok(y, r)).length);
    const result = {};
    const used = new Set();
    let steps = 0;
    function dfs(i) {
      if (i === givers.length) return true;
      if (++steps > 200000) return false;
      const g = givers[i];
      for (const r of shuffle(people, rng)) {
        if (used.has(r) || !ok(g, r)) continue;
        used.add(r); result[g] = r;
        if (dfs(i + 1)) return true;
        used.delete(r); delete result[g];
      }
      return false;
    }
    return dfs(0) ? result : null;
  }

  // ---------- Share links (letters + digits only, lightly scrambled so kids can't read them) ----------
  const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const KEY = 'jingle-all-the-way';
  function toBytes(str) { return new TextEncoder().encode(str); }
  function fromBytes(bytes) { return new TextDecoder().decode(bytes); }
  function scramble(bytes) {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ KEY.charCodeAt(i % KEY.length);
    return out;
  }
  function encodeShare(obj) {
    const bytes = scramble(toBytes(JSON.stringify(obj)));
    let n = 1n; // leading 1 marker keeps leading zero bytes
    for (const b of bytes) n = (n << 8n) | BigInt(b);
    let s = '';
    while (n > 0n) { s = B62[Number(n % 62n)] + s; n /= 62n; }
    return s;
  }
  function decodeShare(str) {
    try {
      if (!str || !/^[0-9A-Za-z]+$/.test(str)) return null;
      let n = 0n;
      for (const c of str) n = n * 62n + BigInt(B62.indexOf(c));
      const bytes = [];
      while (n > 1n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
      if (n !== 1n) return null;
      return JSON.parse(fromBytes(scramble(Uint8Array.from(bytes))));
    } catch (e) { return null; }
  }

  // ---------- Dates ----------
  const DAY = 86400000;
  function msUntilChristmas(nowMs) {
    const now = new Date(nowMs);
    const y = now.getFullYear();
    const xmas = new Date(y, 11, 25).getTime();
    const after = new Date(y, 11, 26).getTime();
    if (nowMs >= xmas && nowMs < after) return 0;
    const target = nowMs < xmas ? xmas : new Date(y + 1, 11, 25).getTime();
    return target - nowMs;
  }
  function splitDuration(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
  }
  /** Advent door `day` (1-24) opens on that date in December. Locked Jan-Nov. */
  function adventUnlocked(day, nowMs) {
    const now = new Date(nowMs);
    return now.getMonth() === 11 && now.getDate() >= day;
  }

  // ---------- Santa Tracker ----------
  // Each stop is visited at local midnight. stops: [{name, offset (hours), lat, lon}]
  function buildSchedule(stops, year) {
    const base = Date.UTC(year, 11, 25, 0, 0, 0);
    // East to west; stops sharing a time zone are spread across that hour.
    const sorted = stops.slice().sort((a, b) => b.offset - a.offset || b.lon - a.lon);
    const sched = sorted.map(s => {
      const group = sorted.filter(x => x.offset === s.offset);
      const k = group.indexOf(s);
      return Object.assign({}, s, { at: base - s.offset * 3600000 + k * Math.floor(50 / group.length) * 60000 });
    });
    const depart = sched[0].at - 30 * 60000;
    const land = sched[sched.length - 1].at + 60 * 60000;
    return { stops: sched, depart, land };
  }
  const NORTH_POLE = { name: 'North Pole', lat: 89, lon: 0 };
  const TOTAL_GIFTS = 2400000000;
  function lerpLon(a, b, t) {
    let d = b - a;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    let r = a + d * t;
    if (r > 180) r -= 360; if (r < -180) r += 360;
    return r;
  }
  function santaStatus(nowMs, stops) {
    const year = new Date(nowMs).getUTCFullYear();
    let s = buildSchedule(stops, year);
    if (nowMs > s.land + 3 * DAY) s = buildSchedule(stops, year + 1); // after the season, look ahead
    if (nowMs < s.depart) {
      return { phase: 'preparing', msUntilTakeoff: s.depart - nowMs, delivered: 0, pos: NORTH_POLE, stop: null, next: s.stops[0], schedule: s };
    }
    if (nowMs >= s.land) {
      return { phase: 'home', delivered: TOTAL_GIFTS, pos: NORTH_POLE, stop: null, next: null, schedule: s };
    }
    const span = s.land - s.depart;
    const frac = (nowMs - s.depart) / span;
    const delivered = Math.round(TOTAL_GIFTS * Math.min(1, (nowMs - s.depart) / (s.stops[s.stops.length - 1].at - s.depart)));
    let idx = -1;
    for (let i = 0; i < s.stops.length; i++) if (s.stops[i].at <= nowMs) idx = i;
    if (idx === -1) { // leaving the pole
      const t = (nowMs - s.depart) / (s.stops[0].at - s.depart);
      const n = s.stops[0];
      return { phase: 'flying', progress: frac, delivered, stop: NORTH_POLE, next: n, pos: { lat: NORTH_POLE.lat + (n.lat - NORTH_POLE.lat) * t, lon: lerpLon(NORTH_POLE.lon, n.lon, t) }, schedule: s };
    }
    const cur = s.stops[idx];
    const next = s.stops[idx + 1] || null;
    if (!next) {
      const t = (nowMs - cur.at) / (s.land - cur.at);
      return { phase: 'returning', progress: frac, delivered: TOTAL_GIFTS, stop: cur, next: NORTH_POLE, pos: { lat: cur.lat + (NORTH_POLE.lat - cur.lat) * t, lon: lerpLon(cur.lon, NORTH_POLE.lon, t) }, schedule: s };
    }
    const t = (nowMs - cur.at) / (next.at - cur.at);
    return { phase: 'flying', progress: frac, delivered, stop: cur, next, pos: { lat: cur.lat + (next.lat - cur.lat) * t, lon: lerpLon(cur.lon, next.lon, t) }, schedule: s };
  }

  // ---------- Letters from Santa ----------
  function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
  function listJoin(items) {
    if (items.length <= 1) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }
  /** Turn a child's first-person words into Santa's second person: "helped my brother" -> "helped your brother". */
  function toSecondPerson(text) {
    const map = { i: 'you', me: 'you', my: 'your', mine: 'yours', myself: 'yourself', "i'm": "you're", "i've": "you've", "i'll": "you'll", "i'd": "you'd", am: 'are' };
    return text.replace(/\b(i'm|i've|i'll|i'd|myself|mine|my|me|i|am)\b/gi, w => map[w.toLowerCase()]);
  }
  /** letter: {name, age, wishes: string[], goodDeed, question}; parts: template data from data.js */
  function santaReply(letter, parts, seed) {
    const rng = mulberry32(seed != null ? seed : hashString(JSON.stringify(letter)));
    const name = (letter.name || 'friend').trim() || 'friend';
    const fill = s => s.replace(/\{name\}/g, name).replace(/\{age\}/g, letter.age || '');
    const out = [];
    out.push(fill(pick(parts.greetings, rng)));
    const p = [];
    p.push(fill(pick(parts.openers, rng)));
    if (letter.age) p.push(fill(pick(parts.ageLines, rng)));
    out.push(p.join(' '));
    if (letter.goodDeed && letter.goodDeed.trim()) {
      out.push(pick(parts.goodDeed, rng).replace('{deed}', toSecondPerson(letter.goodDeed.trim().replace(/[.!]+$/, ''))));
    } else {
      out.push(fill(pick(parts.noDeed, rng)));
    }
    const wishes = (letter.wishes || []).map(w => w.trim()).filter(Boolean);
    if (wishes.length) {
      out.push(pick(parts.wishes, rng).replace('{wishes}', listJoin(wishes.map(w => toSecondPerson(w.replace(/[.!]+$/, ''))))));
    }
    const q = (letter.question || '').trim();
    if (q) {
      const lower = q.toLowerCase();
      const match = parts.answers.find(a => a.keys.some(k => lower.includes(k)));
      out.push(pick(parts.questionIntro, rng) + ' ' + (match ? pick(match.lines, rng) : pick(parts.defaultAnswers, rng)));
    }
    out.push(fill(pick(parts.closers, rng)));
    out.push(pick(parts.signoffs, rng) + '\nSanta Claus');
    out.push('P.S. ' + fill(pick(parts.postscripts, rng)));
    return out.join('\n\n');
  }

  // ---------- Gift ideas ----------
  /** filters: {age: 'any'|groupId, interest: 'any'|tag, max: number|null} */
  function filterGifts(catalog, filters) {
    filters = filters || {};
    return catalog.filter(g =>
      (!filters.age || filters.age === 'any' || g.ages.includes(filters.age)) &&
      (!filters.interest || filters.interest === 'any' || g.tags.includes(filters.interest)) &&
      (filters.max == null || filters.max === '' || g.price <= Number(filters.max)));
  }

  const SLH = { mulberry32, hashString, shuffle, drawSecretSanta, encodeShare, decodeShare, msUntilChristmas, splitDuration, adventUnlocked, buildSchedule, santaStatus, santaReply, toSecondPerson, filterGifts, TOTAL_GIFTS, listJoin };
  if (typeof module !== 'undefined' && module.exports) module.exports = SLH;
  else root.SLH = SLH;
})(typeof window !== 'undefined' ? window : globalThis);

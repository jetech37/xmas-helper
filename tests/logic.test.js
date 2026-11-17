const assert = require('assert');
const L = require('../js/logic.js');
const D = require('../js/data.js');

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log('ok  ', name); } catch (e) { console.error('FAIL', name, '\n', e); process.exitCode = 1; } }

test('secret santa: everyone gives and receives once, never self', () => {
  const names = ['Ann', 'Ben', 'Cal', 'Dee', 'Eve'];
  for (let s = 0; s < 50; s++) {
    const m = L.drawSecretSanta(names, [], L.mulberry32(s));
    assert.deepStrictEqual(Object.keys(m).sort(), names.slice().sort());
    assert.deepStrictEqual(Object.values(m).sort(), names.slice().sort());
    names.forEach(n => assert.notStrictEqual(m[n], n));
  }
});
test('secret santa: exclusions respected both ways', () => {
  const names = ['Ann', 'Ben', 'Cal', 'Dee'];
  for (let s = 0; s < 50; s++) {
    const m = L.drawSecretSanta(names, [['Ann', 'Ben'], ['Cal', 'Dee']], L.mulberry32(s));
    assert(m);
    assert.notStrictEqual(m.Ann, 'Ben'); assert.notStrictEqual(m.Ben, 'Ann');
    assert.notStrictEqual(m.Cal, 'Dee'); assert.notStrictEqual(m.Dee, 'Cal');
  }
});
test('secret santa: impossible returns null quickly', () => {
  assert.strictEqual(L.drawSecretSanta(['A', 'B'], [['A', 'B']]), null);
  assert.strictEqual(L.drawSecretSanta(['A'], []), null);
  assert.strictEqual(L.drawSecretSanta(['A', 'a'], []), null);
  const many = Array.from({ length: 12 }, (_, i) => 'P' + i);
  const ex = many.slice(1).map(p => ['P0', p]);
  assert.strictEqual(L.drawSecretSanta(many, ex), null);
});
test('share links round trip with unicode, letters+digits only', () => {
  const obj = { e: 'Família Xmas 🎄', g: 'Zoë', r: "O'Neil", b: 25, d: '2026-12-20' };
  const s = L.encodeShare(obj);
  assert(/^[0-9A-Za-z]+$/.test(s));
  assert.deepStrictEqual(L.decodeShare(s), obj);
  assert(!s.includes('Zo'));
  assert.strictEqual(L.decodeShare('not-valid!'), null);
  assert.strictEqual(L.decodeShare(''), null);
});
test('countdown', () => {
  assert.strictEqual(L.msUntilChristmas(new Date(2026, 11, 24).getTime()), 86400000);
  assert.strictEqual(L.msUntilChristmas(new Date(2026, 11, 25, 15).getTime()), 0);
  assert(L.msUntilChristmas(new Date(2026, 11, 27).getTime()) > 300 * 86400000);
});
test('advent locks', () => {
  assert(L.adventUnlocked(1, new Date(2026, 11, 1).getTime()));
  assert(!L.adventUnlocked(2, new Date(2026, 11, 1).getTime()));
  assert(!L.adventUnlocked(1, new Date(2026, 10, 30).getTime()));
  assert(!L.adventUnlocked(1, new Date(2027, 0, 3).getTime()));
});
test('santa tracker phases', () => {
  const st = D.SANTA_STOPS;
  const pre = L.santaStatus(Date.UTC(2026, 10, 17), st);
  assert.strictEqual(pre.phase, 'preparing');
  const early = L.santaStatus(Date.UTC(2026, 11, 24, 10, 30), st);
  assert.strictEqual(early.phase, 'flying');
  assert(early.delivered > 0);
  const nyc = L.santaStatus(Date.UTC(2026, 11, 25, 5, 10), st);
  assert.strictEqual(nyc.stop.name, 'New York City, USA');
  const home = L.santaStatus(Date.UTC(2026, 11, 26), st);
  assert.strictEqual(home.phase, 'home');
  const jan = L.santaStatus(Date.UTC(2027, 0, 15), st);
  assert.strictEqual(jan.phase, 'preparing');
  for (let h = 0; h < 30; h += 0.25) {
    const s = L.santaStatus(Date.UTC(2026, 11, 24, 8) + h * 3600000, st);
    assert(Number.isFinite(s.pos.lat) && Number.isFinite(s.pos.lon) && s.pos.lon >= -180 && s.pos.lon <= 180);
  }
});
test('santa reply personalises and handles empty letter', () => {
  const r = L.santaReply({ name: 'Maya', age: '6', wishes: ['a red bike', 'slime'], goodDeed: 'helped my brother', question: 'How are the reindeer?' }, D.REPLY_PARTS, 1);
  assert(r.includes('Maya')); assert(r.includes('a red bike and slime')); assert(r.includes('helped your brother'));
  assert(/reindeer|Rudolph/i.test(r));
  const e = L.santaReply({}, D.REPLY_PARTS, 2);
  assert(e.includes('friend')); assert(!e.includes('undefined'));
});
test('gift filters', () => {
  const g = L.filterGifts(D.GIFTS, { age: 'teen', interest: 'music', max: 50 });
  assert(g.length > 0);
  g.forEach(x => { assert(x.ages.includes('teen')); assert(x.tags.includes('music')); assert(x.price <= 50); });
  assert.strictEqual(L.filterGifts(D.GIFTS, {}).length, D.GIFTS.length);
});
test('pronouns flip for Santa', () => {
  assert.strictEqual(L.toSecondPerson('I helped my brother and I am kind to me'), 'you helped your brother and you are kind to you');
  assert.strictEqual(L.toSecondPerson('my own phone'), 'your own phone');
  assert.strictEqual(L.toSecondPerson('a mini drone'), 'a mini drone');
  const r = L.santaReply({ name: 'Leo', goodDeed: 'I shared my toys', wishes: ['my own puppy'] }, D.REPLY_PARTS, 3);
  assert(r.includes('you shared your toys')); assert(r.includes('your own puppy'));
});
console.log(`\n${passed} passed`);

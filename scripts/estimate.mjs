// Draws assets/estimate.svg: node scripts/estimate.mjs
// What leaving a conversation costs, by when you come back, with and without Cache Keep.
// Units: one full rewrite of the conversation = 100%.
// Prices relative to the normal input price: one-hour cache write 2, cache read 0.1, output 5.
// Compaction measured on a real conversation: 310,523 tokens -> 65,219 tokens after.
import { writeFileSync } from 'node:fs'

const N = 300_000          // conversation size when you leave
const AFTER = 65_000       // size right after compaction: system prompt and tools, plus the summary
const SUMMARY = 13_000     // the summary, paid as output
const WRITE = 2, READ = 0.1, OUT = 5
const PING_H = 55 / 60, PINGS = 5, COMPACT_H = (PINGS + 1) * PING_H, HOURS = 12
const rewrite = WRITE * N
const share = (cost) => cost / rewrite

// Cost if you come back after t hours: what was spent while away, plus your first message back.
function without(t) { return share(t < 1 ? READ * N : WRITE * N) }
function withKeep(t) {
  if (t < COMPACT_H) return share(Math.floor(t / PING_H) * READ * N + READ * N)
  return share(PINGS * READ * N + READ * N + OUT * SUMMARY + WRITE * AFTER)
}
const atTen = { without: without(10), with: withKeep(10) }
console.log({ atTen, less: 1 - atTen.with / atTen.without })

const C = { without: '#eb6834', with: '#2a78d6', ink: '#1f2a28', sub: '#5c6b67', grid: '#e3e6e3', bg: '#fcfcfb', save: '#2a78d6' }
const W = 1400, H = 640, x0 = 150, x1 = 1230, y0 = 520, y1 = 170
const X = (h) => x0 + (h / HOURS) * (x1 - x0)
const Y = (v) => y0 - (v / 1.1) * (y0 - y1)
const steps = (f) => {
  const pts = []
  let prev
  for (let i = 0; i <= HOURS * 600; i++) {
    const t = i / 600, v = f(t)
    if (prev !== undefined && v !== prev) pts.push([t, prev])
    pts.push([t, v]); prev = v
  }
  return pts.filter((p, i, a) => i === 0 || i === a.length - 1 || p[1] !== a[i - 1][1] || p[1] !== a[i + 1][1])
}
const path = (pts) => 'M' + pts.map(([t, v]) => `${X(t).toFixed(1)} ${Y(v).toFixed(1)}`).join('L')
const pct = (v) => `${Math.round(v * 100)}%`

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">What stepping away costs, by when you come back</title>
  <desc id="desc">A 300k-token conversation. The cost of coming back after a given number of hours, counting what was spent while away and your first message back, as a share of one full rewrite. Without Cache Keep it is 5% within the first hour, then 100%. With Cache Keep it rises 5% with each ping, to 30% at five hours, then the compaction at about five and a half hours brings it to ${pct(withKeep(6))}, where it stays. Coming back after 10 hours costs ${pct(atTen.without)} without Cache Keep and ${pct(atTen.with)} with it.</desc>
  <rect width="${W}" height="${H}" rx="28" fill="${C.bg}"/>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="60" y="64" font-size="30" font-weight="700" fill="${C.ink}">What stepping away costs, by when you come back</text>
    <text x="60" y="102" font-size="22" fill="${C.sub}">A 300k-token conversation. What is spent while you are away plus your first message back; one full rewrite = 100%.</text>
    <rect x="60" y="124" width="20" height="20" rx="4" fill="${C.without}"/><text x="90" y="141" font-size="21" fill="${C.ink}">Without Cache Keep</text>
    <rect x="320" y="124" width="20" height="20" rx="4" fill="${C.with}"/><text x="350" y="141" font-size="21" fill="${C.ink}">With Cache Keep</text>`
for (const v of [0, 0.25, 0.5, 0.75, 1]) {
  s += `\n    <path d="M${x0} ${Y(v)}H${x1}" stroke="${C.grid}" stroke-width="2"/><text x="${x0 - 14}" y="${Y(v) + 7}" text-anchor="end" font-size="20" fill="${C.sub}">${pct(v)}</text>`
}
for (let h = 0; h <= HOURS; h += 2) s += `\n    <text x="${X(h)}" y="${y0 + 34}" text-anchor="middle" font-size="20" fill="${C.sub}">${h}h</text>`
s += `\n    <text x="${x1}" y="${y0 + 70}" text-anchor="end" font-size="20" fill="${C.sub}">hours away</text>`
// the saving at 10 hours
const xt = X(10)
s += `\n    <path d="M${xt} ${Y(atTen.without)}V${Y(atTen.with)}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 6"/>`
s += `\n    <rect x="${xt + 14}" y="${(Y(atTen.without) + Y(atTen.with)) / 2 - 24}" width="150" height="44" rx="10" fill="#fff" stroke="${C.grid}" stroke-width="2"/>`
s += `\n    <text x="${xt + 89}" y="${(Y(atTen.without) + Y(atTen.with)) / 2 + 6}" text-anchor="middle" font-size="22" font-weight="700" fill="${C.ink}">${100 - Math.round(atTen.with * 100)}% less</text>`
s += `\n    <path d="${path(steps(without))}" fill="none" stroke="${C.without}" stroke-width="4" stroke-linejoin="round"/>`
s += `\n    <path d="${path(steps(withKeep))}" fill="none" stroke="${C.with}" stroke-width="4" stroke-linejoin="round"/>`
s += `\n    <text x="${x1 + 12}" y="${Y(atTen.without) + 7}" font-size="21" font-weight="700" fill="${C.ink}">${pct(atTen.without)}</text>`
s += `\n    <text x="${x1 + 12}" y="${Y(atTen.with) + 7}" font-size="21" font-weight="700" fill="${C.ink}">${pct(atTen.with)}</text>`
s += `\n    <text x="${X(0.5)}" y="${Y(1) - 14}" font-size="19" fill="${C.sub}">cache gone after 1h</text>`
s += `\n    <text x="${X(2.2)}" y="${Y(0.3) - 14}" font-size="19" fill="${C.sub}">a ping every 55 min</text>`
s += `\n    <text x="${X(COMPACT_H) + 10}" y="${Y(withKeep(6)) + 34}" font-size="19" fill="${C.sub}">compaction, about 5.5h</text>`
s += `\n  </g>\n</svg>\n`
writeFileSync(new URL('../assets/estimate.svg', import.meta.url), s)

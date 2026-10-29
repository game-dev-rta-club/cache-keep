// Draws assets/estimate.svg: node scripts/estimate.mjs
// What leaving a conversation for 10 hours costs, with and without Cache Keep:
// the total spent so far, rising at each request.
// Units: one full rewrite of the conversation = 100%.
// Prices relative to the normal input price: one-hour cache write 2, cache read 0.1, output 5.
// Compaction measured on a real conversation: 310,523 tokens -> 65,219 tokens after.
import { writeFileSync } from 'node:fs'

const N = 300_000          // conversation size when you leave
const AFTER = 65_000       // size right after compaction: system prompt and tools, plus the summary
const SUMMARY = 13_000     // the summary, paid as output
const WRITE = 2, READ = 0.1, OUT = 5
const PING_H = 55 / 60, PINGS = 5, COMPACT_H = (PINGS + 1) * PING_H, BACK_H = 10, HOURS = 12
const share = (cost) => cost / (WRITE * N)

// What each request costs, and when it is sent.
const ping = share(READ * N)
const compact = share(READ * N + OUT * SUMMARY)
const backWithout = share(WRITE * N)
const backWith = share(WRITE * AFTER)
const without = [[BACK_H, backWithout]]
const withKeep = [...Array.from({ length: PINGS }, (_, i) => [(i + 1) * PING_H, ping]), [COMPACT_H, compact], [BACK_H, backWith]]
const total = (events) => events.reduce((sum, [, cost]) => sum + cost, 0)
const pct = (v) => `${Math.round(v * 100)}%`
const less = 100 - Math.round(total(withKeep) * 100)
console.log({ ping, compact, backWith, away: total(withKeep) - backWith, with: total(withKeep), without: total(without), less })

// The same colors as the other pictures in the README.
const C = { bg: '#f7f5ee', ink: '#153d3b', sub: '#56726d', without: '#c8692c', with: '#21867e', ping: '#efb44b', pingText: '#8a5a12', faint: '#dfe3dc' }
const W = 1400, H = 600, x0 = 110, x1 = 1180, y0 = 450, y1 = 170
const X = (h) => x0 + (h / HOURS) * (x1 - x0)
const Y = (v) => y0 - v * (y0 - y1)
// A step line: flat while nothing is sent, straight up when a request is sent.
// Both returns are at 10 hours; each is drawn a few pixels to its side so both show.
const at = (h, side = 0) => X(h) + (h === BACK_H ? side * 8 : 0)
function line(events, side) {
  let v = 0, d = `M${X(0)} ${Y(0)}`
  for (const [h, cost] of events) { d += `H${at(h, side).toFixed(1)}`; v += cost; d += `V${Y(v).toFixed(1)}` }
  return d + `H${X(HOURS)}`
}
const after = (events, h) => total(events.filter(([t]) => t <= h))

let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">What 10 hours away costs</title>
  <desc id="desc">A 300k-token conversation you leave for 10 hours: the total spent so far, as a share of one full rewrite. Without Cache Keep nothing is spent while you are away, and your first message back rewrites the whole conversation: ${pct(total(without))}. With Cache Keep, five pings add ${pct(ping)} each, the compaction at about five and a half hours adds ${pct(compact)}, and your first message back writes only the summary, adding ${pct(backWith)}: ${pct(total(withKeep))} in all, ${less}% less.</desc>
  <rect width="${W}" height="${H}" rx="28" fill="${C.bg}"/>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="70" y="70" font-size="22" font-weight="700" letter-spacing="2" fill="${C.sub}">WHAT 10 HOURS AWAY COSTS</text>
    <text x="70" y="106" font-size="22" fill="${C.sub}">A 300k-token conversation. Total spent so far; one full rewrite = 100%.</text>
    <path d="M880 62H920" stroke="${C.without}" stroke-width="7" stroke-linecap="round"/><text x="934" y="70" font-size="22" fill="${C.ink}">Without Cache Keep</text>
    <path d="M880 100H920" stroke="${C.with}" stroke-width="7" stroke-linecap="round"/><text x="934" y="108" font-size="22" fill="${C.ink}">With Cache Keep</text>
    <path d="M${x0} ${Y(1)}H${x1}" stroke="${C.faint}" stroke-width="2" stroke-dasharray="4 8"/>`
// the time line below, as in the other pictures
s += `\n    <path d="M${x0 - 40} ${y0 + 40}H${x1 + 40}" stroke="${C.sub}" stroke-width="3"/>`
for (let h = 2; h <= 8; h += 2) s += `\n    <text x="${X(h)}" y="${y0 + 76}" text-anchor="middle" font-size="20" fill="${C.sub}">${h}h</text>`
s += `\n    <text x="${X(0)}" y="${y0 + 80}" text-anchor="middle" font-size="25" font-weight="700" fill="${C.ink}">You stop</text>`
s += `\n    <text x="${X(BACK_H)}" y="${y0 + 80}" text-anchor="middle" font-size="25" font-weight="700" fill="${C.ink}">You come back</text>`
s += `\n    <text x="${X(BACK_H)}" y="${y0 + 110}" text-anchor="middle" font-size="20" fill="${C.sub}">10h</text>`
// the two lines, with a dot where each request is sent
s += `\n    <path d="${line(without, -1)}" fill="none" stroke="${C.without}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`
s += `\n    <path d="${line(withKeep, 1)}" fill="none" stroke="${C.with}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`
for (let i = 1; i <= PINGS; i++) s += `\n    <circle cx="${X(i * PING_H).toFixed(1)}" cy="${Y(after(withKeep, i * PING_H)).toFixed(1)}" r="11" fill="${C.ping}"/>`
s += `\n    <circle cx="${X(COMPACT_H).toFixed(1)}" cy="${Y(after(withKeep, COMPACT_H)).toFixed(1)}" r="13" fill="${C.with}" stroke="${C.bg}" stroke-width="4"/>`
s += `\n    <circle cx="${at(BACK_H, -1)}" cy="${Y(total(without))}" r="13" fill="${C.without}" stroke="${C.bg}" stroke-width="4"/>`
s += `\n    <circle cx="${at(BACK_H, 1)}" cy="${Y(total(withKeep))}" r="13" fill="${C.with}" stroke="${C.bg}" stroke-width="4"/>`
// what each step is
s += `\n    <text x="${X(3 * PING_H)}" y="${Y(after(withKeep, 4.9)) - 40}" text-anchor="middle" font-size="24" fill="${C.pingText}">5 pings, ${pct(ping)} each</text>`
const cy = Y(after(withKeep, COMPACT_H)) - 70
s += `\n    <rect x="${X(COMPACT_H) - 90}" y="${cy - 30}" width="180" height="48" rx="14" fill="${C.with}"/>`
s += `\n    <text x="${X(COMPACT_H)}" y="${cy + 3}" text-anchor="middle" font-size="24" font-weight="700" fill="#fff">Compact +${pct(compact)}</text>`
const label = (y, what, cost) => `\n    <text x="${X(BACK_H) - 34}" y="${y}" text-anchor="end" font-size="22" font-weight="700" fill="${C.ink}">${what} <tspan font-weight="400" fill="${C.sub}">+${pct(cost)}</tspan></text>`
s += label(Y(0.78), 'Write it all again', backWithout)
s += label(Y((after(withKeep, COMPACT_H) + total(withKeep)) / 2) + 8, 'Write only the summary', backWith)
// the totals and the saving
s += `\n    <rect x="${x1 + 16}" y="${Y(total(without)) - 24}" width="96" height="48" rx="24" fill="${C.without}"/><text x="${x1 + 64}" y="${Y(total(without)) + 9}" text-anchor="middle" font-size="26" font-weight="700" fill="#fff">${pct(total(without))}</text>`
s += `\n    <rect x="${x1 + 16}" y="${Y(total(withKeep)) - 24}" width="96" height="48" rx="24" fill="${C.with}"/><text x="${x1 + 64}" y="${Y(total(withKeep)) + 9}" text-anchor="middle" font-size="26" font-weight="700" fill="#fff">${pct(total(withKeep))}</text>`
const xm = X(11), ym = (Y(total(without)) + Y(total(withKeep))) / 2
s += `\n    <path d="M${xm} ${Y(total(without)) + 14}V${Y(total(withKeep)) - 14}" stroke="${C.ink}" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>`
s += `\n    <rect x="${xm - 72}" y="${ym - 25}" width="144" height="50" rx="25" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`
s += `\n    <text x="${xm}" y="${ym + 9}" text-anchor="middle" font-size="25" font-weight="700" fill="${C.ink}">${less}% less</text>`
s += `\n  </g>\n</svg>\n`
writeFileSync(new URL('../assets/estimate.svg', import.meta.url), s)

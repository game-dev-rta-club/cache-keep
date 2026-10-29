# Changelog

## 0.0.5 — 2026-10-29

- When Claude Code exits, leave the background `sleep` that holds a Desktop conversation open to end with it, instead of trying to stop it and logging "could not stop task". After a `/clear` or a resume it is still stopped.

## 0.0.4 — 2026-10-29

- Redraw the estimate: the total spent while you leave a conversation for 10 hours, rising when each ping, the compaction and your first message back are sent. Shorten the text beside it. Leave the plugin's behavior unchanged.

## 0.0.3 — 2026-10-29

- Add an estimate to the README: a chart of what coming back after a given number of hours costs, with and without Cache Keep, for a 300k-token conversation, and the saving at other sizes. `scripts/estimate.mjs` draws the chart. Leave the plugin's behavior unchanged.

## 0.0.2 — 2026-10-29

- Rewrite the README to explain the idea in three pictures: what an hour away costs, how a ping keeps the cache, and the compaction if you stay away. Leave the plugin's behavior unchanged.

## 0.0.1 — 2026-10-29

- First release. Ping an idle conversation every 55 minutes so its one-hour prompt cache stays warm, up to five times, then compact it when that leaves under 60% of it. Retry a failed ping each minute three times, and send nothing once an hour has passed since the last request.
- In Claude Desktop, hold the idle conversation open with a background `sleep` while pings are due, so Desktop does not stop it when memory runs short.
- Settings per user in Claude Code's plugin settings; a log per conversation in `~/.claude/cache-keep/`.

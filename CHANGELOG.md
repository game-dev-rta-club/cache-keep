# Changelog

## 0.0.2 — 2026-10-29

- Rewrite the README to explain the idea in three pictures: what an hour away costs, how a ping keeps the cache, and the compaction if you stay away. Leave the plugin's behavior unchanged.

## 0.0.1 — 2026-10-29

- First release. Ping an idle conversation every 55 minutes so its one-hour prompt cache stays warm, up to five times, then compact it when that leaves under 60% of it. Retry a failed ping each minute three times, and send nothing once an hour has passed since the last request.
- In Claude Desktop, hold the idle conversation open with a background `sleep` while pings are due, so Desktop does not stop it when memory runs short.
- Settings per user in Claude Code's plugin settings; a log per conversation in `~/.claude/cache-keep/`.
- Taken from chill-agent's Cache Keep, without its record of the plan's usage.

---
name: cache-keep
description: Use when the user asks whether Cache Keep is working, what it did in this conversation, or how to change its settings.
license: MIT
---

# Cache Keep

Cache Keep is the Claude Code plugin beside this file. It works on its own in
every conversation of the project it is installed in; nothing needs to call it.

- An idle conversation is pinged 55 minutes after its last request, so its
  one-hour prompt cache stays warm. After 5 pings it is compacted when that
  leaves under 60% of it; otherwise it gets one last ping.
- Each ping and compaction is logged to `cache-keep/<session id>.log` in the
  `.claude` folder that holds the skills folder it is installed in.
- In Claude Desktop it runs a background `sleep` while pings are due, so
  Desktop does not stop the idle conversation; it stops the sleep afterwards.
- Settings are under Cache Keep in Claude Code's config menu: on or off,
  minutes between pings, pings before compacting, and the compaction
  threshold.

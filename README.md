# Cache Keep

A Claude Code plugin that keeps an idle conversation's one-hour prompt cache
alive. Someone who comes back after more than an hour would otherwise pay to
write the whole conversation into the cache again; for a long conversation that
is the most expensive call of the day.

```text
the turn's last request to the model
  ↓ 55 minutes
ping: a fork reads the conversation from the cache and answers "ok"
  ↓ 55 minutes after each answered ping, 5 pings in all (5 hours 30 minutes)
compact when it would leave under 60% of the conversation; otherwise one last ping
  ↓
nothing more until the next turn
```

A ping is a fork, not a turn: the transcript and hooks do not see it. Nothing is
sent once 59 minutes have passed since the last request (a Mac waking from
sleep, for example), because the cache has lapsed by then.

## Install

From your project:

```sh
npx skills@latest add <this repository> --skill cache-keep --agent claude-code --yes
```

Cache Keep loads in trusted projects from the next conversation, in every
conversation of the project. Commit `.claude/skills/cache-keep` for it to load
in the project's worktrees too. To use it in all your projects, add `--global`
to install it into `~/.claude/skills` instead.

## Settings

Claude Code keeps the settings per user, in `~/.claude/settings.json`. Change
them in the config menu (`/plugin`, Cache Keep) or in the file:

```json
"pluginConfigs": {
  "cache-keep@skills-dir": {
    "options": { "enabled": true, "pingMinutes": 55, "pings": 5, "compactBelowPercent": 60 }
  }
}
```

- `enabled`: on or off (on by default).
- `pingMinutes`: idle minutes before each ping, under 60 (55).
- `pings`: pings before Cache Keep decides whether to compact (5).
- `compactBelowPercent`: compact only when that leaves under this percent of
  the conversation; otherwise send one last ping and stop (60).

A conversation picks up a change from its next start.

## Log

Each ping, compaction and hold adds a line to
`~/.claude/cache-keep/<session id>.log` (`$CLAUDE_CONFIG_DIR/cache-keep/` when
that is set).

## Claude Desktop

Claude Desktop stops an idle conversation when memory runs short, but never one
with a background task running. So in Desktop, Cache Keep starts a background
`sleep` of its own when a turn ends and stops it after the last ping or the
compaction: the conversation stays open only while pings are due. The sleep
lasts twice the longest idle cycle the settings allow, so it never ends first. If running
`sleep` would ask for permission, it does not hold the conversation and says so
in the log.

## Limits

- The timer lives in the Claude Code process. A conversation whose process is
  stopped loses it until its next turn.
- Do not install it where chill-agent already runs its own copy
  (`chill-agent-cache-keep`): both would ping.

## Test

```sh
claude plugin test skills/cache-keep
```

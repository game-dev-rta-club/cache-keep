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

## Settings and log

Claude Code's config menu lists the settings under Cache Keep: on or off (on by
default), minutes between pings (55), pings before compacting (5) and the
compaction threshold in percent (60).

Each ping and compaction adds a line to `.claude/cache-keep/<session id>.log`
beside the skills folder it is installed in.

## Claude Desktop

Claude Desktop stops an idle conversation when memory runs short, but never one
with a background task running. So in Desktop, Cache Keep starts a background
`sleep` of its own when a turn ends and stops it after the last ping or the
compaction: the conversation stays open only while pings are due. If running
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

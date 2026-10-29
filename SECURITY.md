# Security

The current release line is supported. Report vulnerabilities through this repository's GitHub private vulnerability reporting, not through a public issue containing exploit details or private project data.

Cache Keep sends requests only within the conversation it runs in: pings that read the conversation from the cache, and `/compact`. In Claude Desktop it runs `sleep` in the background through Claude Code's Bash tool, only when your permission settings allow it without asking. It writes nothing but its log in `~/.claude/cache-keep/`, and sends nothing anywhere else.

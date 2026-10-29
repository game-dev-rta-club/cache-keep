# Contributing

Keep Cache Keep small. It keeps an idle conversation's prompt cache warm and compacts the conversation afterwards; changes should make that cheaper or more reliable, not add features beside it.

Open an issue first for changes to when it pings or compacts. Include what the log showed (`~/.claude/cache-keep/<session id>.log`) and the cache tokens read and written; unit tests alone cannot show what a change costs.

## Development

Edit `skills/cache-keep/` directly. The plugin is `hooks/register.ts`; `SKILL.md` exists so the installer can place the plugin and so an agent can answer questions about it. Use Node.js 24+ to run the repository checks:

```sh
npm test
```

Check the plugin with Claude Code itself:

```sh
claude plugin validate skills/cache-keep
claude plugin test skills/cache-keep
```

No dependency installation or build is needed. CI checks the packaging and local documentation links on macOS, Windows and Linux; it does not run Claude Code.

## Releases

Use SemVer in `package.json`:

1. Update the version in `package.json` and `skills/cache-keep/.claude-plugin/plugin.json`, and `CHANGELOG.md`.
2. Run the checks, including `claude plugin test`.
3. Commit and push main, then create an immutable `v<version>` tag.
4. CI publishes a GitHub release after the checks pass. Verify installation from that tag.

Never move a published tag. GitHub hosts the plugin; there is no npm package to publish.

## Pull requests

Explain the outcome and checks performed. Concise commit messages in English or Japanese are welcome. Do not include credentials, private project data or conversation logs.

Contributions are licensed under this repository's MIT license. No CLA or DCO is required.

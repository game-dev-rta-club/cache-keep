import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, 'skills/cache-keep');

test('the distributable is one self-contained, portable plugin folder', async () => {
  assert.deepEqual(await readdir(resolve(root, 'skills')), ['cache-keep']);
  assert.deepEqual((await readdir(directory)).sort(), ['.claude-plugin', 'SKILL.md', 'hooks']);
  const text = await readFile(resolve(directory, 'SKILL.md'), 'utf8');
  const header = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  assert.ok(header, 'skill needs YAML frontmatter');
  assert.match(header[1], /^name: cache-keep$/m);
  assert.match(header[1], /^description: .+$/m);
  assert.match(header[1], /^license: MIT$/m);
  const hooks = JSON.parse(await readFile(resolve(directory, 'hooks/hooks.json'), 'utf8'));
  assert.ok(hooks.modules.length > 0);
  for (const module of hooks.modules) {
    const source = await readFile(resolve(directory, 'hooks', module), 'utf8');
    assert.doesNotMatch(source, /\/Users\/|chill-agent/);
  }
});

test('versions agree and no runtime is bundled', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const plugin = JSON.parse(await readFile(resolve(directory, '.claude-plugin/plugin.json'), 'utf8'));
  assert.equal(plugin.name, 'cache-keep');
  assert.equal(plugin.version, manifest.version);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.private, true);
  assert.equal(manifest.dependencies, undefined);
  const changelog = await readFile(resolve(root, 'CHANGELOG.md'), 'utf8');
  assert.ok(changelog.includes(`## ${manifest.version} —`));
});

test('the settings the README lists are the plugin\'s options, with the same defaults', async () => {
  const plugin = JSON.parse(await readFile(resolve(directory, '.claude-plugin/plugin.json'), 'utf8'));
  const readme = await readFile(resolve(root, 'README.md'), 'utf8');
  for (const [name, option] of Object.entries(plugin.userConfig)) {
    assert.ok(readme.includes(`| \`${name}\` | \`${option.default}\` |`), `README row for ${name}`);
  }
});

test('all relative documentation links and HTML images resolve within the repository', async () => {
  async function visit(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const file = resolve(folder, entry.name);
      if (entry.isDirectory()) { await visit(file); continue; }
      if (!entry.name.endsWith('.md')) continue;
      const text = await readFile(file, 'utf8');
      const links = [
        ...text.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g),
        ...text.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g),
      ];
      for (const match of links) {
        const target = match[1];
        if (/^[a-z][a-z\d+.-]*:|^#/i.test(target)) continue;
        const linkedFile = resolve(dirname(file), decodeURIComponent(target.split('#')[0]));
        const inside = relative(root, linkedFile);
        assert.ok(!inside.startsWith('..') && !isAbsolute(inside), `link escapes repository: ${target}`);
        assert.ok((await stat(linkedFile)).isFile(), `missing linked file: ${target}`);
      }
    }
  }
  await visit(root);
});

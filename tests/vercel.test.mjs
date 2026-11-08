import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, PUBLIC, walk} from '../scripts/check.mjs';

const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));

test('Vercel deploys the checked static directory without a runtime or dev dependencies', () => {
  assert.equal(config.framework, null);
  assert.equal(config.installCommand, 'npm ci --omit=dev');
  assert.equal(config.buildCommand, 'npm run build');
  assert.equal(path.resolve(ROOT, config.outputDirectory), PUBLIC);
  assert.equal(config.rewrites, undefined, 'missing private paths must remain 404');
  assert.ok(walk(PUBLIC).every(file => file.startsWith(PUBLIC + path.sep)));
  assert.ok(!walk(PUBLIC).some(file => /\.(?:pdf|docx|zip)$/i.test(file)));
});

test('Vercel upload excludes local-only originals and build evidence', () => {
  const ignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  for (const name of ['SOURCE_BASELINE.json', 'tests/', 'HTTP_VERIFICATION.json']) {
    assert.ok(ignore.split(/\r?\n/).includes(name), `${name} excluded from CLI uploads`);
  }
});

test('service worker is revalidated instead of held in the browser cache', () => {
  const headers = config.headers.find(rule => rule.source === '/sw.js')?.headers;
  const cache = headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value;
  assert.match(cache, /no-cache|no-store|max-age=0/);
  assert.ok(config.headers.some(rule => rule.source === '/(.*)' && rule.headers.some(header => header.key === 'X-Content-Type-Options' && header.value === 'nosniff')));
});

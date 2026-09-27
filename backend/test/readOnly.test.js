'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Mirrors src/architecture.test.ts for the backend: no trading-execution
 * identifier may appear anywhere in this service, and it may only ever
 * accept GET and PATCH. See ../../docs/READ_ONLY.md.
 */

const ROOT = path.join(__dirname, '..');

function jsFiles(dir) {
  return fs.readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (entry === 'node_modules' || entry === 'data' || entry === 'test') return [];
    if (fs.statSync(full).isDirectory()) return jsFiles(full);
    return entry.endsWith('.js') ? [full] : [];
  });
}

const FORBIDDEN = [
  /\bCTrade\b/,
  /\bOrderSend\s*\(/,
  /\bPositionClose\s*\(/,
  /\bPositionModify\s*\(/,
  /\bOrderModify\s*\(/,
  /\bOrderDelete\s*\(/,
  /'POST'/,
  /'DELETE'/,
  /'PUT'/,
];

test('backend contains no trading-execution identifiers and no POST/PUT/DELETE method', () => {
  for (const file of jsFiles(ROOT)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const pattern of FORBIDDEN) {
      assert.doesNotMatch(source, pattern, `${path.relative(ROOT, file)} matched forbidden pattern ${pattern}`);
    }
  }
});

test('router only handles GET and PATCH', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'router.js'), 'utf8');
  const methodChecks = [...source.matchAll(/method === '([A-Z]+)'/g)].map((m) => m[1]);
  assert.ok(methodChecks.length > 0, 'expected at least one method check in router.js');
  for (const method of methodChecks) {
    assert.ok(['GET', 'PATCH'].includes(method), `router.js checked for disallowed method ${method}`);
  }
});

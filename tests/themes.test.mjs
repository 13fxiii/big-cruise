import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/config/themes.ts', import.meta.url), 'utf8');

test('all required daily BCH themes are configured', () => {
  for (const name of ['BIG CRUISE', 'TOO LIT', 'WOMEN CRUISE', 'THROWBACK', 'NEW MUSIC', 'SECRET MESSAGES', 'WILD OUT']) {
    assert.match(source, new RegExp(`name: '${name}'`));
  }
});

test('theme variables are centralized instead of hardcoded in components', () => {
  assert.match(source, /themeCssVariables/);
  assert.match(source, /--theme-primary/);
  assert.match(source, /--theme-gradient/);
});

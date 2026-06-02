import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePersistentValue } from '../lib/storage-utils.ts';

test('parsePersistentValue returns the stored object when JSON is valid', () => {
  const fallback = { theme: 'light', count: 1 };
  const parsed = parsePersistentValue('{"theme":"dark","count":3}', fallback);

  assert.deepStrictEqual(parsed, { theme: 'dark', count: 3 });
});

test('parsePersistentValue falls back when JSON is invalid', () => {
  const fallback = { theme: 'light', count: 1 };
  const parsed = parsePersistentValue('{bad json', fallback);

  assert.deepStrictEqual(parsed, fallback);
});

test('parsePersistentValue returns fallback for empty values', () => {
  const fallback = ['one', 'two'];
  const parsed = parsePersistentValue(null, fallback);

  assert.deepStrictEqual(parsed, fallback);
});

test('parsePersistentValue handles primitive values', () => {
  const parsed = parsePersistentValue('123', 0);

  assert.equal(parsed, 123);
});

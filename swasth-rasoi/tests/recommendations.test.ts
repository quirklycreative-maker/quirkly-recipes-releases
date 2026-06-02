import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeInventory,
  parseGroceryItems,
  recipeMatches,
} from '../lib/recommendations.ts';

const helperProfile = {
  weightKg: 92,
  hba1c: 7.2,
  preference: 'veg-egg' as const,
};

test('parseGroceryItems strips request phrasing and deduplicates items', () => {
  const items = parseGroceryItems('order dahi and palak, अंडे चाहिए, दही');

  assert.deepStrictEqual(items, ['curd', 'spinach', 'eggs']);
});

test('normalizeInventory maps common Hindi and English synonyms', () => {
  const inventory = normalizeInventory('पालक, dahi, mung dal, bhindi');

  assert.ok(inventory.includes('spinach'));
  assert.ok(inventory.includes('curd'));
  assert.ok(inventory.includes('moong dal'));
  assert.ok(inventory.includes('bhindi'));
});

test('recipeMatches prefers recipes that fit the current pantry and diet', () => {
  const matches = recipeMatches('पालक, दही, मूंग दाल, प्याज, टमाटर', helperProfile);

  assert.ok(matches.length > 0);
  assert.equal(matches[0]?.id, 'moong-chilla');
  assert.ok(matches[0]?.matched.includes('moong dal'));
  assert.ok(matches[0]?.missing.length === 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import { safeMessagesForRole } from '../lib/privacy.ts';

const messages = [
  {
    id: '1',
    createdAt: new Date().toISOString(),
    sender: 'owner' as const,
    text: 'HbA1c is 7.6 and weight is 108 kg',
    attachmentType: 'text' as const,
  },
  {
    id: '2',
    createdAt: new Date().toISOString(),
    sender: 'helper' as const,
    text: 'Need curd and palak',
    attachmentType: 'text' as const,
  },
  {
    id: '3',
    createdAt: new Date().toISOString(),
    sender: 'ai' as const,
    text: 'Summary only',
    attachmentType: 'text' as const,
  },
];

test('helper view excludes owner messages and health data', () => {
  const safe = safeMessagesForRole('helper', messages as never);

  assert.deepStrictEqual(
    safe.map((message) => message.id),
    ['2', '3']
  );
});

test('owner view keeps all messages', () => {
  const safe = safeMessagesForRole('owner', messages as never);

  assert.deepStrictEqual(
    safe.map((message) => message.id),
    ['1', '2', '3']
  );
});

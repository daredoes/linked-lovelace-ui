import { KEY_CHIP_CARD_TYPE, isKeyChipCard, wrapKeyChipCard, unwrapKeyChipCard } from './keyChip';
import { DashboardCard } from '../types';

describe('[function] wrapKeyChipCard', () => {
  test('hoists ll_key and ll_priority onto the wrapper', () => {
    const card: DashboardCard = { type: 'markdown', content: 'hi', ll_key: 'room', ll_priority: 2 };
    expect(wrapKeyChipCard(card)).toStrictEqual({
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'room',
      ll_priority: 2,
      card: { type: 'markdown', content: 'hi' },
    });
  });

  test('omits ll_priority when the original has none', () => {
    const card: DashboardCard = { type: 'markdown', content: 'hi', ll_key: 'room' };
    const wrapped = wrapKeyChipCard(card);
    expect(wrapped.card).toStrictEqual({ type: 'markdown', content: 'hi' });
    expect('ll_priority' in wrapped).toBe(false);
  });

  test('hoists show_key_chips onto the wrapper', () => {
    const card: DashboardCard = { type: 'markdown', content: 'hi', ll_key: 'room', show_key_chips: true };
    expect(wrapKeyChipCard(card)).toStrictEqual({
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'room',
      show_key_chips: true,
      card: { type: 'markdown', content: 'hi' },
    });
  });

  test('does not double-wrap an already wrapped card', () => {
    const wrapped = wrapKeyChipCard({ type: 'markdown', content: 'hi', ll_key: 'room' });
    expect(wrapKeyChipCard(wrapped)).toStrictEqual(wrapped);
  });

  test('is a no-op on cards without ll_key', () => {
    const card: DashboardCard = { type: 'markdown', content: 'hi' };
    expect(wrapKeyChipCard(card)).toStrictEqual(card);
  });
});

describe('[function] unwrapKeyChipCard', () => {
  test('round-trips wrap then unwrap', () => {
    const card: DashboardCard = { ll_key: 'room', type: 'markdown', content: 'hi', ll_priority: 2 };
    expect(unwrapKeyChipCard(wrapKeyChipCard(card))).toStrictEqual(card);
  });

  test('round-trips a card carrying show_key_chips', () => {
    const card: DashboardCard = { ll_key: 'room', show_key_chips: true, type: 'markdown', content: 'hi' };
    expect(unwrapKeyChipCard(wrapKeyChipCard(card))).toStrictEqual(card);
  });

  test('is a no-op on non-wrapper cards', () => {
    const card: DashboardCard = { type: 'markdown', content: 'hi', ll_key: 'room' };
    expect(unwrapKeyChipCard(card)).toStrictEqual(card);
  });

  test('is a no-op on a wrapper-typed card missing an inner card', () => {
    const card: DashboardCard = { type: KEY_CHIP_CARD_TYPE, ll_key: 'room' };
    expect(unwrapKeyChipCard(card)).toStrictEqual(card);
  });

  test('prefers the wrapper key over a stale inner key', () => {
    const card: DashboardCard = {
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'outer',
      card: { type: 'markdown', content: 'hi', ll_key: 'inner' },
    };
    expect(unwrapKeyChipCard(card)).toStrictEqual({ ll_key: 'outer', type: 'markdown', content: 'hi' });
  });

  test('keeps an explicit show_key_chips: false from the wrapper', () => {
    const card: DashboardCard = {
      type: KEY_CHIP_CARD_TYPE,
      ll_key: 'room',
      show_key_chips: false,
      card: { type: 'markdown', content: 'hi' },
    };
    expect(unwrapKeyChipCard(card).show_key_chips).toBe(false);
  });

  test('falls back to the inner key when the wrapper has none', () => {
    const card: DashboardCard = {
      type: KEY_CHIP_CARD_TYPE,
      card: { type: 'markdown', content: 'hi', ll_key: 'inner' },
    };
    expect(unwrapKeyChipCard(card)).toStrictEqual({ ll_key: 'inner', type: 'markdown', content: 'hi' });
  });
});

describe('[function] isKeyChipCard', () => {
  test('detects wrapper cards', () => {
    expect(isKeyChipCard({ type: KEY_CHIP_CARD_TYPE, card: { type: 'markdown' } })).toBe(true);
    expect(isKeyChipCard({ type: KEY_CHIP_CARD_TYPE })).toBe(false);
    expect(isKeyChipCard({ type: 'markdown' })).toBe(false);
    expect(isKeyChipCard(undefined)).toBe(false);
  });
});

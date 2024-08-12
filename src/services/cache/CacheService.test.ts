// src/__tests__/services/CacheService.test.ts
import 'reflect-metadata';
import { createMockCacheService } from '../../__mocks__/mockFactories.js';

import type { ICacheService } from '../../interfaces/index.js';

describe('CacheService', () => {
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeEach(() => {
    mockCacheService = createMockCacheService();
  });

  it('should store and retrieve values', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    await mockCacheService.set(key, value);
    const retrieved = await mockCacheService.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', async () => {
    const retrieved = await mockCacheService.get('nonExistentKey');
    expect(retrieved).toBeNull();
  });

  it('should delete values', async () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    await mockCacheService.set(key, value);
    mockCacheService.delete(key);

    const retrieved = await mockCacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all values', async () => {
    await mockCacheService.set('key1', 'value1');
    await mockCacheService.set('key2', 'value2');

    mockCacheService.clear();

    expect(await mockCacheService.get('key1')).toBeNull();
    expect(await mockCacheService.get('key2')).toBeNull();
  });

  it('should handle different types of values', async () => {
    await mockCacheService.set('stringKey', 'stringValue');
    await mockCacheService.set('numberKey', 123);
    await mockCacheService.set('objectKey', { foo: 'bar' });

    expect(await mockCacheService.get('stringKey')).toBe('stringValue');
    expect(await mockCacheService.get('numberKey')).toBe(123);
    expect(await mockCacheService.get('objectKey')).toEqual({ foo: 'bar' });
  });

  it('should expire items after TTL', async () => {
    jest.useFakeTimers();
    const key = 'expiringKey';
    const value = 'expiringValue';
    const ttl = 5; // 5 seconds

    await mockCacheService.set(key, value, ttl);

    // Item should still be available before TTL
    expect(await mockCacheService.get(key)).toBe(value);

    // Advance time by 6 seconds (just past TTL)
    jest.advanceTimersByTime(6000);

    // Item should now be expired
    expect(await mockCacheService.get(key)).toBeNull();

    jest.useRealTimers();
  });
});

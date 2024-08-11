// src/__tests__/services/CacheService.test.ts
import 'reflect-metadata';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockCacheService } from '@/__mocks__/mockFactories';

import { ICacheService } from '@/interfaces';

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
});

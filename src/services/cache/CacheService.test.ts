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

  it('should store and retrieve values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    mockCacheService.set(key, value);
    const retrieved = mockCacheService.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', () => {
    const retrieved = mockCacheService.get('nonExistentKey');
    expect(retrieved).toBeNull();
  });

  it('should delete values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    mockCacheService.set(key, value);
    mockCacheService.delete(key);

    const retrieved = mockCacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all values', () => {
    mockCacheService.set('key1', 'value1');
    mockCacheService.set('key2', 'value2');

    mockCacheService.clear();

    expect(mockCacheService.get('key1')).toBeNull();
    expect(mockCacheService.get('key2')).toBeNull();
  });

  it('should handle different types of values', () => {
    mockCacheService.set('stringKey', 'stringValue');
    mockCacheService.set('numberKey', 123);
    mockCacheService.set('objectKey', { foo: 'bar' });

    expect(mockCacheService.get('stringKey')).toBe('stringValue');
    expect(mockCacheService.get('numberKey')).toBe(123);
    expect(mockCacheService.get('objectKey')).toEqual({ foo: 'bar' });
  });
});

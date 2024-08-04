// src/__tests__/services/CacheService.test.ts
import 'reflect-metadata';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CacheService } from '@/services/cache/CacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  it('should store and retrieve values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    cacheService.set(key, value);
    const retrieved = cacheService.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', () => {
    const retrieved = cacheService.get('nonExistentKey');
    expect(retrieved).toBeNull();
  });

  it('should delete values', () => {
    const key = 'testKey';
    const value = { data: 'testData' };

    cacheService.set(key, value);
    cacheService.delete(key);

    const retrieved = cacheService.get(key);
    expect(retrieved).toBeNull();
  });

  it('should clear all values', () => {
    cacheService.set('key1', 'value1');
    cacheService.set('key2', 'value2');

    cacheService.clear();

    expect(cacheService.get('key1')).toBeNull();
    expect(cacheService.get('key2')).toBeNull();
  });

  it('should handle different types of values', () => {
    cacheService.set('stringKey', 'stringValue');
    cacheService.set('numberKey', 123);
    cacheService.set('objectKey', { foo: 'bar' });

    expect(cacheService.get('stringKey')).toBe('stringValue');
    expect(cacheService.get('numberKey')).toBe(123);
    expect(cacheService.get('objectKey')).toEqual({ foo: 'bar' });
  });
});

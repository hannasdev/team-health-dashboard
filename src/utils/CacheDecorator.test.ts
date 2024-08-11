// src/utils/CacheDecorator.test.ts
import { Container, injectable } from 'inversify';
import { ICacheService } from '@/interfaces/ICacheService';
import { Cacheable, CacheableClass } from '@/utils/CacheDecorator';
import { TYPES } from '@/utils/types';

describe('CacheDecorator', () => {
  let mockCacheService: jest.Mocked<ICacheService>;
  let container: Container;

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICacheService>;

    container = new Container();
    container
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
  });

  describe('Cacheable', () => {
    it('should return cached result if available', async () => {
      @injectable()
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      container.bind(TestClass).toSelf();
      const instance = container.get(TestClass);
      const cachedResult = 'Cached result';
      mockCacheService.get.mockResolvedValue(cachedResult as any);

      const result = await instance.testMethod('test');

      expect(result).toBe(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'TestClass:testMethod:test-key-["test"]',
      );
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should call original method and cache result if not cached', async () => {
      @injectable()
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      container.bind(TestClass).toSelf();
      const instance = container.get(TestClass);
      mockCacheService.get.mockResolvedValue(null);

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'TestClass:testMethod:test-key-["test"]',
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'TestClass:testMethod:test-key-["test"]',
        'Result for test',
        3600,
      );
    });

    it('should handle missing cacheService gracefully', async () => {
      @injectable()
      class TestClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      container.bind(TestClass).toSelf();
      const instance = container.get(TestClass);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(consoleSpy).toHaveBeenCalledWith(
        'CacheService not found for TestClass.testMethod. Cacheable decorator may not work as expected.',
      );

      consoleSpy.mockRestore();
    });

    it('should store metadata correctly', () => {
      @injectable()
      class TestClass extends CacheableClass {
        @Cacheable('test-key-1', 3600)
        async method1() {}

        @Cacheable('test-key-2', 7200)
        async method2() {}
      }

      const metadata = TestClass.getCacheableMetadata();
      expect(metadata).toEqual({
        method1: { cacheKey: 'test-key-1', duration: 3600 },
        method2: { cacheKey: 'test-key-2', duration: 7200 },
      });
    });
  });

  describe('CacheableClass', () => {
    it('should inject cacheService', () => {
      @injectable()
      class TestClass extends CacheableClass {}

      container.bind(TestClass).toSelf();
      const instance = container.get(TestClass);

      expect((instance as any).cacheService).toBe(mockCacheService);
    });
  });
});

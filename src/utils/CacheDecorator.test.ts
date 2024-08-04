import { Cacheable, CacheableClass } from '@/utils/CacheDecorator';
import { ICacheService } from '@/interfaces/ICacheService';

describe('CacheDecorator', () => {
  let mockCacheService: jest.Mocked<ICacheService>;

  beforeEach(() => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as jest.Mocked<ICacheService>;
  });

  describe('Cacheable', () => {
    it('should return cached result if available', async () => {
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass(mockCacheService);
      const cachedResult = 'Cached result';
      mockCacheService.get.mockReturnValue(cachedResult);

      const result = await instance.testMethod('test');

      expect(result).toBe(cachedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith('test-key-["test"]');
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should call original method and cache result if not cached', async () => {
      class TestClass extends CacheableClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass(mockCacheService);
      mockCacheService.get.mockReturnValue(null);

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(mockCacheService.get).toHaveBeenCalledWith('test-key-["test"]');
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'test-key-["test"]',
        'Result for test',
        3600,
      );
    });

    it('should handle missing cacheService gracefully', async () => {
      class TestClass {
        @Cacheable('test-key', 3600)
        async testMethod(param: string) {
          return `Result for ${param}`;
        }
      }

      const instance = new TestClass();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await instance.testMethod('test');

      expect(result).toBe('Result for test');
      expect(consoleSpy).toHaveBeenCalledWith(
        'CacheService not found. Cacheable decorator may not work as expected.',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('CacheableClass', () => {
    it('should inject cacheService', () => {
      class TestClass extends CacheableClass {}

      const instance = new TestClass(mockCacheService);

      expect((instance as any).cacheService).toBe(mockCacheService);
    });
  });
});

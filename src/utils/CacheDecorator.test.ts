import { Container, injectable } from 'inversify';

import { ICacheService } from '../interfaces/ICacheService.js';
import { Cacheable, CacheableClass } from '../utils/CacheDecorator.js';
import { TYPES } from '../utils/types.js';

@injectable()
class TestClass extends CacheableClass {
  @Cacheable('test-key', 3600)
  async testMethod(param: string) {
    return `Result for ${param}`;
  }
}

describe('CacheDecorator', () => {
  let mockCacheService: jest.Mocked<ICacheService>;
  let sharedContainer: Container;

  beforeAll(() => {
    sharedContainer = new Container();
  });

  beforeEach(() => {
    if (global.gc) {
      global.gc();
    }

    mockCacheService = {
      get: jest.fn().mockImplementation(() => Promise.resolve(null)),
      set: jest.fn().mockImplementation(() => Promise.resolve()),
      delete: jest.fn(),
      clear: jest.fn(),
    };

    sharedContainer.unbindAll();
    sharedContainer
      .bind<ICacheService>(TYPES.CacheService)
      .toConstantValue(mockCacheService);
    sharedContainer.bind(TestClass).toSelf();
  });

  afterEach(() => {
    sharedContainer.unbindAll();
    jest.clearAllMocks();
    if (global.gc) {
      global.gc();
    }
  });

  afterAll(() => {
    sharedContainer.unbindAll();
    (sharedContainer as any) = null;
  });

  describe('Cacheable', () => {
    it.each([
      ['cached', 'Cached result', true],
      ['not cached', 'Result for test', false],
    ])(
      'should handle %s results',
      async (scenario, expectedResult, isCached) => {
        const instance = sharedContainer.get(TestClass);
        mockCacheService.get.mockResolvedValue(
          isCached ? expectedResult : null,
        );

        const result = await instance.testMethod('test');

        expect(result).toBe(expectedResult);
        expect(mockCacheService.get).toHaveBeenCalledWith(
          'TestClass:testMethod:test-key-["test"]',
        );
        expect(mockCacheService.set).toHaveBeenCalledTimes(isCached ? 0 : 1);
      },
    );

    it('should handle missing cacheService gracefully', async () => {
      await jest.isolateModules(async () => {
        @injectable()
        class TestClassWithoutCache {
          @Cacheable('test-key', 3600)
          async testMethod(param: string) {
            return `Result for ${param}`;
          }
        }

        const newContainer = new Container();
        newContainer.bind(TestClassWithoutCache).toSelf();
        const instance = newContainer.get(TestClassWithoutCache);
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        const result = await instance.testMethod('test');

        expect(result).toBe('Result for test');
        expect(consoleSpy).toHaveBeenCalledWith(
          'CacheService not found for TestClassWithoutCache.testMethod. Cacheable decorator may not work as expected.',
        );

        consoleSpy.mockRestore();
        newContainer.unbindAll();
      });
    });

    it('should store metadata correctly', () => {
      @injectable()
      class TestClassWithMultipleMethods extends CacheableClass {
        @Cacheable('test-key-1', 3600)
        async method1() {}

        @Cacheable('test-key-2', 7200)
        async method2() {}
      }

      const metadata = TestClassWithMultipleMethods.getCacheableMetadata();
      expect(metadata).toEqual({
        method1: { cacheKey: 'test-key-1', duration: 3600 },
        method2: { cacheKey: 'test-key-2', duration: 7200 },
      });
    });
  });

  describe('CacheableClass', () => {
    it('should inject cacheService', () => {
      const instance = sharedContainer.get(TestClass);
      expect((instance as any).cacheService).toBe(mockCacheService);
    });
  });
});

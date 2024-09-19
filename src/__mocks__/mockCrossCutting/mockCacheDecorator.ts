export const createCacheDecoratorMock = () => {
  const cacheable = jest.fn().mockImplementation(() => jest.fn());

  class MockCacheableClass {
    constructor(public cacheService: any) {}
  }

  return {
    Cacheable: cacheable,
    CacheableClass: MockCacheableClass,
  };
};

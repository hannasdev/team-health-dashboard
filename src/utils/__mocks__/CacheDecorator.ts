export const Cacheable = jest.fn().mockImplementation(() => jest.fn());

export class CacheableClass {
  constructor(protected cacheService: any) {}
}

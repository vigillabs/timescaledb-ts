import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import { AppDataSource } from '../src/data-source';
import { PageLoad } from '../src/models/PageLoad';

describe('POST /api/pageview', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(PageLoad);
    await repository.clear();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should record a page view and verify database record', async () => {
    const mockUserAgent = 'Mozilla/5.0 Test Browser';
    const beforeInsert = new Date();

    const response = await request().post('/api/pageview').set('User-Agent', mockUserAgent);

    const afterInsert = new Date();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Page view recorded' });

    const repository = AppDataSource.getRepository(PageLoad);
    const record = await repository.findOne({
      where: { userAgent: mockUserAgent },
    });

    expect(record).not.toBeNull();
    expect(record?.userAgent).toBe(mockUserAgent);
    expect(record?.time.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(record?.time.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});

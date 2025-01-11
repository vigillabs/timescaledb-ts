import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import PageLoad from '../src/models/PageLoad';
import sequelize from '../src/database';

describe('POST /api/pageview', () => {
  beforeEach(async () => {
    await PageLoad.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should record a page view and verify database record', async () => {
    const mockUserAgent = 'Mozilla/5.0 Test Browser';
    const beforeInsert = new Date();

    const response = await request().post('/api/pageview').set('User-Agent', mockUserAgent);

    const afterInsert = new Date();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Page view recorded' });

    const record = await PageLoad.findOne({
      where: { userAgent: mockUserAgent },
    });

    expect(record).not.toBeNull();
    expect(record?.userAgent).toBe(mockUserAgent);
    expect(record?.time.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(record?.time.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});

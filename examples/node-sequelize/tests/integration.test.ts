import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import sequelize from '../src/database';
import { faker } from '@faker-js/faker';
import PageLoad from '../src/models/PageLoad';

describe('API Integration Tests', () => {
  beforeEach(async () => {
    await PageLoad.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should record page view and reflect in stats', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00
    const userAgent = faker.internet.userAgent();

    const viewResponse = await request().post('/api/pageview').set('User-Agent', userAgent);
    expect(viewResponse.status).toBe(200);

    // Poll for the record to appear in the database
    const maxAttempts = 5;
    const pollInterval = 1000; // 1 second
    let pageLoadRecord: PageLoad | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      pageLoadRecord = await PageLoad.findOne({
        where: { userAgent },
      });

      if (pageLoadRecord) {
        break;
      }
    }

    expect(pageLoadRecord).not.toBeNull();
    expect(pageLoadRecord?.userAgent).toBe(userAgent);

    const startTime = new Date(baseTime.getTime() - 3600000); // 1 hour ago
    const endTime = new Date(baseTime.getTime() + 3600000); // 1 hour ahead

    const statsResponse = await request().get('/api/stats').query({
      start: startTime.toISOString(),
      end: endTime.toISOString(),
    });

    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body).toHaveLength(1);

    const stats = statsResponse.body[0];
    expect(Number(stats.count)).toBeGreaterThanOrEqual(1);
    expect(Number(stats.unique_users)).toBeGreaterThanOrEqual(1);
    expect(stats.interval).toBeTruthy();

    const dbRecord = await PageLoad.findOne({
      where: { userAgent },
    });
    expect(dbRecord).not.toBeNull();
  });
});

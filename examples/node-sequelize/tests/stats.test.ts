import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import PageLoad from '../src/models/PageLoad';
import sequelize from '../src/database';

describe('GET /api/stats', () => {
  beforeEach(async () => {
    await PageLoad.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should return accurate stats for a given time range', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00

    const testData = [
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 10 * 60000) }, // XX:20:00
      { userAgent: 'UA2', time: new Date(baseTime.getTime() - 15 * 60000) }, // XX:15:00
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 20 * 60000) }, // XX:10:00
    ];

    await Promise.all(testData.map((data) => PageLoad.create(data)));

    const start = new Date(baseTime.getTime() - 60 * 60000);
    const end = baseTime;

    const response = await request().get('/api/stats').query({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const stats = response.body[0];
    expect(Number(stats.count)).toBe(3);
    expect(Number(stats.unique_users)).toBe(2);
    expect(stats.interval).toBeTruthy();

    const dbStats = (await sequelize.query(
      `
        SELECT 
          count(*) as total_views,
          count(distinct user_agent) as unique_users
        FROM page_loads
        WHERE time BETWEEN :start AND :end
      `,
      {
        replacements: { start, end },
      },
    )) as unknown as { total_views: string; unique_users: string }[][];

    const rawStats = dbStats[0][0];
    expect(Number(rawStats.total_views)).toBe(3);
    expect(Number(rawStats.unique_users)).toBe(2);
  });

  it('should return accurate stats for a given time range with where json param filter', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00

    const testData = [
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 10 * 60000) }, // XX:20:00
      { userAgent: 'UA2', time: new Date(baseTime.getTime() - 15 * 60000) }, // XX:15:00
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 20 * 60000) }, // XX:10:00
    ];

    await Promise.all(testData.map((data) => PageLoad.create(data)));

    const start = new Date(baseTime.getTime() - 60 * 60000);
    const end = baseTime;

    const response = await request()
      .get('/api/stats')
      .query({
        start: start.toISOString(),
        end: end.toISOString(),
        where: JSON.stringify({ user_agent: 'UA1' }),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const stats = response.body[0];
    expect(Number(stats.count)).toBe(2);
    expect(Number(stats.unique_users)).toBe(1);
    expect(stats.interval).toBeTruthy();

    const dbStats = (await sequelize.query(
      `
        SELECT 
          count(*) as total_views,
          count(distinct user_agent) as unique_users
        FROM page_loads
        WHERE time BETWEEN :start AND :end
        AND user_agent = :userAgent
      `,
      {
        replacements: { start, end, userAgent: 'UA1' },
      },
    )) as unknown as { total_views: string; unique_users: string }[][];

    const rawStats = dbStats[0][0];
    expect(Number(rawStats.total_views)).toBe(2);
    expect(Number(rawStats.unique_users)).toBe(1);
  });

  it('should handle multiple hour buckets correctly', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00

    const testData = [
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 15 * 60000) }, // Current hour
      { userAgent: 'UA2', time: new Date(baseTime.getTime() - 75 * 60000) }, // Previous hour
    ];

    await Promise.all(testData.map((data) => PageLoad.create(data)));

    const start = new Date(baseTime.getTime() - 120 * 60000); // 2 hours ago
    const end = baseTime;

    const response = await request().get('/api/stats').query({
      start: start.toISOString(),
      end: end.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    const sortedStats = response.body.sort(
      (a: any, b: any) => new Date(b.interval).getTime() - new Date(a.interval).getTime(),
    );

    expect(Number(sortedStats[0].count)).toBe(1);
    expect(Number(sortedStats[0].unique_users)).toBe(1);

    expect(Number(sortedStats[1].count)).toBe(1);
    expect(Number(sortedStats[1].unique_users)).toBe(1);
  });
});

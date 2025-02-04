import { AppDataSource } from '../src/data-source';
import { PageLoad } from '../src/models/PageLoad';
import { request } from './mock-request';

describe('GET /api/stats', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(PageLoad);
    await repository.clear();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should return accurate stats for a given time range', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00

    const repository = AppDataSource.getRepository(PageLoad);
    const testData = [
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 10 * 60000) }, // XX:20:00
      { userAgent: 'UA2', time: new Date(baseTime.getTime() - 15 * 60000) }, // XX:15:00
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 20 * 60000) }, // XX:10:00
    ];

    await Promise.all(testData.map((data) => repository.save(data)));

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
  });

  it('should return accurate stats for a given time range with where json param filter', async () => {
    const baseTime = new Date();
    baseTime.setMinutes(30, 0, 0); // Set to XX:30:00

    const repository = AppDataSource.getRepository(PageLoad);
    const testData = [
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 10 * 60000) }, // XX:20:00
      { userAgent: 'UA2', time: new Date(baseTime.getTime() - 15 * 60000) }, // XX:15:00
      { userAgent: 'UA1', time: new Date(baseTime.getTime() - 20 * 60000) }, // XX:10:00
    ];

    await Promise.all(testData.map((data) => repository.save(data)));

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
  });
});

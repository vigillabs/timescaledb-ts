import { afterAll, beforeEach, describe, it } from '@jest/globals';
import { AppDataSource } from '../src/data-source';
import { PageLoad } from '../src/models/PageLoad';
import { request } from './mock-request';
import { faker } from '@faker-js/faker';

describe('GET /api/compression', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(PageLoad);
    await repository.clear();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should show accurate compression stats after data insertion', async () => {
    const repository = AppDataSource.getRepository(PageLoad);
    const userAgents = Array.from({ length: 1000 }, () => faker.internet.userAgent());
    const startTime = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

    for (const userAgent of userAgents) {
      await repository.save({
        userAgent,
        time: new Date(startTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Within the last 7 days
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await request().get('/api/compression');
    expect(response.status).toBe(200);

    const [dbStats] = await AppDataSource.query(`
      SELECT 
        COALESCE(total_chunks, 0)::integer as total_chunks,
        COALESCE(number_compressed_chunks, 0)::integer as compressed_chunks
      FROM hypertable_compression_stats('page_loads');
    `);

    expect(response.body).toEqual({
      total_chunks: dbStats.total_chunks,
      compressed_chunks: dbStats.compressed_chunks,
    });

    expect(response.body.total_chunks).toBeGreaterThan(0);
    expect(response.body.compressed_chunks).toBeGreaterThanOrEqual(0);
  });
});

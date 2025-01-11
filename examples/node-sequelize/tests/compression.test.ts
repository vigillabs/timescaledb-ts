import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import sequelize from '../src/database';
import PageLoad from '../src/models/PageLoad';
import { faker } from '@faker-js/faker';
import { QueryTypes } from 'sequelize';
import { CompressionStats } from '@timescaledb/schemas';

describe('GET /api/compression', () => {
  beforeEach(async () => {
    await PageLoad.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should show accurate compression stats after data insertion', async () => {
    const userAgents = Array.from({ length: 1000 }, () => faker.internet.userAgent());
    const startTime = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago

    for (const userAgent of userAgents) {
      await PageLoad.create({
        userAgent,
        time: new Date(startTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000), // Within the last 7 days
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await request().get('/api/compression');
    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      total_chunks: expect.any(Number),
      compressed_chunks: expect.any(Number),
    });

    expect(response.body.total_chunks).toBeGreaterThan(0);
    expect(response.body.compressed_chunks).toBeGreaterThanOrEqual(0);

    const dbStats = (
      await sequelize.query(
        `
          SELECT * FROM hypertable_compression_stats('page_loads');
        `,
        {
          type: QueryTypes.SELECT,
        },
      )
    )[0] as unknown as CompressionStats;

    expect(response.body).toEqual(
      expect.objectContaining({
        total_chunks: Number(dbStats.total_chunks),
        compressed_chunks: Number(dbStats.number_compressed_chunks),
      }),
    );
  });
});

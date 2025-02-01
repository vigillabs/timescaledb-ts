// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { TimescaleRepository } from '@timescaledb/typeorm/repository/TimescaleRepository';
import { describe, it, expect } from '@jest/globals';
import { AppDataSource } from '../src/data-source';
import { StockPrice } from '../src/models/StockPrice';
import { faker } from '@faker-js/faker';

describe('getCandlestick', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(StockPrice);
    await repository.clear();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should generate candlestick data for a given time range', async () => {
    const repository = AppDataSource.getRepository(StockPrice);
    const baseTime = new Date('2025-01-01T00:00:00Z');
    const symbol = 'AAPL';

    // Create test data across 3 hours
    for (let hour = 0; hour < 3; hour++) {
      const hourStart = new Date(baseTime.getTime() + hour * 3600000);

      // Create multiple price points per hour
      for (let i = 0; i < 5; i++) {
        await repository.save({
          symbol,
          timestamp: new Date(hourStart.getTime() + i * 720000), // Spread over minutes within the hour
          price: faker.number.float({ min: 100, max: 200 }),
          volume: faker.number.float({ min: 1000, max: 10000 }),
        });
      }
    }

    const timeRange = {
      start: baseTime,
      end: new Date(baseTime.getTime() + 4 * 3600000), // 4 hours later
    };

    const candlesticks = await repository.getCandlestick({
      timeRange,
      config: {
        time_column: 'timestamp',
        price_column: 'price',
        volume_column: 'volume',
        bucket_interval: '1 hour',
      },
    });

    expect(candlesticks).toHaveLength(3);

    const firstCandle = candlesticks[0];
    expect(firstCandle).toHaveProperty('bucket_time');
    expect(firstCandle).toHaveProperty('open');
    expect(firstCandle).toHaveProperty('high');
    expect(firstCandle).toHaveProperty('low');
    expect(firstCandle).toHaveProperty('close');
    expect(firstCandle).toHaveProperty('volume');
    expect(firstCandle).toHaveProperty('vwap');

    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.low);
    expect(firstCandle.volume).toBeGreaterThan(0);
  });
});

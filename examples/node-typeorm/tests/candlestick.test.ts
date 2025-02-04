import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { request } from './mock-request';
import { AppDataSource } from '../src/data-source';
import { StockPrice } from '../src/models/StockPrice';

describe('GET /api/candlestick', () => {
  beforeEach(async () => {
    const repository = AppDataSource.getRepository(StockPrice);
    await repository.clear();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  it('should return candlestick data for a given time range', async () => {
    const repository = AppDataSource.getRepository(StockPrice);
    const baseTime = new Date('2025-01-01T00:00:00Z');
    const symbol = 'BTC';
    const otherSymbol = 'OTHER';

    const testData = [
      { symbol, timestamp: new Date(baseTime.getTime() + 5 * 60000), price: 102000, volume: 1.5 }, // Opening price
      { symbol, timestamp: new Date(baseTime.getTime() + 15 * 60000), price: 104000, volume: 2.0 }, // High
      { symbol, timestamp: new Date(baseTime.getTime() + 25 * 60000), price: 101500, volume: 1.0 }, // Low
      { symbol, timestamp: new Date(baseTime.getTime() + 55 * 60000), price: 103500, volume: 1.8 }, // Close

      { symbol, timestamp: new Date(baseTime.getTime() + 65 * 60000), price: 103600, volume: 1.2 },
      { symbol, timestamp: new Date(baseTime.getTime() + 75 * 60000), price: 105000, volume: 2.5 },
      { symbol, timestamp: new Date(baseTime.getTime() + 85 * 60000), price: 104000, volume: 1.7 },
      { symbol, timestamp: new Date(baseTime.getTime() + 115 * 60000), price: 104500, volume: 1.9 },

      { symbol: otherSymbol, timestamp: new Date(baseTime.getTime() + 125 * 60000), price: 420, volume: 1.2 },
    ];

    await Promise.all(testData.map((data) => repository.save(data)));

    const start = baseTime;
    const end = new Date(baseTime.getTime() + 3 * 3600000); // 3 hours later

    const response = await request()
      .get('/api/candlestick')
      .query({
        start: start.toISOString(),
        end: end.toISOString(),
        where: JSON.stringify({ symbol }),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    const firstCandle = response.body[0];
    expect(firstCandle).toHaveProperty('bucket_time');
    expect(firstCandle).toHaveProperty('open');
    expect(firstCandle).toHaveProperty('high');
    expect(firstCandle).toHaveProperty('low');
    expect(firstCandle).toHaveProperty('close');
    expect(firstCandle).toHaveProperty('volume');
    expect(firstCandle).toHaveProperty('vwap');

    // Verify first candlestick values
    expect(Number(firstCandle.open)).toBe(102000);
    expect(Number(firstCandle.high)).toBe(104000);
    expect(Number(firstCandle.low)).toBe(101500);
    expect(Number(firstCandle.close)).toBe(103500);
    expect(Number(firstCandle.volume)).toBeCloseTo(6.3, 1);

    // Verify second candlestick values
    const secondCandle = response.body[1];
    expect(Number(secondCandle.open)).toBe(103600);
    expect(Number(secondCandle.high)).toBe(105000);
    expect(Number(secondCandle.low)).toBe(103600);
    expect(Number(secondCandle.close)).toBe(104500);
    expect(Number(secondCandle.volume)).toBeCloseTo(7.3, 1);
  });
});

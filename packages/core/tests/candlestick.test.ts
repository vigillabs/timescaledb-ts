import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';

describe('Candlestick Aggregation', () => {
  it('should generate basic candlestick query', () => {
    const candlestick = TimescaleDB.createCandlestickAggregate('stock_prices', {
      time_column: 'timestamp',
      price_column: 'price',
      bucket_interval: '1 hour',
    });

    const sql = candlestick.build({});
    expect(sql).toMatchSnapshot();
  });

  it('should properly escape identifiers', () => {
    const candlestick = TimescaleDB.createCandlestickAggregate('stock_prices', {
      time_column: 'time"stamp',
      price_column: 'price"value',
      bucket_interval: '1 hour',
    });

    const sql = candlestick.build();
    expect(sql).toMatchSnapshot();
  });

  describe('Candlestick Builder with Where Clause', () => {
    it('should generate candlestick query with time range and where clause', () => {
      const builder = TimescaleDB.createCandlestickAggregate('stock_prices', {
        time_column: 'timestamp',
        price_column: 'price',
        volume_column: 'volume',
        bucket_interval: '1 hour',
      });

      const range = {
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-02T00:00:00Z'),
      };

      const where = {
        symbol: 'AAPL',
        volume: { '>': 1000000 },
      };

      const sql = builder.build({ range, where });
      expect(sql).toMatchSnapshot();
    });

    it('should work without where clause', () => {
      const builder = TimescaleDB.createCandlestickAggregate('stock_prices', {
        time_column: 'timestamp',
        price_column: 'price',
        bucket_interval: '1 hour',
      });

      const range = {
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-02T00:00:00Z'),
      };

      const sql = builder.build({ range });
      expect(sql).toMatchSnapshot();
    });
  });
});

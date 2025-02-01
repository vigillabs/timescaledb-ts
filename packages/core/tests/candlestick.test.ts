// packages/core/tests/candlestick.test.ts

import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';

describe('Candlestick Aggregation', () => {
  it('should generate basic candlestick query', () => {
    const candlestick = TimescaleDB.createCandlestickAggregate('stock_prices', {
      time_column: 'timestamp',
      price_column: 'price',
      bucket_interval: '1 hour',
    });

    const sql = candlestick.build();
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
});

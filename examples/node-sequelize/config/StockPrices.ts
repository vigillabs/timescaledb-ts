import { TimescaleDB } from '@vigillabs/timescale-db-core';

export const StockPrices = TimescaleDB.createHypertable('stock_prices', {
  by_range: {
    column_name: 'timestamp',
  },
  compression: {
    compress: true,
    compress_orderby: 'timestamp',
    compress_segmentby: 'symbol',
    policy: {
      schedule_interval: '7 days',
    },
  },
});

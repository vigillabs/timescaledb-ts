import { TimescaleDB } from '@vigillabs/timescale-db-core';

export const PageLoads = TimescaleDB.createHypertable('page_loads', {
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'user_agent',
    policy: {
      schedule_interval: '7 days',
    },
  },
});

import { TimescaleDB } from '@timescaledb/core';

export const pageLoadsHypertable = TimescaleDB.createHypertable('page_loads', {
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

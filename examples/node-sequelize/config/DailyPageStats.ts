import { TimescaleDB } from '@vigillabs/timescale-db-core';
import { AggregateType, RollupFunctionType } from '@vigillabs/timescale-db-schemas';

export const DailyPageStats = TimescaleDB.createRollup({
  continuousAggregateOptions: {
    name: 'daily_page_stats',
    bucket_interval: '1 day',
    refresh_policy: {
      start_offset: '30 days',
      end_offset: '1 day',
      schedule_interval: '1 day',
    },
  },
  rollupOptions: {
    sourceView: 'hourly_page_views',
    name: 'daily_page_stats',
    bucketInterval: '1 day',
    materializedOnly: false,
    bucketColumn: {
      source: 'bucket',
      target: 'bucket',
    },
    rollupRules: [
      {
        rollupFn: RollupFunctionType.Rollup,
        sourceColumn: 'total_views',
        targetColumn: 'sum_total_views',
        aggregateType: AggregateType.Sum,
      },
      {
        rollupFn: RollupFunctionType.Rollup,
        sourceColumn: 'unique_users',
        targetColumn: 'avg_unique_users',
        aggregateType: AggregateType.Avg,
      },
    ],
  },
});

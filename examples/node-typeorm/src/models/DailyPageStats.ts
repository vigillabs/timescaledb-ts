import { Rollup, BucketColumn, RollupColumn } from '@timescaledb/typeorm';
import { HourlyPageViews } from './HourlyPageViews';
import { AggregateType } from '@timescaledb/schemas';

@Rollup(HourlyPageViews, {
  name: 'daily_page_stats',
  bucket_interval: '1 day',
  refresh_policy: {
    start_offset: '30 days',
    end_offset: '1 day',
    schedule_interval: '1 day',
  },
})
export class DailyPageStats {
  @BucketColumn({
    source_column: 'bucket',
  })
  bucket!: Date;

  @RollupColumn({
    type: AggregateType.Sum,
    source_column: 'total_views',
  })
  sum_total_views!: number;

  @RollupColumn({
    type: AggregateType.Avg,
    source_column: 'unique_users',
  })
  avg_unique_users!: number;
}

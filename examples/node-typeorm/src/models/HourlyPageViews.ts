import { ContinuousAggregate, AggregateColumn, BucketColumn } from '@vigillabs/timescale-db-typeorm';
import { PageLoad } from './PageLoad';
import { AggregateType } from '@vigillabs/timescale-db-schemas';

@ContinuousAggregate(PageLoad, {
  name: 'hourly_page_views',
  bucket_interval: '1 hour',
  refresh_policy: {
    start_offset: '3 days',
    end_offset: '1 hour',
    schedule_interval: '1 hour',
  },
})
export class HourlyPageViews {
  @BucketColumn({
    source_column: 'time',
  })
  bucket!: Date;

  @AggregateColumn({
    type: AggregateType.Count,
  })
  total_views!: number;

  @AggregateColumn({
    type: AggregateType.CountDistinct,
    column: 'user_agent',
  })
  unique_users!: number;
}

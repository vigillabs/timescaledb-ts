import { ViewColumn } from 'typeorm';
import { ContinuousAggregate, AggregateColumn } from '@timescaledb/typeorm';
import { PageLoad } from './PageLoad';
import { AggregateType } from '@timescaledb/schemas';

@ContinuousAggregate(PageLoad, {
  name: 'hourly_page_views',
  bucket_interval: '1 hour',
  time_column: 'time',
  refresh_policy: {
    start_offset: '3 days',
    end_offset: '1 hour',
    schedule_interval: '1 hour',
  },
})
export class HourlyPageViews {
  @ViewColumn()
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

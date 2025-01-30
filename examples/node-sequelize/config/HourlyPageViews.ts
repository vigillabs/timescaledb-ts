import { TimescaleDB } from '@timescaledb/core';
import { AggregateType } from '@timescaledb/schemas';

export const HourlyPageViews = TimescaleDB.createContinuousAggregate('hourly_page_views', 'page_loads', {
  bucket_interval: '1 hour',
  time_column: 'time',
  aggregates: {
    total_views: {
      type: AggregateType.Count,
      column_alias: 'total_views',
    },
    unique_users: {
      type: AggregateType.CountDistinct,
      column: 'user_agent',
      column_alias: 'unique_users',
    },
  },
  refresh_policy: {
    start_offset: '3 days',
    end_offset: '1 hour',
    schedule_interval: '1 hour',
  },
});

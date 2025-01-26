import { TimescaleDB } from '@timescaledb/core';

export const HourlyPageViews = TimescaleDB.createContinuousAggregate('hourly_page_views', 'page_loads', {
  bucket_interval: '1 hour',
  time_column: 'time',
  materialized_only: true,
  create_group_indexes: true,
  aggregates: {
    total_views: {
      type: 'count',
      column_alias: 'total_views',
    },
    unique_users: {
      type: 'count_distinct',
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

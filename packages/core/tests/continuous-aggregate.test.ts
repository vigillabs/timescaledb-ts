import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';
import { CreateContinuousAggregateOptions } from '@timescaledb/schemas';

describe('ContinuousAggregate', () => {
  // @ts-ignore
  const defaultOptions: CreateContinuousAggregateOptions = {
    bucket_interval: '1 hour',
    time_column: 'time',
    aggregates: {
      total_views: {
        type: 'count',
        column_alias: 'total_views',
      },
    },
  };

  describe('validation', () => {
    it('should fail when creating without required options', () => {
      expect(() => {
        // @ts-ignore
        TimescaleDB.createContinuousAggregate('view_name', 'source_table', {});
      }).toThrow();
    });

    it('should fail with invalid aggregate type', () => {
      expect(() => {
        TimescaleDB.createContinuousAggregate('view_name', 'source_table', {
          ...defaultOptions,
          aggregates: {
            total: {
              // @ts-ignore
              type: 'invalid_type',
              column_alias: 'total',
            },
          },
        });
      }).toThrow();
    });
  });

  describe('up', () => {
    it('should create a basic continuous aggregate view', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', defaultOptions);
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create a view with multiple aggregates', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', {
        ...defaultOptions,
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
      });
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create a view with refresh policy', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', {
        ...defaultOptions,
        refresh_policy: {
          start_offset: '3 days',
          end_offset: '1 hour',
          schedule_interval: '1 hour',
        },
      });
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create a view with custom materialization settings', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', {
        ...defaultOptions,
        materialized_only: false,
        create_group_indexes: false,
      });
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape special characters in names', () => {
      const cagg = TimescaleDB.createContinuousAggregate('my-view"name', 'source"table', {
        ...defaultOptions,
        time_column: 'timestamp"column',
        aggregates: {
          total: {
            type: 'count_distinct',
            column: 'user"agent',
            column_alias: 'total"count',
          },
        },
      });
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('down', () => {
    it('should drop a basic view', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', defaultOptions);
      const sql = cagg.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should drop a view with refresh policy', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', {
        ...defaultOptions,
        refresh_policy: {
          start_offset: '3 days',
          end_offset: '1 hour',
          schedule_interval: '1 hour',
        },
      });
      const sql = cagg.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape special characters in view name when dropping', () => {
      const cagg = TimescaleDB.createContinuousAggregate('my-view"name', 'source_table', defaultOptions);
      const sql = cagg.down().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('inspect', () => {
    it('should generate inspection query', () => {
      const cagg = TimescaleDB.createContinuousAggregate('view_name', 'source_table', defaultOptions);
      const sql = cagg.inspect().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape special characters in inspection query', () => {
      const cagg = TimescaleDB.createContinuousAggregate('my-view"name', 'source_table', defaultOptions);
      const sql = cagg.inspect().build();
      expect(sql).toMatchSnapshot();
    });
  });
});

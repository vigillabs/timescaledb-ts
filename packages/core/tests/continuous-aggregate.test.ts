import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';
import { CreateContinuousAggregateOptions, AggregateType } from '@timescaledb/schemas';

describe('ContinuousAggregate', () => {
  describe('aggregate functions', () => {
    it('should create view with sum aggregate', () => {
      const options: CreateContinuousAggregateOptions = {
        name: 'sum_view',
        bucket_interval: '1 hour',
        time_column: 'time',
        aggregates: {
          total_amount: {
            type: AggregateType.Sum,
            column: 'amount',
            column_alias: 'total_amount',
          },
        },
      };

      const cagg = TimescaleDB.createContinuousAggregate('sum_view', 'source_table', options);
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create view with average aggregate', () => {
      const options: CreateContinuousAggregateOptions = {
        name: 'avg_view',
        bucket_interval: '1 hour',
        time_column: 'time',
        aggregates: {
          avg_amount: {
            type: AggregateType.Avg,
            column: 'amount',
            column_alias: 'avg_amount',
          },
        },
      };

      const cagg = TimescaleDB.createContinuousAggregate('avg_view', 'source_table', options);
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should create view with min/max aggregates', () => {
      const options: CreateContinuousAggregateOptions = {
        name: 'minmax_view',
        bucket_interval: '1 hour',
        time_column: 'time',
        aggregates: {
          min_amount: {
            type: AggregateType.Min,
            column: 'amount',
            column_alias: 'min_amount',
          },
          max_amount: {
            type: AggregateType.Max,
            column: 'amount',
            column_alias: 'max_amount',
          },
        },
      };

      const cagg = TimescaleDB.createContinuousAggregate('minmax_view', 'source_table', options);
      const sql = cagg.up().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('refresh policy', () => {
    const baseOptions: CreateContinuousAggregateOptions = {
      name: 'test_view',
      bucket_interval: '1 hour',
      time_column: 'time',
      aggregates: {
        count: {
          type: AggregateType.Count,
          column_alias: 'total_count',
        },
      },
      refresh_policy: {
        start_offset: '2 days',
        end_offset: '1 hour',
        schedule_interval: '1 hour',
      },
    };

    it('should generate refresh policy SQL', () => {
      const cagg = TimescaleDB.createContinuousAggregate('policy_view', 'source_table', baseOptions);
      const policy = cagg.up().getRefreshPolicy();
      expect(policy).toMatchSnapshot();
    });

    it('should not generate refresh policy when not configured', () => {
      const options = {
        name: 'no_policy_view',
        bucket_interval: '1 hour',
        time_column: 'time',
        aggregates: {
          count: {
            type: AggregateType.Count,
            column_alias: 'total_count',
          },
        },
      };
      const cagg = TimescaleDB.createContinuousAggregate(
        'no_policy_view',
        'source_table',
        options as CreateContinuousAggregateOptions,
      );
      const policy = cagg.up().getRefreshPolicy();
      expect(policy).toBeNull();
    });

    it('should remove refresh policy on down migration', () => {
      const cagg = TimescaleDB.createContinuousAggregate('policy_view', 'source_table', baseOptions);
      const sql = cagg.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape interval values in refresh policy', () => {
      const options = {
        ...baseOptions,
        refresh_policy: {
          start_offset: "2 days'--injection",
          end_offset: '1 hour',
          schedule_interval: '1 hour',
        },
      };

      const cagg = TimescaleDB.createContinuousAggregate('policy_view', 'source_table', options);
      const policy = cagg.up().getRefreshPolicy();
      expect(policy).toMatchSnapshot();
    });
  });
});

import { describe, it, expect } from '@jest/globals';
import { ContinuousAggregate } from '../src/decorators/ContinuousAggregate';
import { BucketColumn } from '../src/decorators/BucketColumn';
import { Rollup } from '../src/decorators/Rollup';
import { AggregateColumn } from '../src/decorators/AggregateColumn';
import { RollupColumn } from '../src/decorators/RollupColumn';
import { Entity, PrimaryColumn } from 'typeorm';
import { AggregateType } from '@timescaledb/schemas';

describe('Rollup Decorator', () => {
  it('should throw error when bucket column is missing in rollup', () => {
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    @ContinuousAggregate(Metric, {
      name: 'hourly_metrics',
      bucket_interval: '1 hour',
    })
    class HourlyMetrics {
      @BucketColumn({
        source_column: 'time',
      })
      hour!: Date;

      @AggregateColumn({
        type: AggregateType.Count,
      })
      total!: number;
    }

    expect(() => {
      @Rollup(HourlyMetrics, {
        name: 'daily_metrics',
        bucket_interval: '1 day',
      })
      class DailyMetrics {
        @RollupColumn({
          type: AggregateType.Sum,
          source_column: 'total',
        })
        daily_total!: number;
      }

      new DailyMetrics();
    }).toThrow('Continuous aggregates must have exactly one column decorated with @BucketColumn');
  });

  it('should throw error when rollup bucket column references invalid source column', () => {
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    @ContinuousAggregate(Metric, {
      name: 'hourly_metrics',
      bucket_interval: '1 hour',
    })
    class HourlyMetrics {
      @BucketColumn({
        source_column: 'time',
      })
      hour!: Date;

      @AggregateColumn({
        type: AggregateType.Count,
      })
      total!: number;
    }

    expect(() => {
      @Rollup(HourlyMetrics, {
        name: 'daily_metrics',
        bucket_interval: '1 day',
      })
      class DailyMetrics {
        @BucketColumn({
          source_column: 'total', // This should be 'hour'
        })
        day!: Date;

        @RollupColumn({
          type: AggregateType.Sum,
          source_column: 'total',
        })
        daily_total!: number;
      }

      new DailyMetrics();
    }).toThrow('Rollup bucket column must reference a bucket column from the source view');
  });

  it('should throw error when multiple bucket columns are defined in rollup', () => {
    // Define source entity
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    // Define source continuous aggregate
    @ContinuousAggregate(Metric, {
      name: 'hourly_metrics',
      bucket_interval: '1 hour',
    })
    class HourlyMetrics {
      @BucketColumn({
        source_column: 'time',
      })
      hour!: Date;

      @AggregateColumn({
        type: AggregateType.Count,
      })
      total!: number;
    }

    // Attempt to create rollup with multiple bucket columns
    expect(() => {
      @Rollup(HourlyMetrics, {
        name: 'daily_metrics',
        bucket_interval: '1 day',
      })
      class DailyMetrics {
        @BucketColumn({
          source_column: 'hour',
        })
        day!: Date;

        @BucketColumn({
          source_column: 'hour',
        })
        month!: Date;

        @RollupColumn({
          type: AggregateType.Sum,
          source_column: 'total',
        })
        daily_total!: number;
      }

      new DailyMetrics();
    }).toThrow('Only one @BucketColumn is allowed per continuous aggregate');
  });

  it('should work with valid bucket column configuration', () => {
    // Define source entity
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    // Define source continuous aggregate
    @ContinuousAggregate(Metric, {
      name: 'hourly_metrics',
      bucket_interval: '1 hour',
    })
    class HourlyMetrics {
      @BucketColumn({
        source_column: 'time',
      })
      hour!: Date;

      @AggregateColumn({
        type: AggregateType.Count,
      })
      total!: number;
    }

    // Define valid rollup
    expect(() => {
      @Rollup(HourlyMetrics, {
        name: 'daily_metrics',
        bucket_interval: '1 day',
      })
      class DailyMetrics {
        @BucketColumn({
          source_column: 'hour',
        })
        day!: Date;

        @RollupColumn({
          type: AggregateType.Sum,
          source_column: 'total',
        })
        daily_total!: number;
      }

      new DailyMetrics();
    }).not.toThrow();
  });
});

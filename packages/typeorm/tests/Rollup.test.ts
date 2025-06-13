import { describe, it, expect } from '@jest/globals';
import { ContinuousAggregate } from '../src/decorators/ContinuousAggregate';
import { BucketColumn } from '../src/decorators/BucketColumn';
import { Rollup } from '../src/decorators/Rollup';
import { AggregateColumn } from '../src/decorators/AggregateColumn';
import { RollupColumn } from '../src/decorators/RollupColumn';
import { Entity, PrimaryColumn } from 'typeorm';
import { AggregateType } from '@timescaledb/schemas';
import { ROLLUP_METADATA_KEY } from '../src/decorators/Rollup';

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

  it('should verify source model type by checking metadata', () => {
    // Create a mock source model class with rollup metadata
    @Entity('source')
    class SourceWithRollup {
      @PrimaryColumn()
      id!: number;
    }

    // Add rollup metadata to simulate it being a rollup view
    Reflect.defineMetadata(
      ROLLUP_METADATA_KEY,
      {
        isRollup: true,
        sourceModel: {},
        options: {},
        rollupConfig: {},
      },
      SourceWithRollup,
    );

    expect(() => {
      @Rollup(SourceWithRollup, {
        name: 'another_rollup',
        bucket_interval: '1 day',
      })
      class InvalidRollup {
        @BucketColumn({
          source_column: 'time',
        })
        day!: Date;
      }

      new InvalidRollup();
    }).toThrow('Multi-level rollups are not supported');
  });

  it('should work with valid bucket column configuration', () => {
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

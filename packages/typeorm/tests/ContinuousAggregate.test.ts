import { describe, it, expect } from '@jest/globals';
import { ContinuousAggregate } from '../src/decorators/ContinuousAggregate';
import { BucketColumn } from '../src/decorators/BucketColumn';
import { AggregateColumn } from '../src/decorators/AggregateColumn';
import { Entity, PrimaryColumn } from 'typeorm';
import { AggregateType } from '@timescaledb/schemas';

describe('ContinuousAggregate Decorator', () => {
  it('should throw error when bucket column is missing', () => {
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    expect(() => {
      @ContinuousAggregate(Metric, {
        name: 'hourly_metrics',
        bucket_interval: '1 hour',
      })
      class HourlyMetrics {
        @AggregateColumn({
          type: AggregateType.Count,
        })
        total!: number;
      }

      new HourlyMetrics();
    }).toThrow('Continuous aggregates must have exactly one column decorated with @BucketColumn');
  });

  it('should throw error when multiple bucket columns are defined', () => {
    @Entity('metrics')
    class Metric {
      @PrimaryColumn()
      id!: number;

      @PrimaryColumn({ type: 'timestamp' })
      time!: Date;

      @PrimaryColumn()
      value!: number;
    }

    expect(() => {
      @ContinuousAggregate(Metric, {
        name: 'hourly_metrics',
        bucket_interval: '1 hour',
      })
      class HourlyMetrics {
        @BucketColumn({
          source_column: 'time',
        })
        hour!: Date;

        @BucketColumn({
          source_column: 'time',
        })
        day!: Date;

        @AggregateColumn({
          type: AggregateType.Count,
        })
        total!: number;
      }

      new HourlyMetrics();
    }).toThrow('Only one @BucketColumn is allowed per continuous aggregate');
  });
});

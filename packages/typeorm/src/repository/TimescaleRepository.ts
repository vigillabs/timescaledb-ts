import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { CompressionStats, TimeBucketConfig, TimeBucketConfigSchema, TimeRange } from '@timescaledb/schemas';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';

type EntityColumns<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type TimeBucketMetricType = 'count' | 'distinct_count';

export interface TimeBucketMetric<T> {
  type: TimeBucketMetricType;
  column?: EntityColumns<T>;
  alias?: string;
}

export interface TimeBucketOptions<T> {
  timeRange: {
    start: Date;
    end: Date;
  };
  bucket: {
    interval: string;
    metrics: TimeBucketMetric<T>[];
  };
}

export interface TimescaleRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
  getCompressionStats(): Promise<CompressionStats>;
  getTimeBucket<T extends ObjectLiteral>(
    options: TimeBucketOptions<T>,
  ): Promise<
    Array<{
      interval: string;
      [key: string]: number | string;
    }>
  >;
}

export const timescaleMethods = {
  async getCompressionStats(this: Repository<ObjectLiteral>): Promise<CompressionStats> {
    try {
      const target = this.target as Function;
      const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);
      if (!options) {
        throw new Error(`Entity is not a hypertable`);
      }

      const hypertable = TimescaleDB.createHypertable(this.metadata.tableName, options);

      const sql = hypertable
        .compression()
        .stats({
          select: {
            total_chunks: true,
            compressed_chunks: true,
          },
        })
        .build();

      const [stats] = await this.query(sql);

      return {
        compressed_chunks: stats?.compressed_chunks ?? 0,
        total_chunks: stats?.total_chunks ?? 0,
      };
    } catch (error) {
      console.error('Error getting compression stats:', error);
      return {
        compressed_chunks: 0,
        total_chunks: 0,
      };
    }
  },
  async getTimeBucket<T extends ObjectLiteral>(
    this: Repository<T>,
    options: TimeBucketOptions<T>,
  ): Promise<
    Array<{
      interval: string;
      [key: string]: number | string;
    }>
  > {
    const target = this.target as Function;
    const hypertableOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);

    if (!hypertableOptions) {
      throw new Error(`Entity is not a hypertable`);
    }

    const hypertable = TimescaleDB.createHypertable(this.metadata.tableName, hypertableOptions);

    const timeRange: TimeRange = {
      start: options.timeRange.start,
      end: options.timeRange.end,
    };

    const builderConfig: TimeBucketConfig = {
      interval: options.bucket.interval,
      metrics: options.bucket.metrics.map((metric) => ({
        type: metric.type,
        column: metric.column?.toString(),
        alias: metric.alias,
      })),
    };

    TimeBucketConfigSchema.parse(builderConfig);

    const { sql, params } = hypertable.timeBucket(timeRange, builderConfig).build();
    const results = await this.query(sql, params);

    return results.map((row: any) => {
      const formattedRow: { [key: string]: number | string } = {
        interval: row.interval,
      };

      options.bucket.metrics.forEach((metric) => {
        const alias = metric.alias || 'count';
        formattedRow[alias] = Number(row[alias]);
      });

      return formattedRow;
    });
  },
};

// Module augmentation for TypeORM
declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Repository<Entity extends ObjectLiteral> {
    getCompressionStats(): Promise<CompressionStats>;
    getTimeBucket<T extends ObjectLiteral>(
      options: TimeBucketOptions<T>,
    ): Promise<
      Array<{
        interval: string;
        [key: string]: number | string;
      }>
    >;
  }
}

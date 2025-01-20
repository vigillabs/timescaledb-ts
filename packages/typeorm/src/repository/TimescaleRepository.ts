import { Repository, ObjectLiteral } from 'typeorm';
import { CompressionStats } from '@timescaledb/schemas';
import { getCompressionStats } from './get-compression-stats';
import { getTimeBucket } from './get-time-bucket';

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
  getCompressionStats,
  getTimeBucket,
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

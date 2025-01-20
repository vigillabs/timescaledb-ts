import { Repository, ObjectLiteral } from 'typeorm';
import { CompressionStats, TimeBucketOptions } from '@timescaledb/schemas';
import { getCompressionStats } from './get-compression-stats';
import { getTimeBucket } from './get-time-bucket';

type GetCompressionStats = () => Promise<CompressionStats>;

type GetTimeBucket = <T extends ObjectLiteral>(
  options: TimeBucketOptions<T>,
) => Promise<
  Array<{
    interval: string;
    [key: string]: number | string;
  }>
>;

export interface TimescaleRepository<Entity extends ObjectLiteral> extends Repository<Entity> {
  getCompressionStats: GetCompressionStats;
  getTimeBucket: GetTimeBucket;
}

export const timescaleMethods = {
  getCompressionStats,
  getTimeBucket,
};

// Module augmentation for TypeORM
declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Repository<Entity extends ObjectLiteral> {
    getCompressionStats: GetCompressionStats;
    getTimeBucket: GetTimeBucket;
  }
}

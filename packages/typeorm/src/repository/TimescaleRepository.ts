import { Repository, ObjectLiteral } from 'typeorm';
import { CandlestickResult, CompressionStats, GetCandlestickOptions, TimeBucketOptions } from '@timescaledb/schemas';
import { getCompressionStats } from './get-compression-stats';
import { getTimeBucket } from './get-time-bucket';
import { getCandlestick } from './get-candlestick';

type GetCandlestick = <T extends ObjectLiteral>(
  this: Repository<T>,
  options: GetCandlestickOptions,
) => Promise<CandlestickResult[]>;

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
  getCandlestick: GetCandlestick;
}

export const timescaleMethods = {
  getCompressionStats,
  getTimeBucket,
  getCandlestick,
};

// Module augmentation for TypeORM
declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Repository<Entity extends ObjectLiteral> {
    getCompressionStats: GetCompressionStats;
    getTimeBucket: GetTimeBucket;
    getCandlestick: GetCandlestick;
  }
}

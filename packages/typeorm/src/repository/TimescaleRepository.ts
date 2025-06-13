import { Repository, ObjectLiteral } from 'typeorm';
import { CandlesticksResult, CompressionStats, GetCandlesticksOptions, TimeBucketOptions } from '@vigillabs/timescale-db-schemas';
import { getCompressionStats } from './get-compression-stats';
import { getTimeBucket } from './get-time-bucket';
import { getCandlesticks } from './get-candlesticks';

type GetCandlesticks = <T extends ObjectLiteral>(
  this: Repository<T>,
  options: GetCandlesticksOptions,
) => Promise<CandlesticksResult[]>;

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
  getCandlesticks: GetCandlesticks;
}

export const timescaleMethods = {
  getCompressionStats,
  getTimeBucket,
  getCandlesticks,
};

// Module augmentation for TypeORM
declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Repository<Entity extends ObjectLiteral> {
    getCompressionStats: GetCompressionStats;
    getTimeBucket: GetTimeBucket;
    getCandlesticks: GetCandlesticks;
  }
}

import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { GetCandlestickOptions, CandlestickResult } from '@timescaledb/schemas';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';

export async function getCandlestick<T extends ObjectLiteral>(
  this: Repository<T>,
  options: GetCandlestickOptions,
): Promise<CandlestickResult[]> {
  const target = this.target as Function;
  const hypertableOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);

  if (!hypertableOptions?.by_range?.column_name) {
    throw new Error('Entity is not a hypertable');
  }

  const candlestick = TimescaleDB.createCandlestickAggregate(this.metadata.tableName, {
    ...options.config,
    time_column: hypertableOptions.by_range.column_name,
  });

  const sql = candlestick.build();

  const results = await this.query(sql, [
    options.config.bucket_interval || '1 hour',
    options.timeRange.start,
    options.timeRange.end,
  ]);

  return results.map((row: any) => ({
    bucket_time: new Date(row.bucket_time),
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    open_time: new Date(row.open_time),
    high_time: new Date(row.high_time),
    low_time: new Date(row.low_time),
    close_time: new Date(row.close_time),
    ...(row.volume
      ? {
          volume: Number(row.volume),
          vwap: Number(row.vwap),
        }
      : {}),
  }));
}

import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@vigillabs/timescale-db/core';
import { GetCandlesticksOptions, CandlesticksResult } from '@vigillabs/timescale-db/schemas';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { TIME_COLUMN_METADATA_KEY, TimeColumnMetadata } from '../decorators/TimeColumn';
import { debugTypeOrm } from '../debug';

const debug = debugTypeOrm('getCandlesticks');

export async function getCandlesticks<T extends ObjectLiteral>(
  this: Repository<T>,
  options: GetCandlesticksOptions,
): Promise<CandlesticksResult[]> {
  const target = this.target as Function;
  debug(`Getting candlesticks for ${target.name}`);

  const hypertableOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);

  if (!hypertableOptions?.by_range?.column_name) {
    const error = 'Entity is not a hypertable';
    debug(error);
    throw new Error('Entity is not a hypertable');
  }

  const timeColumnMetadata = Reflect.getMetadata(TIME_COLUMN_METADATA_KEY, target) as TimeColumnMetadata;
  if (!timeColumnMetadata) {
    const error = 'Entity must have a column decorated with @TimeColumn';
    debug(error);
    throw new Error('Entity must have a column decorated with @TimeColumn');
  }

  const candlestick = TimescaleDB.createCandlestickAggregate(this.metadata.tableName, {
    ...options.config,
    time_column: timeColumnMetadata.columnName,
  });

  const { sql, params } = candlestick.build({
    range: options.timeRange,
    where: options.where,
  });

  const results = await this.query(sql, params);

  const result = results.map((row: any) => ({
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

  debug('Candlesticks retrieved');

  return result;
}

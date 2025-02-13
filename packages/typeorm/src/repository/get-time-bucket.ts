import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { TimeBucketConfig, TimeBucketConfigSchema, TimeBucketOptions } from '@timescaledb/schemas';
import { debugTypeOrm } from '../debug';

const debug = debugTypeOrm('getTimeBucket');

export async function getTimeBucket<T extends ObjectLiteral>(
  this: Repository<T>,
  options: TimeBucketOptions<T>,
): Promise<
  Array<{
    interval: string;
    [key: string]: number | string;
  }>
> {
  const target = this.target as Function;
  debug(`Getting time bucket for ${target.name}`);

  const hypertableOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, target);

  if (!hypertableOptions) {
    const error = 'Entity is not a hypertable';
    debug(error);
    throw new Error(`Entity is not a hypertable`);
  }

  const hypertable = TimescaleDB.createHypertable(this.metadata.tableName, hypertableOptions);

  const builderConfig: TimeBucketConfig = {
    interval: options.bucket.interval,
    metrics: options.bucket.metrics.map((metric) => ({
      type: metric.type,
      column: metric.column?.toString(),
      alias: metric.alias,
    })),
  };

  TimeBucketConfigSchema.parse(builderConfig);

  const { sql, params } = hypertable.timeBucket(builderConfig).build({
    range: {
      start: options.timeRange.start,
      end: options.timeRange.end,
    },
    where: options.where,
  });
  const results = await this.query(sql, params);

  const result = results.map((row: any) => {
    const formattedRow: { [key: string]: number | string } = {
      interval: row.interval,
    };

    options.bucket.metrics.forEach((metric) => {
      const alias = metric.alias || 'count';
      formattedRow[alias] = Number(row[alias]);
    });

    return formattedRow;
  });

  debug('Time bucket retrieved');

  return result;
}

import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { Repository, ObjectLiteral } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { TimeBucketConfig, TimeBucketConfigSchema, TimeBucketOptions, TimeRange } from '@timescaledb/schemas';

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
}

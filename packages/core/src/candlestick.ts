import { CandlestickAggregateOptions, CandlestickAggregateOptionsSchema } from '@timescaledb/schemas';
import { escapeIdentifier, escapeLiteral } from '@timescaledb/utils';

export class CandlestickAggregateBuilder {
  private statements: string[] = [];
  private options: CandlestickAggregateOptions;
  private tableName: string;

  constructor(tableName: string, options: CandlestickAggregateOptions) {
    this.tableName = tableName;
    this.options = CandlestickAggregateOptionsSchema.parse(options);
  }

  public build(): string {
    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.options.time_column);
    const timeColumnLiteral = escapeLiteral(this.options.time_column);
    const priceColumn = escapeIdentifier(this.options.price_column);
    const volumeColumn = this.options.volume_column ? escapeIdentifier(this.options.volume_column) : null;
    const interval = `$1::interval`;

    this.statements.push(`
      WITH time_bucket_groups AS (
        SELECT 
          time_bucket(${interval}, ${timeColumn}) as bucket_time,
          ${timeColumnLiteral}
          first(${priceColumn}, ${timeColumn}) as open,
          last(${priceColumn}, ${timeColumn}) as close,
          max(${priceColumn}) as high,
          min(${priceColumn}) as low,
          first(${timeColumn}, ${timeColumn}) as open_time,
          last(${timeColumn}, ${timeColumn}) as close_time,
          ${timeColumn} as high_time_inner,
          ${timeColumn} as low_time_inner,
          ${
            volumeColumn
              ? `,
          sum(${volumeColumn}) as volume,
          sum(${priceColumn} * ${volumeColumn}) as volume_price_sum`
              : ''
          }
        FROM ${tableName}
        WHERE ${timeColumn} >= $2 AND ${timeColumn} <= $3
        GROUP BY bucket_time, ${timeColumn}
      ),
      time_bucket_with_extremes AS (
        SELECT 
          *,
          first(high_time_inner, ${priceColumn}) as high_time,
          first(low_time_inner, ${priceColumn}) as low_time
        FROM time_bucket_groups
        GROUP BY 
          bucket_time, open, close, high, low, 
          open_time, close_time, ${timeColumn}
          ${volumeColumn ? ', volume, volume_price_sum' : ''}
      )
      SELECT 
        bucket_time,
        open,
        high,
        low,
        close,
        open_time,
        high_time,
        low_time,
        close_time
        ${
          volumeColumn
            ? `,
        volume,
        CASE 
          WHEN volume > 0 THEN volume_price_sum / volume 
          ELSE NULL 
        END as vwap`
            : ''
        }
      FROM time_bucket_with_extremes
      ORDER BY bucket_time ASC
    `);

    return this.statements.join('\n');
  }
}

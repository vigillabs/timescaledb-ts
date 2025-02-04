import {
  CandlestickAggregateOptions,
  CandlestickAggregateOptionsSchema,
  TimeRange,
  WhereClause,
} from '@timescaledb/schemas';
import { buildWhereClause, escapeIdentifier } from '@timescaledb/utils';

export class CandlestickAggregateBuilder {
  private statements: string[] = [];
  private options: CandlestickAggregateOptions;
  private tableName: string;

  constructor(tableName: string, options: CandlestickAggregateOptions) {
    this.tableName = tableName;
    this.options = CandlestickAggregateOptionsSchema.parse(options);
  }

  private buildWhere(where: WhereClause, paramOffset = 1): { sql: string; params: any[] } {
    if (!where) {
      return { sql: '', params: [] };
    }

    const { sql, params } = buildWhereClause(where, paramOffset);

    return { sql: ` AND ${sql}`, params };
  }

  public build({ where, range }: { where?: WhereClause; range?: TimeRange } = {}): { sql: string; params: any[] } {
    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.options.time_column);
    const priceColumn = escapeIdentifier(this.options.price_column);
    const volumeColumn = this.options.volume_column ? escapeIdentifier(this.options.volume_column) : null;
    const interval = '$1::interval';

    this.statements = [];

    this.statements.push(`SELECT`);
    this.statements.push(`  time_bucket(${interval}, ${timeColumn}) as bucket_time,`);
    this.statements.push(
      `  open(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as open,`,
    );
    this.statements.push(
      `  high(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as high,`,
    );
    this.statements.push(
      `  low(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as low,`,
    );
    this.statements.push(
      `  close(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as close,`,
    );
    this.statements.push(
      `  open_time(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as open_time,`,
    );
    this.statements.push(
      `  high_time(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as high_time,`,
    );
    this.statements.push(
      `  low_time(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as low_time,`,
    );
    this.statements.push(
      `  close_time(candlestick_agg(${timeColumn}, ${priceColumn}${volumeColumn ? `, ${volumeColumn}` : ''})) as close_time`,
    );

    if (volumeColumn) {
      this.statements.push(`  ,volume(candlestick_agg(${timeColumn}, ${priceColumn}, ${volumeColumn})) as volume,`);
      this.statements.push(`  vwap(candlestick_agg(${timeColumn}, ${priceColumn}, ${volumeColumn})) as vwap`);
    }

    this.statements.push(`FROM ${tableName}`);

    const params: (string | Date)[] = [this.options.bucket_interval || '1 hour'];
    if (range) {
      params.push(range.start, range.end);
    }

    const whereClause = this.buildWhere(where as WhereClause, params.length + 1);
    const timeRangeWhere = range ? `WHERE ${timeColumn} >= $2 AND ${timeColumn} <= $3` : '';
    const fullWhere = timeRangeWhere + whereClause.sql;

    if (fullWhere) {
      this.statements.push(fullWhere);
    }

    params.push(...whereClause.params);

    this.statements.push(`GROUP BY bucket_time`);
    this.statements.push(`ORDER BY bucket_time ASC;`);

    return {
      sql: this.statements.join('\n'),
      params,
    };
  }
}

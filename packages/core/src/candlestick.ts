import {
  CandlestickAggregateOptions,
  CandlestickAggregateOptionsSchema,
  TimeRange,
  WhereClause,
} from '@vigillabs/timescale-db-schemas';
import { buildWhereClause, escapeIdentifier } from '@vigillabs/timescale-db-utils';
import { debugCore } from './debug';

const debug = debugCore('Candlestick');

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
    debug(`Building candlestick query for table '${this.tableName}'`);
    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.options.time_column!);
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

    const result = {
      sql: this.statements.join('\n'),
      params,
    };

    debug(`Candlestick query built for '${this.tableName}':\n${result.sql}`);
    return result;
  }
}

export interface CandlestickMetadata {
  propertyName: string;
  timeColumn?: string;
  priceColumn?: string;
  volumeColumn?: string;
  sourceColumn?: string;
}

export class CandlestickBuilder {
  static generateSQL(metadata: CandlestickMetadata, isRollup: boolean = false): string {
    debug(`Generating SQL for candlestick ${isRollup ? 'rollup' : 'aggregation'}`);

    if (!metadata) return '';

    const targetColumn = escapeIdentifier(metadata.propertyName);

    if (isRollup) {
      if (!metadata.sourceColumn) {
        debug('Error: source_column missing for rollup');
        throw new Error('source_column must be specified for candlestick rollups');
      }
      const sourceColumn = escapeIdentifier(metadata.sourceColumn);
      const result = `rollup(${sourceColumn}) as ${targetColumn}`;
      debug(`Generated rollup SQL: ${result}`);
      return result;
    }

    if (!metadata.timeColumn || !metadata.priceColumn) {
      debug('Error: required columns missing for aggregation');
      throw new Error('time_column and price_column must be specified for candlestick aggregation');
    }

    const args = [escapeIdentifier(metadata.timeColumn), escapeIdentifier(metadata.priceColumn)];

    if (metadata.volumeColumn) {
      args.push(escapeIdentifier(metadata.volumeColumn));
    }

    const result = `candlestick_agg(${args.join(', ')}) as ${targetColumn}`;
    debug(`Generated aggregation SQL: ${result}`);
    return result;
  }
}

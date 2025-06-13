import { MetricConfig, TimeBucketConfig, TimeRange, WhereClause } from '@vigillabs/timescale-db-schemas';
import { buildWhereClause, escapeIdentifier } from '@vigillabs/timescale-db-utils';
import { debugCore } from './debug';

const debug = debugCore('TimeBucketBuilder');

export class TimeBucketBuilder {
  private statements: string[] = [];
  private metricStatements: string[] = [];
  private tableName: string;
  private timeColumn: string;
  private interval: string;
  private metrics: MetricConfig[];
  private params: any[] = [];

  constructor(tableName: string, timeColumn: string, config: TimeBucketConfig) {
    this.tableName = tableName;
    this.timeColumn = timeColumn;
    this.interval = config.interval;
    this.metrics = config.metrics;
  }

  private buildMetrics(): void {
    this.metrics.forEach((metric, index) => {
      const alias = metric.alias || `metric_${index}`;
      const column = metric.column ? escapeIdentifier(metric.column) : '*';

      switch (metric.type) {
        case 'count':
          this.metricStatements.push(`COUNT(${column}) as ${escapeIdentifier(alias)}`);
          break;
        case 'distinct_count':
          this.metricStatements.push(`COUNT(DISTINCT ${column}) as ${escapeIdentifier(alias)}`);
          break;
        case 'sum':
          this.metricStatements.push(`SUM(${column}) as ${escapeIdentifier(alias)}`);
          break;
        case 'avg':
          this.metricStatements.push(`AVG(${column}) as ${escapeIdentifier(alias)}`);
          break;

        case 'min':
          this.metricStatements.push(`MIN(${column}) as ${escapeIdentifier(alias)}`);
          break;

        case 'max':
          this.metricStatements.push(`MAX(${column}) as ${escapeIdentifier(alias)}`);
          break;

        case 'first':
          this.metricStatements.push(`FIRST(${column}) as ${escapeIdentifier(alias)}`);
          break;

        case 'last':
          this.metricStatements.push(`LAST(${column}) as ${escapeIdentifier(alias)}`);
          break;

        default:
          throw new Error(`Unsupported metric type: ${metric.type}`);
      }
    });
  }

  private buildWhere(where: WhereClause, paramOffset = 1): { sql: string; params: any[] } {
    if (!where) {
      return { sql: '', params: [] };
    }

    const { sql, params } = buildWhereClause(where, paramOffset);

    return { sql: ` AND ${sql}`, params };
  }

  public build({ where, range }: { where?: WhereClause; range: TimeRange }): { sql: string; params: any[] } {
    debug(`Building time bucket query for table '${this.tableName}'`);

    if (!range) {
      throw new Error('TimeRange is required');
    }

    this.params = [];
    this.statements = [];
    this.metricStatements = [];

    this.buildMetrics();

    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.timeColumn);

    // First parameter is always the interval
    this.params.push(this.interval);
    const intervalParam = '$1';

    this.params.push(range.start, range.end);

    this.statements.push(`WITH time_buckets AS (`);
    this.statements.push(`  SELECT`);
    this.statements.push(`    time_bucket(${intervalParam}::interval, ${timeColumn}) AS interval,`);
    this.statements.push(`    ${this.metricStatements.join(',\n    ')}`);
    this.statements.push(`  FROM ${tableName}`);

    // Build WHERE clause starting from parameter index 4 (after interval and time range)
    const whereClause = this.buildWhere(where as WhereClause, 4);
    const whereStatement = `  WHERE ${timeColumn} >= $2 AND ${timeColumn} <= $3${whereClause.sql}`;
    this.statements.push(whereStatement);

    this.params.push(...whereClause.params);

    this.statements.push(`  GROUP BY interval`);
    this.statements.push(`  ORDER BY interval DESC`);
    this.statements.push(`)`);
    this.statements.push(`SELECT`);
    this.statements.push(`  TO_CHAR(interval, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as interval,`);

    const metricAliases = this.metrics.map((metric, index) => {
      const alias = metric.alias || `metric_${index}`;
      const escapedAlias = escapeIdentifier(alias);
      return `  ${escapedAlias} as ${escapedAlias}`;
    });

    this.statements.push(metricAliases.join(',\n'));
    this.statements.push(`FROM time_buckets;`);

    const result = {
      sql: this.statements.join('\n'),
      params: this.params,
    };

    debug(`Time bucket query for '${this.tableName}' built\n-SQL:${result.sql}\n-Params:${this.params}`);

    return result;
  }
}

import { MetricConfig, TimeBucketConfig, TimeRange, WhereClause } from '@timescaledb/schemas';
import { buildWhereClause, escapeIdentifier } from '@timescaledb/utils';

export class TimeBucketBuilder {
  private statements: string[] = [];
  private metricStatements: string[] = [];
  private tableName: string;
  private timeColumn: string;
  private interval: string;
  private metrics: MetricConfig[];
  private paramIndex: number = 1;
  private params: any[] = [];

  constructor(tableName: string, timeColumn: string, config: TimeBucketConfig) {
    this.tableName = tableName;
    this.timeColumn = timeColumn;
    this.interval = config.interval;
    this.metrics = config.metrics;
  }

  private addParam(value: any): string {
    this.params.push(value);
    return `$${this.paramIndex++}`;
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
        default:
          throw new Error(`Unsupported metric type: ${metric.type}`);
      }
    });
  }

  private buildWhere(where?: WhereClause): { sql: string; params: any[] } {
    if (!where) {
      return { sql: '', params: [] };
    }

    const { sql, params } = buildWhereClause(where);
    return { sql: ` AND ${sql}`, params };
  }

  public build({ where, range }: { where?: WhereClause; range: TimeRange }): { sql: string; params: any[] } {
    if (!range) {
      throw new Error('TimeRange is required');
    }

    this.paramIndex = 1;
    this.params = [];
    this.statements = [];
    this.metricStatements = [];

    this.buildMetrics();

    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.timeColumn);
    const intervalParam = this.addParam(this.interval);

    this.statements.push(`WITH time_buckets AS (`);
    this.statements.push(`  SELECT`);
    this.statements.push(`    time_bucket(${intervalParam}::interval, ${timeColumn}) AS interval,`);
    this.statements.push(`    ${this.metricStatements.join(',\n    ')}`);
    this.statements.push(`  FROM ${tableName}`);

    // Build complete WHERE clause
    const timeStart = this.addParam(range.start);
    const timeEnd = this.addParam(range.end);
    const whereClause = this.buildWhere(where);
    const whereStatement = `  WHERE ${timeColumn} >= ${timeStart} AND ${timeColumn} <= ${timeEnd}${whereClause.sql}`;
    this.statements.push(whereStatement);

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

    // Add where clause parameters
    this.params.push(...whereClause.params);

    return {
      sql: this.statements.join('\n'),
      params: this.params,
    };
  }
}

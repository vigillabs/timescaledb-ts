import { MetricConfig, TimeBucketConfig, TimeRange } from '@timescaledb/schemas';
import { escapeIdentifier } from '@timescaledb/utils';

export class TimeBucketBuilder {
  private statements: string[] = [];
  private metricStatements: string[] = [];
  private tableName: string;
  private timeColumn: string;
  private interval: string;
  private range: TimeRange;
  private metrics: MetricConfig[];
  private paramIndex: number = 1;
  private params: any[] = [];

  constructor(tableName: string, timeColumn: string, range: TimeRange, config: TimeBucketConfig) {
    this.tableName = tableName;
    this.timeColumn = timeColumn;
    this.interval = config.interval;
    this.range = range;
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

  public build(): { sql: string; params: any[] } {
    this.paramIndex = 1;
    this.params = [];

    this.buildMetrics();

    const tableName = escapeIdentifier(this.tableName);
    const timeColumn = escapeIdentifier(this.timeColumn);
    const intervalParam = this.addParam(this.interval);

    this.statements.push(`WITH time_buckets AS (`);
    this.statements.push(`  SELECT`);
    this.statements.push(`    time_bucket(${intervalParam}::interval, ${timeColumn}) AS interval,`);
    this.statements.push(`    ${this.metricStatements.join(',\n    ')}`);
    this.statements.push(`  FROM ${tableName}`);
    this.statements.push(`  WHERE ${timeColumn} >= ${this.addParam(this.range.start)}`);
    this.statements.push(`    AND ${timeColumn} <= ${this.addParam(this.range.end)}`);
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

    return {
      sql: this.statements.join('\n'),
      params: this.params,
    };
  }
}

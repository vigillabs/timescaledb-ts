import { CreateContinuousAggregateOptions, CreateContinuousAggregateOptionsSchema } from '@timescaledb/schemas';
import { escapeIdentifier, escapeLiteral } from '@timescaledb/utils';

class ContinuousAggregateUpBuilder {
  private statements: string[] = [];

  constructor(
    private name: string,
    private source: string,
    private options: CreateContinuousAggregateOptions,
  ) {}

  public build(): string {
    const viewName = escapeIdentifier(this.name);
    const timeColumn = escapeIdentifier(this.options.time_column);
    const sourceName = escapeIdentifier(this.source);
    const interval = escapeLiteral(this.options.bucket_interval);

    const aggregates = Object.entries(this.options.aggregates).map(([, config]) => {
      const alias = escapeIdentifier(config.column_alias);

      if (config.type === 'count_distinct' && config.column) {
        const column = escapeIdentifier(config.column);
        return `COUNT(DISTINCT ${column}) as ${alias}`;
      }
      return `COUNT(*) as ${alias}`;
    });

    this.statements.push(`
      CREATE MATERIALIZED VIEW ${viewName}
      WITH (
        timescaledb.continuous,
        timescaledb.materialized_only = ${this.options.materialized_only},
        timescaledb.create_group_indexes = ${this.options.create_group_indexes}
      ) AS
      SELECT
        time_bucket(${interval}, ${timeColumn}) as bucket,
        ${aggregates.join(',\n        ')}
      FROM ${sourceName}
      GROUP BY bucket
      WITH NO DATA;
    `);

    if (this.options.refresh_policy) {
      const policy = this.options.refresh_policy;
      this.statements.push(`
        SELECT add_continuous_aggregate_policy(${escapeLiteral(this.name)},
          start_offset => INTERVAL ${escapeLiteral(policy.start_offset)},
          end_offset => INTERVAL ${escapeLiteral(policy.end_offset)},
          schedule_interval => INTERVAL ${escapeLiteral(policy.schedule_interval)});
      `);
    }

    return this.statements.join('\n');
  }
}

class ContinuousAggregateDownBuilder {
  private statements: string[] = [];

  constructor(
    private name: string,
    private options: CreateContinuousAggregateOptions,
  ) {}

  public build(): string {
    const viewName = escapeLiteral(this.name);

    if (this.options.refresh_policy) {
      this.statements.push(`
        SELECT remove_continuous_aggregate_policy(${viewName}, if_exists => true);
      `);
    }

    this.statements.push(`DROP MATERIALIZED VIEW IF EXISTS ${escapeIdentifier(this.name)};`);

    return this.statements.join('\n');
  }
}

class ContinuousAggregateInspectBuilder {
  private statements: string[] = [];

  constructor(private name: string) {}

  public build(): string {
    const viewName = escapeLiteral(this.name);

    this.statements.push(`
      SELECT
        EXISTS (
          SELECT FROM pg_catalog.pg_class c
          JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'
          AND c.relname = ${viewName}
        ) AS view_exists,
        EXISTS (
          SELECT FROM timescaledb_information.continuous_aggregates
          WHERE view_name = ${viewName}
        ) AS is_continuous_aggregate;
    `);

    return this.statements.join('\n');
  }
}

export class ContinuousAggregate {
  private name: string;
  private source: string;
  private options: CreateContinuousAggregateOptions;

  constructor(name: string, source: string, options: CreateContinuousAggregateOptions) {
    this.name = name;
    this.source = source;
    this.options = CreateContinuousAggregateOptionsSchema.parse(options);
  }

  public up(): ContinuousAggregateUpBuilder {
    return new ContinuousAggregateUpBuilder(this.name, this.source, this.options);
  }

  public down(): ContinuousAggregateDownBuilder {
    return new ContinuousAggregateDownBuilder(this.name, this.options);
  }

  public inspect(): ContinuousAggregateInspectBuilder {
    return new ContinuousAggregateInspectBuilder(this.name);
  }
}

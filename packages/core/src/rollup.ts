import { RollupConfig, RollupRule } from '@timescaledb/schemas';
import { escapeIdentifier, escapeLiteral } from '@timescaledb/utils';

class RollupInspectBuilder {
  constructor(private config: RollupConfig) {}

  public build(): string {
    const sourceView = escapeLiteral(this.config.rollupOptions.sourceView);
    const rollupView = escapeLiteral(this.config.rollupOptions.name);

    return `
      SELECT 
        EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = ${sourceView}
        ) as source_view_exists,
        EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = ${rollupView}
        ) as rollup_view_exists;
    `;
  }
}

class RollupUpBuilder {
  private statements: string[] = [];

  constructor(private config: RollupConfig) {}

  private buildRollupSelect(): string {
    const rollupSelects = this.config.rollupOptions.rollupRules.map((rule: RollupRule) => {
      const sourceColumn = escapeIdentifier(rule.sourceColumn);
      const targetColumn = escapeIdentifier(rule.targetColumn || rule.sourceColumn);

      const rollup = `rollup(${rule.sourceColumn})`;

      switch (rule.aggregateType) {
        case 'sum':
          return `sum(${sourceColumn}) as ${targetColumn}`;
        case 'avg':
          return `avg(${sourceColumn}) as ${targetColumn}`;

        default:
          return `${rollup} as ${targetColumn}`;
      }
    });

    const sourceView = escapeIdentifier(this.config.rollupOptions.sourceView);
    const bucketInterval = escapeLiteral(this.config.rollupOptions.bucketInterval);
    const bucketColumn = escapeIdentifier('bucket'); // Assuming 'bucket' is standard

    return `
      SELECT
        time_bucket(${bucketInterval}, ${bucketColumn}) AS ${bucketColumn},
        ${rollupSelects.join(',\n        ')}
      FROM ${sourceView}
      GROUP BY 1 WITH ${this.config.rollupOptions.materializedOnly ? '' : 'NO '}DATA;
    `;
  }

  public build(): string {
    const viewName = escapeIdentifier(this.config.rollupOptions.name);
    this.statements.push(
      `CREATE MATERIALIZED VIEW ${viewName}
      WITH (timescaledb.continuous) AS ${this.buildRollupSelect()}`,
    );

    return this.statements.join('\n');
  }

  public getRefreshPolicy(): string | null {
    if (!this.config.continuousAggregateOptions.refresh_policy) return null;

    const policy = this.config.continuousAggregateOptions.refresh_policy;
    const viewName = escapeLiteral(this.config.rollupOptions.name);

    return `SELECT add_continuous_aggregate_policy(${viewName},
      start_offset => INTERVAL ${escapeLiteral(policy.start_offset)},
      end_offset => INTERVAL ${escapeLiteral(policy.end_offset)},
      schedule_interval => INTERVAL ${escapeLiteral(policy.schedule_interval)}
    );`;
  }
}

class RollupDownBuilder {
  constructor(private config: RollupConfig) {}

  public build(): string[] {
    const statements: string[] = [];
    const viewName = this.config.rollupOptions.name;

    if (this.config.continuousAggregateOptions.refresh_policy) {
      statements.push(`SELECT remove_continuous_aggregate_policy(${escapeLiteral(viewName)}, if_exists => true);`);
    }

    statements.push(`DROP MATERIALIZED VIEW IF EXISTS ${escapeIdentifier(viewName)};`);

    return statements;
  }
}

export class RollupBuilder {
  constructor(private config: RollupConfig) {}

  public up(): RollupUpBuilder {
    return new RollupUpBuilder(this.config);
  }

  public down(): RollupDownBuilder {
    return new RollupDownBuilder(this.config);
  }

  public inspect(): RollupInspectBuilder {
    return new RollupInspectBuilder(this.config);
  }
}

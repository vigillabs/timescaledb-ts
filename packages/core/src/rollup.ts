import { RollupConfig, RollupRule } from '@timescaledb/schemas';
import { escapeIdentifier, escapeLiteral } from '@timescaledb/utils';
import { CandlestickBuilder, CandlestickMetadata } from './candlestick';

import { debugCore } from './debug';

const debug = debugCore('RollupBuilder');

export interface RollupMetadata {
  candlestick?: CandlestickMetadata;
  rollupRules: Array<RollupRule>;
}

class RollupInspectBuilder {
  constructor(private config: RollupConfig) {}

  public build(): string {
    debug(`Building inspect query for rollup '${this.config.rollupOptions.name}'`);

    if (!this.config || !this.config.rollupOptions) {
      throw new Error('Invalid rollup configuration 1');
    }

    const sourceView = escapeLiteral(this.config.rollupOptions.sourceView);
    const rollupView = escapeLiteral(this.config.rollupOptions.name);

    const result = `
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

    debug(`Inspect query '${this.config.rollupOptions.name}' built:\n${result}`);

    return result;
  }
}

class RollupUpBuilder {
  private statements: string[] = [];

  constructor(private config: RollupConfig) {}

  private buildRollupSelect(metadata: { candlestick?: CandlestickMetadata; rollupRules: Array<RollupRule> }): string {
    const selectStatements: string[] = [];

    const bucketInterval = escapeLiteral(this.config.rollupOptions.bucketInterval);
    const bucketColumnSource = escapeIdentifier(this.config.rollupOptions.bucketColumn.source || 'bucket');
    const bucketColumnTarget = escapeIdentifier(this.config.rollupOptions.bucketColumn.target || 'bucket');
    selectStatements.push(`time_bucket(${bucketInterval}::interval, ${bucketColumnSource}) AS ${bucketColumnTarget}`);

    const groupColumns = this.config.continuousAggregateOptions.group_columns || [];
    for (const column of groupColumns) {
      const escapedColumn = escapeIdentifier(column);
      selectStatements.push(`${escapedColumn} as ${escapedColumn}`);
    }

    if (metadata.candlestick) {
      const rollupSql = CandlestickBuilder.generateSQL(metadata.candlestick, true);
      if (rollupSql) {
        selectStatements.push(rollupSql);
      }
    }

    const rollupSelects = metadata.rollupRules.map((rule) => {
      const sourceColumn = escapeIdentifier(rule.sourceColumn);
      const targetColumn = escapeIdentifier(rule.targetColumn || 'bucket');

      if (rule.aggregateType) {
        switch (rule.aggregateType) {
          case 'sum':
            return `sum(${sourceColumn}) as ${targetColumn}`;
          case 'avg':
            return `avg(${sourceColumn}) as ${targetColumn}`;
          default:
            return `rollup(${sourceColumn}) as ${targetColumn}`;
        }
      }

      return `${rule.rollupFn || 'rollup'}(${sourceColumn}) as ${targetColumn}`;
    });

    selectStatements.push(...rollupSelects);

    const sourceView = escapeIdentifier(this.config.rollupOptions.sourceView);

    const groupByCols = ['1', ...groupColumns.map((c) => escapeIdentifier(c))];
    const groupByClause = groupByCols.join(', ');

    const result = `
      SELECT
        ${selectStatements.join(',\n      ')}
      FROM ${sourceView}
      GROUP BY ${groupByClause}${this.config.rollupOptions.materializedOnly ? ' WITH ' : ' WITH NO '}DATA;
    `;

    return result;
  }

  public build(metadata?: RollupMetadata): string {
    debug('Building rollup query');

    const _metadata = metadata || ({ rollupRules: this.config.rollupOptions.rollupRules || [] } as RollupMetadata);
    const viewName = escapeIdentifier(this.config.rollupOptions.name);
    this.statements.push(
      `CREATE MATERIALIZED VIEW ${viewName}
      WITH (timescaledb.continuous) AS ${this.buildRollupSelect(_metadata)}`,
    );

    debug(`Rollup query built:\n${this.statements.join('\n')}`);

    return this.statements.join('\n');
  }

  public getRefreshPolicy(): string | null {
    if (!this.config.rollupOptions.refresh_policy) return null;
    debug('Building refresh policy query');

    const policy = this.config.rollupOptions.refresh_policy;
    const viewName = escapeLiteral(this.config.rollupOptions.name);

    const result = `SELECT add_continuous_aggregate_policy(${viewName},
      start_offset => INTERVAL ${escapeLiteral(policy.start_offset)},
      end_offset => INTERVAL ${escapeLiteral(policy.end_offset)},
      schedule_interval => INTERVAL ${escapeLiteral(policy.schedule_interval)}
    );`;

    debug(`Refresh policy query built:\n${result}`);

    return result;
  }
}

class RollupDownBuilder {
  constructor(private config: RollupConfig) {}

  public build(): string[] {
    debug('Building down query');

    const statements: string[] = [];
    const viewName = this.config.rollupOptions.name;

    if (this.config.continuousAggregateOptions.refresh_policy) {
      statements.push(`SELECT remove_continuous_aggregate_policy(${escapeLiteral(viewName)}, if_exists => true);`);
    }

    statements.push(`DROP MATERIALIZED VIEW IF EXISTS ${escapeIdentifier(viewName)};`);

    debug(`Down query built:\n${statements.join('\n')}`);

    return statements;
  }
}

export class RollupBuilder {
  constructor(private config: RollupConfig) {
    if (!config || !config.rollupOptions) {
      throw new Error('Invalid rollup configuration 2');
    }
  }

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

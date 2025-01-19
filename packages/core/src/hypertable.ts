import { CreateHypertableOptions, CreateHypertableOptionsSchema } from '@timescaledb/schemas';
import { HypertableErrors } from './errors';
import { escapeIdentifier, escapeLiteral, validateIdentifier } from '@timescaledb/utils';

class HypertableUpBuilder {
  private options: CreateHypertableOptions;
  private name: string;
  private statements: string[] = [];

  constructor(name: string, options: CreateHypertableOptions) {
    this.name = name;
    this.options = options;
  }

  public build(): string {
    const tableName = escapeIdentifier(this.name);

    this.statements.push(
      `SELECT create_hypertable(${escapeLiteral(this.name)}, by_range(${escapeLiteral(this.options.by_range.column_name)}));`,
    );

    if (this.options.compression?.compress) {
      const orderBy = escapeIdentifier(this.options.compression.compress_orderby);
      const segmentBy = escapeIdentifier(this.options.compression.compress_segmentby);

      const alter = `ALTER TABLE ${tableName} SET (
        timescaledb.compress,
        timescaledb.compress_orderby = ${orderBy},
        timescaledb.compress_segmentby = ${segmentBy}
      );`;
      this.statements.push(alter);

      if (this.options.compression.policy) {
        const interval = escapeLiteral(this.options.compression.policy.schedule_interval);
        const policy = `SELECT add_compression_policy(${escapeLiteral(this.name)}, INTERVAL ${interval});`;
        this.statements.push(policy);
      }
    }

    return this.statements.join('\n');
  }
}

class HypertableDownBuilder {
  private name: string;
  private options: CreateHypertableOptions;
  private statements: string[] = [];

  constructor(name: string, options: CreateHypertableOptions) {
    this.name = name;
    this.options = options;
  }

  public build(): string {
    const tableName = escapeIdentifier(this.name);
    const literalName = escapeLiteral(this.name);

    if (this.options.compression?.compress) {
      this.statements.push(`ALTER TABLE ${tableName} SET (timescaledb.compress = false);`);
    }

    if (this.options.compression?.policy) {
      this.statements.push(`SELECT remove_compression_policy(${literalName}, if_exists => true);`);
    }

    this.statements.push(`SELECT drop_chunks(${literalName}, NOW()::timestamp without time zone);`);

    return this.statements.join('\n');
  }
}

export class Hypertable {
  private options: CreateHypertableOptions;
  private name: string;

  constructor(name: string, options: CreateHypertableOptions) {
    if (!name) {
      throw new Error(HypertableErrors.NAME_REQUIRED);
    }

    try {
      validateIdentifier(name, true);
      this.name = name;
    } catch (error) {
      throw new Error(HypertableErrors.INVALID_NAME + ' ' + (error as Error).message);
    }

    if (!options) {
      throw new Error(HypertableErrors.OPTIONS_REQUIRED);
    }

    try {
      this.options = CreateHypertableOptionsSchema.parse(options);
    } catch (error) {
      const e = error as Error;
      throw new Error(HypertableErrors.INVALID_OPTIONS + ' ' + e.message);
    }
  }

  public up(): HypertableUpBuilder {
    return new HypertableUpBuilder(this.name, this.options);
  }

  public down(): HypertableDownBuilder {
    return new HypertableDownBuilder(this.name, this.options);
  }
}

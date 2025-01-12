import { CreateHypertableOptions, CreateHypertableOptionsSchema } from '@timescaledb/schemas';
import { HypertableErrors } from './errors';

class HypertableUpBuilder {
  private options: CreateHypertableOptions;
  private name: string;
  private statements: string[] = [];

  constructor(name: string, options: CreateHypertableOptions) {
    this.name = name;
    this.options = CreateHypertableOptionsSchema.parse(options);
  }

  public build(): string {
    this.statements.push(`SELECT create_hypertable('${this.name}', by_range('${this.options.by_range.column_name}'));`);

    if (this.options.compression?.compress) {
      const orderBy = this.options.compression.compress_orderby;
      const segmentBy = this.options.compression.compress_segmentby;

      const alter = `ALTER TABLE ${this.name} SET (
        timescaledb.compress, 
        timescaledb.compress_orderby = '${orderBy}', 
        timescaledb.compress_segmentby = '${segmentBy}' 
      );`;
      this.statements.push(alter);

      if (this.options.compression.policy) {
        const scheduleInterval = this.options.compression.policy.schedule_interval;
        const policy = `SELECT add_compression_policy('${this.name}', INTERVAL '${scheduleInterval}');`;
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
    this.options = CreateHypertableOptionsSchema.parse(options);
  }

  public build(): string {
    if (this.options.compression?.compress) {
      this.statements.push(`ALTER TABLE ${this.name} SET (timescaledb.compress = false);`);
    }

    if (this.options.compression?.policy) {
      this.statements.push(`SELECT remove_compression_policy('${this.name}');`);
    }

    this.statements.push(`SELECT drop_chunks('${this.name}', NOW());`);

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
    this.name = name;

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

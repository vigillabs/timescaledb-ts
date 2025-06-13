import { CompressionSelect, CompressionSelectSchema, CreateHypertableOptions } from '@vigillabs/timescale-db/schemas';
import { escapeLiteral } from '@vigillabs/timescale-db/utils';
import { debugCore } from './debug';

const debug = debugCore('Compression');

class CompressionStatsBuilder {
  private statements: string[] = [];
  private name: string;
  private options: CompressionSelect;

  constructor(name: string, select: CompressionSelect) {
    this.name = name;
    this.options = select;
  }

  public build(): string {
    debug(`Building compression stats query for '${this.name}'`);
    this.statements.push(`SELECT`);

    const columns: string[] = [];

    if (this.options.total_chunks) {
      columns.push(`COALESCE(total_chunks, 0)::integer as total_chunks`);
    }

    if (this.options.compressed_chunks) {
      columns.push(`COALESCE(number_compressed_chunks, 0)::integer as compressed_chunks`);
    }

    if (columns.length === 0) {
      this.statements.push(`*`);
    } else {
      this.statements.push(columns.join(',\n'));
    }

    const literalName = escapeLiteral(this.name);
    this.statements.push(`FROM hypertable_compression_stats(${literalName});`);

    const result = this.statements.join('\n');
    debug(`Compression stats query built for '${this.name}':\n${result}`);
    return result;
  }
}

export class CompressionBuilder {
  private name: string;
  private options: CreateHypertableOptions;

  constructor(name: string, options: CreateHypertableOptions) {
    this.name = name;
    this.options = options;
  }

  public stats(statOpts: { select: CompressionSelect }): CompressionStatsBuilder {
    const select = CompressionSelectSchema.parse(statOpts.select);
    return new CompressionStatsBuilder(this.name, select);
  }
}

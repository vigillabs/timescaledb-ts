import { CreateExtensionOptions, CreateExtensionOptionsSchema } from '@timescaledb/schemas';
import { ExtensionErrors } from './errors';

class ExtensionUpBuilder {
  private options?: CreateExtensionOptions;
  private statements: string[] = [];

  constructor(options?: CreateExtensionOptions) {
    this.options = options;
  }

  public build(): string {
    const stmt = `CREATE EXTENSION IF NOT EXISTS timescaledb${this?.options?.should_cascade ? ' CASCADE' : ''};`;
    this.statements.push(stmt);

    return this.statements.join('\n');
  }
}

class ExtensionDownBuilder {
  private options?: CreateExtensionOptions;
  private statements: string[] = [];

  constructor(options?: CreateExtensionOptions) {
    this.options = options;
  }

  public build(): string {
    const stmt = `DROP EXTENSION IF EXISTS timescaledb${this?.options?.should_cascade ? ' CASCADE' : ''};`;
    this.statements.push(stmt);

    return this.statements.join('\n');
  }
}

export class Extension {
  private options?: CreateExtensionOptions;

  constructor(options?: CreateExtensionOptions) {
    if (options) {
      try {
        this.options = CreateExtensionOptionsSchema.parse(options);
      } catch (error) {
        const e = error as Error;
        throw new Error(ExtensionErrors.INVALID_OPTIONS + ' ' + e.message);
      }
    }
  }

  public up(): ExtensionUpBuilder {
    return new ExtensionUpBuilder(this.options);
  }

  public down(): ExtensionDownBuilder {
    return new ExtensionDownBuilder(this.options);
  }
}

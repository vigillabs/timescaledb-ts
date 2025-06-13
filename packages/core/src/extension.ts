import { CreateExtensionOptions, CreateExtensionOptionsSchema } from '@vigillabs/timescale-db-schemas';
import { ExtensionErrors } from './errors';
import { debugCore } from './debug';

const debug = debugCore('Extension');

class ExtensionUpBuilder {
  private options?: CreateExtensionOptions;
  private statements: string[] = [];

  constructor(options?: CreateExtensionOptions) {
    this.options = options;
  }

  public build(): string {
    debug('Building up query for timescaledb extension');
    const stmt = `CREATE EXTENSION IF NOT EXISTS timescaledb${this?.options?.should_cascade ? ' CASCADE' : ''};`;
    this.statements.push(stmt);

    const result = this.statements.join('\n');
    debug(`Up query built:\n${result}`);
    return result;
  }
}

class ExtensionDownBuilder {
  private options?: CreateExtensionOptions;
  private statements: string[] = [];

  constructor(options?: CreateExtensionOptions) {
    this.options = options;
  }

  public build(): string {
    debug('Building down query for timescaledb extension');
    const stmt = `DROP EXTENSION IF EXISTS timescaledb${this?.options?.should_cascade ? ' CASCADE' : ''};`;
    this.statements.push(stmt);

    const result = this.statements.join('\n');
    debug(`Down query built:\n${result}`);
    return result;
  }
}

export class Extension {
  private options?: CreateExtensionOptions;

  constructor(options?: CreateExtensionOptions) {
    if (options) {
      try {
        this.options = CreateExtensionOptionsSchema.parse(options);
        debug('Extension options validated successfully');
      } catch (error) {
        const e = error as Error;
        debug('Invalid extension options:', e);
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

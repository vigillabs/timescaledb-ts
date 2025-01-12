import { CreateHypertableOptions } from '@timescaledb/schemas';
import { Hypertable } from './hypertable';

export const name = '@timescaledb/core';

export class TimescaleDB {
  public static Hypertable: Hypertable;

  public static createHypertable(tableName: string, options: CreateHypertableOptions): Hypertable {
    const hypertable = new Hypertable(tableName, options);

    return hypertable;
  }
}

export * from './errors';

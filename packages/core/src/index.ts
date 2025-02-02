import {
  CandlestickAggregateOptions,
  CreateContinuousAggregateOptions,
  CreateExtensionOptions,
  CreateHypertableOptions,
} from '@timescaledb/schemas';
import { Hypertable } from './hypertable';
import { Extension } from './extension';
import { ContinuousAggregate } from './continuous-aggregate';
import { CandlestickAggregateBuilder } from './candlestick';

export const name = '@timescaledb/core';

export class TimescaleDB {
  public static Hypertable: Hypertable;

  public static createHypertable(tableName: string, options: CreateHypertableOptions): Hypertable {
    const hypertable = new Hypertable(tableName, options);

    return hypertable;
  }

  public static createExtension(options?: CreateExtensionOptions): Extension {
    const extension = new Extension(options);

    return extension;
  }

  public static createContinuousAggregate(
    name: string,
    source: string,
    options: Omit<CreateContinuousAggregateOptions, 'name'>,
  ): ContinuousAggregate {
    return new ContinuousAggregate(name, source, { ...options, name });
  }

  public static createCandlestickAggregate(
    tableName: string,
    options: CandlestickAggregateOptions,
  ): CandlestickAggregateBuilder {
    return new CandlestickAggregateBuilder(tableName, options);
  }
}

export * from './errors';

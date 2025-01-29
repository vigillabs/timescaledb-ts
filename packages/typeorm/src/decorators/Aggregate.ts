import { ViewColumn } from 'typeorm';
import { AggregateType } from '@timescaledb/schemas';

export const AGGREGATE_METADATA_KEY = Symbol('timescale:aggregate-field');

export interface AggregateOptions {
  type: AggregateType;
  column?: string;
}

export function Aggregate(options: AggregateOptions): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    ViewColumn()(target, propertyKey);

    const aggregates = Reflect.getMetadata(AGGREGATE_METADATA_KEY, target.constructor) || {};
    aggregates[propertyKey] = {
      type: options.type,
      column: options.column,
      column_alias: propertyKey,
    };
    Reflect.defineMetadata(AGGREGATE_METADATA_KEY, aggregates, target.constructor);
  };
}

/// <reference types="reflect-metadata" />
import { ViewColumn } from 'typeorm';
import { AggregateColumnOptions } from '@vigillabs/timescale-db/schemas';

export const AGGREGATE_COLUMN_METADATA_KEY = Symbol('timescale:aggregate-field');

export function AggregateColumn(options: AggregateColumnOptions) {
  return function (target: any, propertyKey: string | symbol) {
    const aggregates = Reflect.getMetadata(AGGREGATE_COLUMN_METADATA_KEY, target) || {};

    aggregates[propertyKey] = {
      type: options.type,
      column: options.column,
      column_alias: propertyKey,
    };

    Reflect.defineMetadata(AGGREGATE_COLUMN_METADATA_KEY, aggregates, target);
    Reflect.defineMetadata(AGGREGATE_COLUMN_METADATA_KEY, aggregates, target.constructor);

    ViewColumn({
      name: propertyKey.toString(),
      transformer: {
        from: (value: string) => Number(value),
        to: (value: number) => value,
      },
    })(target, propertyKey);

    const storageKey = `_${propertyKey.toString()}`;
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return this[storageKey];
      },
      set: function (value) {
        this[storageKey] = value;
      },
      enumerable: false,
      configurable: true,
    });

    return target;
  };
}

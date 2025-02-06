/// <reference types="reflect-metadata" />
import { Column } from 'typeorm';
import { AggregateColumnOptions } from '@timescaledb/schemas';

export const ROLLUP_COLUMN_METADATA_KEY = Symbol('timescale:rollup-field');

export interface RollupColumnOptions extends AggregateColumnOptions {
  source_column: string;
  rollup_fn?: 'rollup' | 'mean' | 'percentile_agg';
  accessor_fn?: string;
}

export function RollupColumn(options: RollupColumnOptions) {
  return function (target: any, propertyKey: string | symbol) {
    const rollupColumns = Reflect.getMetadata(ROLLUP_COLUMN_METADATA_KEY, target.constructor) || {};
    rollupColumns[propertyKey] = {
      ...options,
      propertyKey,
    };
    Reflect.defineMetadata(ROLLUP_COLUMN_METADATA_KEY, rollupColumns, target.constructor);

    Column('raw')(target, propertyKey);

    const storageKey = `_${String(propertyKey)}`;
    Object.defineProperty(target, propertyKey, {
      get: function () {
        const value = this[storageKey];
        if (options.accessor_fn && value) {
          return `${options.accessor_fn}(${value})`;
        }
        return value;
      },
      set: function (value) {
        this[storageKey] = value;
      },
      enumerable: true,
      configurable: true,
    });

    return target;
  };
}

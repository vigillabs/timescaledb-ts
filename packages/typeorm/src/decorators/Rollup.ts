/// <reference types="reflect-metadata" />
import { getMetadataArgsStorage, ViewEntity } from 'typeorm';
import { CreateContinuousAggregateOptions, RollupConfig } from '@timescaledb/schemas';
import { validateBucketColumn } from './BucketColumn';
import { ROLLUP_COLUMN_METADATA_KEY } from './RollupColumn';

export const ROLLUP_METADATA_KEY = Symbol('timescale:rollup');

export interface RollupOptions extends Omit<CreateContinuousAggregateOptions, 'time_column'> {
  bucket_interval: string;
  materialized_only?: boolean;
}

export function Rollup<T extends { new (...args: any[]): any }>(sourceModel: Function, options: RollupOptions) {
  return function (target: T): T {
    const bucketMetadata = validateBucketColumn(target);

    const sourceMetadata = getMetadataArgsStorage().tables.find((table) => table.target === sourceModel);
    if (!sourceMetadata) {
      throw new Error('Source model is not a TypeORM entity');
    }

    const rollupColumns = Reflect.getMetadata(ROLLUP_COLUMN_METADATA_KEY, target) || {};

    const rollupConfig: RollupConfig = {
      continuousAggregateOptions: {
        ...options,
        name: options.name,
        time_column: bucketMetadata.source_column,
      },
      rollupOptions: {
        sourceView: sourceMetadata.name!,
        bucketInterval: options.bucket_interval,
        name: options.name,
        materializedOnly: options.materialized_only || false,
        rollupRules: Object.values(rollupColumns).map((column: any) => ({
          rollupFn: column.rollup_fn || 'rollup',
          aggregateType: column.type,
          sourceColumn: column.source_column,
          targetColumn: column.propertyKey.toString(),
        })),
      },
    };

    Reflect.defineMetadata(ROLLUP_METADATA_KEY, rollupConfig, target);

    return ViewEntity({
      name: options.name,
      materialized: true,
      synchronize: false,
    })(target) as T;
  };
}

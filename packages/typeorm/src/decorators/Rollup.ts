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

export interface RollupMetadata {
  sourceModel: Function;
  options: CreateContinuousAggregateOptions;
  rollupConfig: RollupConfig;
  sourceBucketColumn: string;
  targetBucketColumn: string;
}

export function Rollup<T extends { new (...args: any[]): any }>(sourceModel: Function, options: RollupOptions) {
  return function (target: T): T {
    const targetBucketMetadata = validateBucketColumn(target);

    const sourceBucketMetadata = validateBucketColumn(sourceModel);

    const sourceMetadata = getMetadataArgsStorage().tables.find((table) => table.target === sourceModel);
    if (!sourceMetadata) {
      throw new Error('Source model is not a TypeORM entity');
    }

    const rollupColumns = Reflect.getMetadata(ROLLUP_COLUMN_METADATA_KEY, target) || {};

    const rollupConfig: RollupConfig = {
      // @ts-ignore
      continuousAggregateOptions: {
        ...options,
        name: options.name,
        time_column: sourceBucketMetadata.source_column,
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
        bucketColumn: {
          source: sourceBucketMetadata.propertyKey.toString(),
          target: targetBucketMetadata.propertyKey.toString(),
        },
      },
    };

    const metadata: RollupMetadata = {
      sourceModel,
      options,
      rollupConfig,
      sourceBucketColumn: sourceBucketMetadata.propertyKey.toString(),
      targetBucketColumn: targetBucketMetadata.propertyKey.toString(),
    };

    Reflect.defineMetadata(ROLLUP_METADATA_KEY, metadata, target);

    return ViewEntity({
      name: options.name,
      materialized: true,
      synchronize: false,
    })(target) as T;
  };
}

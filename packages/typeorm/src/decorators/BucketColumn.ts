/// <reference types="reflect-metadata" />
import { ViewColumn } from 'typeorm';

export const BUCKET_COLUMN_METADATA_KEY = Symbol('timescale:bucket-column');

export interface BucketColumnOptions {
  source_column: string;
}

export function BucketColumn(options: BucketColumnOptions) {
  return function (target: any, propertyKey: string | symbol) {
    const existingBucketColumn = Reflect.getMetadata(BUCKET_COLUMN_METADATA_KEY, target.constructor);

    if (existingBucketColumn) {
      throw new Error('Only one @BucketColumn is allowed per continuous aggregate');
    }

    Reflect.defineMetadata(
      BUCKET_COLUMN_METADATA_KEY,
      {
        propertyKey,
        source_column: options.source_column,
      },
      target.constructor,
    );

    ViewColumn()(target, propertyKey);

    const storageKey = `_${String(propertyKey)}`;
    Object.defineProperty(target, propertyKey, {
      get: function () {
        return this[storageKey];
      },
      set: function (value) {
        this[storageKey] = value;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

export function validateBucketColumn(target: Function): { propertyKey: string | symbol; source_column: string } {
  const metadata = Reflect.getMetadata(BUCKET_COLUMN_METADATA_KEY, target);

  if (!metadata) {
    throw new Error('Continuous aggregates must have exactly one column decorated with @BucketColumn');
  }

  return metadata;
}

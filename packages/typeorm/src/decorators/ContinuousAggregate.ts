import { CreateContinuousAggregateOptions } from '@timescaledb/schemas';
import { getMetadataArgsStorage, ViewEntity } from 'typeorm';
import { AGGREGATE_COLUMN_METADATA_KEY } from './AggregateColumn';

export const CONTINUOUS_AGGREGATE_METADATA_KEY = Symbol('timescale:continuous_aggregate');

export interface ContinuousAggregateMetadata {
  sourceModel: Function;
  options: CreateContinuousAggregateOptions;
}

export function ContinuousAggregate<T extends { new (...args: any[]): any }>(
  sourceModel: Function,
  options: CreateContinuousAggregateOptions,
) {
  return function (target: T): T {
    Reflect.defineMetadata(CONTINUOUS_AGGREGATE_METADATA_KEY, { sourceModel, options }, target);
    Reflect.defineMetadata(AGGREGATE_COLUMN_METADATA_KEY, sourceModel, target);

    const sourceMetadata = getMetadataArgsStorage().tables.find((table) => table.target === sourceModel);
    if (!sourceMetadata) {
      throw new Error('Source model is not a TypeORM entity');
    }

    target.prototype.toJSON = function () {
      const jsonObj: { [key: string]: any } = {};
      for (const key in this) {
        if (key.startsWith('_')) {
          jsonObj[key.substring(1)] = this[key];
        } else {
          jsonObj[key] = this[key];
        }
      }
      return jsonObj;
    };

    const decoratedClass = ViewEntity({
      name: options.name,
      materialized: true,
      synchronize: false,
    })(target);

    return decoratedClass as T;
  };
}

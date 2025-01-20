/// <reference types="reflect-metadata" />
import { CreateHypertableOptions } from '@timescaledb/schemas';
import { timescaleMethods } from '../repository/TimescaleRepository';

export const HYPERTABLE_METADATA_KEY = Symbol('timescale:hypertable');

export function Hypertable(options: CreateHypertableOptions) {
  return function (target: Function) {
    Reflect.defineMetadata(HYPERTABLE_METADATA_KEY, options, target);

    Reflect.defineMetadata('typeorm:repository:extend', timescaleMethods, target);
  };
}

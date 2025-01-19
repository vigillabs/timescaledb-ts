/// <reference types="reflect-metadata" />
import { CreateHypertableOptions } from '@timescaledb/schemas';

export const HYPERTABLE_METADATA_KEY = Symbol('timescale:hypertable');

export function Hypertable(options: CreateHypertableOptions) {
  return function (target: Function) {
    Reflect.defineMetadata(HYPERTABLE_METADATA_KEY, options, target);
  };
}

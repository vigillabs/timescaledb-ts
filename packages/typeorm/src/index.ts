import './hooks/migration';

export { Hypertable, HYPERTABLE_METADATA_KEY } from './decorators/Hypertable';
export { ContinuousAggregate, CONTINUOUS_AGGREGATE_METADATA_KEY } from './decorators/ContinuousAggregate';

export * from './repository/TimescaleRepository';

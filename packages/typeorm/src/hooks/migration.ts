import { DataSource, getMetadataArgsStorage } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { timescaleMethods } from '../repository/TimescaleRepository';
import { CONTINUOUS_AGGREGATE_METADATA_KEY, ContinuousAggregateMetadata } from '../decorators/ContinuousAggregate';
import { AGGREGATE_COLUMN_METADATA_KEY } from '../decorators/AggregateColumn';
import { AggregateColumnOptions } from '@timescaledb/schemas';

const originalRunMigrations = DataSource.prototype.runMigrations;
const originalUndoLastMigration = DataSource.prototype.undoLastMigration;
const originalSynchronize = DataSource.prototype.synchronize;
const originalInitialize = DataSource.prototype.initialize;

DataSource.prototype.initialize = async function () {
  const connection = await originalInitialize.call(this);

  for (const entity of this.entityMetadatas) {
    const hypertableOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, entity.target);
    const aggregateOptions = Reflect.getMetadata(CONTINUOUS_AGGREGATE_METADATA_KEY, entity.target);

    if (hypertableOptions || aggregateOptions) {
      const repository = this.getRepository(entity.target);
      Object.assign(repository, timescaleMethods);
    }
  }

  return connection;
};

async function setupTimescaleExtension(dataSource: DataSource) {
  try {
    const extension = TimescaleDB.createExtension();
    await dataSource.query(extension.up().build());
  } catch (error) {
    if (!(error as Error).message.includes('extension "timescaledb" already exists')) {
      throw error;
    }
  }
}

DataSource.prototype.runMigrations = async function (options?: { transaction?: 'all' | 'none' | 'each' }) {
  const migrations = await originalRunMigrations.call(this, options);

  await setupTimescaleExtension(this);
  await setupHypertables(this);
  await setupContinuousAggregates(this);

  return migrations;
};

DataSource.prototype.undoLastMigration = async function (options?: { transaction?: 'all' | 'none' | 'each' }) {
  await removeTimescaleObjects(this);
  return originalUndoLastMigration.call(this, options);
};

DataSource.prototype.synchronize = async function (dropBeforeSync: boolean = false) {
  if (dropBeforeSync) {
    await removeTimescaleObjects(this);
  }

  await originalSynchronize.call(this, dropBeforeSync);
  await setupTimescaleObjects(this);
};

async function setupHypertables(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, entity.target);

    if (options) {
      const hypertable = TimescaleDB.createHypertable(entity.tableName, options);
      const hypertableCheck = await dataSource.query(hypertable.inspect().build());

      if (!hypertableCheck[0].table_exists) {
        continue;
      }

      if (hypertableCheck[0].is_hypertable) {
        continue;
      }

      await dataSource.query(hypertable.up().build());

      const repository = dataSource.getRepository(entity.target);
      Object.assign(repository, timescaleMethods);
    }
  }
}

async function removeHypertables(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, entity.target);

    if (options) {
      const hypertable = TimescaleDB.createHypertable(entity.tableName, options);
      const hypertableCheck = await dataSource.query(hypertable.inspect().build());

      if (!hypertableCheck[0].is_hypertable) {
        continue;
      }

      await dataSource.query(hypertable.down().build());
    }
  }
}

async function setupTimescaleObjects(dataSource: DataSource) {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource must be initialized before setting up TimescaleDB objects');
  }

  const extension = TimescaleDB.createExtension();
  const extensionSql = extension.up().build();

  try {
    await dataSource.query(extensionSql);
  } catch (error) {
    if (!(error as Error).message.includes('extension "timescaledb" already exists')) {
      throw error;
    }
  }

  await setupHypertables(dataSource);
}

async function removeContinuousAggregates(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const aggregateMetadata = Reflect.getMetadata(
      CONTINUOUS_AGGREGATE_METADATA_KEY,
      entity.target,
    ) as ContinuousAggregateMetadata;

    if (!aggregateMetadata) continue;

    const aggregate = TimescaleDB.createContinuousAggregate(
      entity.tableName,
      '', // Source table not needed for down()
      aggregateMetadata.options,
    );

    const statements = aggregate.down().build();
    for (const sql of statements) {
      await dataSource.query(sql);
    }
  }
}

async function removeTimescaleObjects(dataSource: DataSource) {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource must be initialized before removing TimescaleDB objects');
  }

  await removeContinuousAggregates(dataSource);
  await removeHypertables(dataSource);
}

async function validateAggregateColumns(dataSource: DataSource) {
  for (const entity of dataSource.entityMetadatas) {
    // Try both the prototype and constructor
    const aggregateColumns =
      // @ts-ignore
      Reflect.getMetadata(AGGREGATE_COLUMN_METADATA_KEY, entity.target.prototype) ||
      Reflect.getMetadata(AGGREGATE_COLUMN_METADATA_KEY, entity.target);

    if (aggregateColumns) {
      const continuousAggregateMetadata = Reflect.getMetadata(CONTINUOUS_AGGREGATE_METADATA_KEY, entity.target);
      if (!continuousAggregateMetadata) {
        throw new Error(`Class ${entity.name} uses @AggregateColumn but is not decorated with @ContinuousAggregate`);
      }

      const { sourceModel } = continuousAggregateMetadata;
      const sourceMetadata = getMetadataArgsStorage().tables.find((table) => table.target === sourceModel);
      if (!sourceMetadata) {
        throw new Error(`Source model for ${entity.name} is not a valid TypeORM entity`);
      }
    }
  }
}

async function setupContinuousAggregates(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;

  for (const entity of entities) {
    const aggregateMetadata = Reflect.getMetadata(
      CONTINUOUS_AGGREGATE_METADATA_KEY,
      entity.target,
    ) as ContinuousAggregateMetadata;

    if (!aggregateMetadata) continue;

    const sourceMetadata = dataSource.getMetadata(aggregateMetadata.sourceModel);
    const sourceTableName = sourceMetadata.tableName;

    const sourceOptions = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, aggregateMetadata.sourceModel);
    const sourceHypertable = TimescaleDB.createHypertable(sourceTableName, sourceOptions);

    const hypertableCheck = await dataSource.query(sourceHypertable.inspect().build());
    if (!hypertableCheck[0].is_hypertable) continue;

    await validateAggregateColumns(dataSource);

    // Try both the prototype and constructor for aggregate columns
    const aggregateColumns =
      // @ts-ignore
      Reflect.getMetadata(AGGREGATE_COLUMN_METADATA_KEY, entity.target.prototype) ||
      (Reflect.getMetadata(AGGREGATE_COLUMN_METADATA_KEY, entity.target) as Record<
        string,
        AggregateColumnOptions
      > as Record<string, AggregateColumnOptions>);

    if (!aggregateColumns) {
      throw new Error('No aggregates defined for continuous aggregate');
    }

    aggregateMetadata.options.aggregates = {
      ...aggregateMetadata.options.aggregates,
      ...Object.entries(aggregateColumns as Record<string, AggregateColumnOptions>).reduce(
        (acc: { [key: string]: AggregateColumnOptions }, [key, value]: [string, AggregateColumnOptions]) => {
          acc[key] = {
            type: value.type,
            column: value.column,
            column_alias: value.column_alias,
          };
          return acc;
        },
        {},
      ),
    };

    const aggregate = TimescaleDB.createContinuousAggregate(
      entity.tableName,
      sourceTableName,
      aggregateMetadata.options,
    );

    const exists = await dataSource.query(aggregate.inspect().build());
    if (!exists[0].hypertable_exists) {
      await dataSource.query(aggregate.up().build());

      const refreshPolicy = aggregate.up().getRefreshPolicy();
      if (refreshPolicy) {
        await dataSource.query(refreshPolicy);
      }
    }
  }
}

import { DataSource } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';
import { timescaleMethods } from '../repository/TimescaleRepository';

const originalRunMigrations = DataSource.prototype.runMigrations;
const originalUndoLastMigration = DataSource.prototype.undoLastMigration;
const originalSynchronize = DataSource.prototype.synchronize;
const originalInitialize = DataSource.prototype.initialize;

DataSource.prototype.initialize = async function () {
  const connection = await originalInitialize.call(this);

  for (const entity of this.entityMetadatas) {
    const options = Reflect.getMetadata(HYPERTABLE_METADATA_KEY, entity.target);
    if (options) {
      const repository = this.getRepository(entity.target);
      Object.assign(repository, timescaleMethods);
    }
  }

  return connection;
};

DataSource.prototype.runMigrations = async function (options?: {
  transaction?: 'all' | 'none' | 'each';
  fake?: boolean;
}) {
  const migrations = await originalRunMigrations.call(this, options);
  await setupHypertables(this);
  return migrations;
};

DataSource.prototype.undoLastMigration = async function (options?: { transaction?: 'all' | 'none' | 'each' }) {
  await removeHypertables(this);
  return originalUndoLastMigration.call(this, options);
};

DataSource.prototype.synchronize = async function (dropBeforeSync: boolean = false) {
  if (dropBeforeSync) {
    await removeHypertables(this);
  }

  await originalSynchronize.call(this, dropBeforeSync);
  await setupHypertables(this);
};

async function setupHypertables(dataSource: DataSource) {
  if (!dataSource.isInitialized) {
    throw new Error('DataSource must be initialized before setting up hypertables');
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
  if (!dataSource.isInitialized) {
    throw new Error('DataSource must be initialized before removing hypertables');
  }

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

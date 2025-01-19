import { DataSource } from 'typeorm';
import { TimescaleDB } from '@timescaledb/core';
import { HYPERTABLE_METADATA_KEY } from '../decorators/Hypertable';

const originalRunMigrations = DataSource.prototype.runMigrations;
const originalUndoLastMigration = DataSource.prototype.undoLastMigration;
const originalSynchronize = DataSource.prototype.synchronize;

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
      const tableExists = await dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [entity.tableName],
      );

      if (!tableExists[0].exists) continue;

      const isHypertable = await dataSource.query(
        `SELECT EXISTS (
          SELECT FROM timescaledb_information.hypertables
          WHERE hypertable_name = $1
        )`,
        [entity.tableName],
      );

      if (isHypertable[0].exists) continue;

      const hypertable = TimescaleDB.createHypertable(entity.tableName, options);
      const sql = hypertable.up().build();

      try {
        await dataSource.query(sql);
      } catch (error) {
        if (!(error as Error).message.includes('already a hypertable')) {
          throw error;
        }
      }
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
      const isHypertable = await dataSource.query(
        `SELECT EXISTS (
          SELECT FROM timescaledb_information.hypertables
          WHERE hypertable_name = $1
        )`,
        [entity.tableName],
      );

      if (!isHypertable[0].exists) continue;

      const hypertable = TimescaleDB.createHypertable(entity.tableName, options);
      const sql = hypertable.down().build();

      try {
        await dataSource.query(sql);
      } catch (error) {
        if (!(error as Error).message.includes('does not exist')) {
          throw error;
        }
      }
    }
  }
}

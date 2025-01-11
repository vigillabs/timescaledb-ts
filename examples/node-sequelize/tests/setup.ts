import { beforeAll, afterAll } from '@jest/globals';
import dotenv from 'dotenv';
import sequelize from '../src/database';

dotenv.config({ path: '.env' });

process.env.NODE_ENV = 'test';
process.env.PORT = '4000';

beforeAll(async () => {
  try {
    await sequelize.authenticate();

    const [results] = await sequelize.query("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'timescaledb')");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasTimescaleDB = (results[0] as unknown as any).exists;
    if (!hasTimescaleDB) {
      throw new Error('TimescaleDB extension is not enabled in the database');
    }
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  await sequelize.close();
});

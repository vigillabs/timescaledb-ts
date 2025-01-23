import '@timescaledb/typeorm';
import { DataSource } from 'typeorm';
import { PageLoad } from './models/PageLoad';

import dotenv from 'dotenv';
import { HourlyPageViews } from './models/HourlyPageViews';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [PageLoad, HourlyPageViews],
  migrations: ['migrations/*.ts'],
});

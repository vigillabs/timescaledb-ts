# @timescaledb/typeorm

This is the offical TimescaleDB plugin for TypeORM.

## Installation

```bash
npm install typeorm @timescaledb/typeorm
```

## Usage

```typescript
import { Entity, PrimaryColumn } from 'typeorm';
import { Hypertable } from '@timescaledb/typeorm';

@Entity('page_loads')
@Hypertable({
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'user_agent',
    policy: {
      schedule_interval: '7 days',
    },
  },
})
export class PageLoad {
  @PrimaryColumn({ name: 'user_agent', type: 'varchar' })
  userAgent!: string;

  @PrimaryColumn({ type: 'timestamp' })
  time!: Date;
}
```

## Migration

To hook into the TypeORM migration process, import the library at the top of your `data-source` file:

```typescript
import '@timescaledb/typeorm'; // This should be the first import in your file

import { DataSource } from 'typeorm';
import { PageLoad } from './models/PageLoad';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [PageLoad],
  migrations: ['migrations/*.ts'],
});
```

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

## Migrations

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

Then run your normal TypeORM migration commands:

```bash
typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

The `@timescaledb/typeorm` library will automatically create the necessary hypertables and other TimescaleDB-specific objects in the database.

If you wish to have more controll over the migration process, then please reffer to the `@timescaledb/core` library and how its used in this integration.

## Methods

The `@timescaledb/typeorm` library wraps the TypeORM migration tooling and each model specified with the `@Hypertable` decorator. Given this wrapping you have following additional methods are available:

### `getTimeBucket`

This method will allow you to perform a generic time bucketing query on the hypertable.

See:

- https://docs.timescale.com/api/latest/hyperfunctions/time_bucket/

Usage:

```typescript
import { AppDataSource } from './data-source';
import { PageLoad } from './models/PageLoad';

const repository = AppDataSource.getRepository(PageLoad);
const stats = await repository.getTimeBucket({
  timeRange: {
    start,
    end,
  },
  bucket: {
    interval: '1 hour',
    metrics: [
      { type: 'count', alias: 'count' },
      { type: 'distinct_count', column: 'user_agent', alias: 'unique_users' },
    ],
  },
});

console.log(stats);
// [
//   { time: '2021-01-01T00:00:00.000Z', count: 10, unique_users: 5 },
//   { time: '2021-01-01T01:00:00.000Z', count: 20, unique_users: 10 },
//   { time: '2021-01-01T02:00:00.000Z', count: 30, unique_users: 15 },
//   ...
// ]
```

### `getCompressionStats`

This method will allow you to get the compression statistics for the hypertable.

See:

- https://docs.timescale.com/api/latest/compression/hypertable_compression_stats/

Usage:

```typescript
import { AppDataSource } from './data-source';
import { PageLoad } from './models/PageLoad';

const repository = AppDataSource.getRepository(PageLoad);
const stats = await repository.getCompressionStats();

console.log(stats);
// {
//   total_chunks: 100,
//   compressed_chunks: 50,
//   number_compressed_chunks: 10,
// }
```

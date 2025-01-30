# @timescaledb/typeorm

This is the official TimescaleDB plugin for TypeORM.

## Installation

```bash
npm install typeorm @timescaledb/typeorm
```

## Hypertables

### Creating a Hypertable

Use the `@Hypertable` decorator to define your time-series tables:

See:

- https://docs.timescale.com/use-timescale/latest/hypertables/create/

Usage:

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

## Hypertable Methods

### `getTimeBucket`

This method allows you to perform time bucketing queries on the hypertable:

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

Get compression statistics for a hypertable:

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

## Continuous Aggregates

### Creating a Continuous Aggregate

Use the `@ContinuousAggregate` decorator to define materialized views that automatically maintain aggregates over time windows, plus the `@AggregateColumn` decorator to define the columns in the materialized view:

See:

- https://docs.timescale.com/use-timescale/latest/continuous-aggregates/create-a-continuous-aggregate/

Usage:

```ts
import { ViewColumn } from 'typeorm';
import { ContinuousAggregate, AggregateColumn, BucketColumn } from '@timescaledb/typeorm';
import { PageLoad } from './PageLoad';

@ContinuousAggregate(PageLoad, {
  name: 'hourly_page_views',
  bucket_interval: '1 hour',
  refresh_policy: {
    start_offset: '3 days',
    end_offset: '1 hour',
    schedule_interval: '1 hour',
  },
})
export class HourlyPageViews {
  @BucketColumn({
    source_column: 'time',
  })
  bucket!: Date;

  @AggregateColumn({
    type: 'count',
  })
  total_views!: number;

  @AggregateColumn({
    type: 'unique_count',
    column: 'user_agent',
  })
  unique_users!: number;
}
```

### Using Continuous Aggregates

Query the materialized view like a regular entity:

See:

- https://orkhan.gitbook.io/typeorm/docs/view-entities

Usage:

```ts
const hourlyStats = await AppDataSource.getRepository(HourlyPageViews)
  .createQueryBuilder()
  .where('bucket >= :start', { start })
  .andWhere('bucket <= :end', { end })
  .orderBy('bucket', 'DESC')
  .getMany();
```

## Migrations

To hook into the TypeORM migration process, import the library at the top of your `data-source` file:

```typescript
import '@timescaledb/typeorm'; // This should be the first import in your file

import { DataSource } from 'typeorm';
import { PageLoad, HourlyPageViews } from './models';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [PageLoad, HourlyPageViews],
  migrations: ['migrations/*.ts'],
});
```

Then run your normal TypeORM migration commands:

```bash
typeorm-ts-node-commonjs migration:run -d src/data-source.ts
```

The `@timescaledb/typeorm` library will automatically create the necessary hypertables and other TimescaleDB-specific objects in the database.

If you wish to have more control over the migration process, then please reffer to the `@timescaledb/core` library and how its used in this integration.

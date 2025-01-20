# timescaledb-ts

Welcome to the [Timescale](https://www.timescale.com/) Typescript library. This library is a collection of packages that help you work with TimescaleDB in a Typescript environment.

If you are looking to setup this project locally, you can follow the instructions in the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Packages

- [@timescaledb/typeorm](./packages/typeorm/README.md) - Official TimescaleDB integration for TypeORM.
- [@timescaledb/core](./packages/core/README.md) - Migration and query helpers
- [@timescaledb/schemas](./packages/schemas/README.md) - TimescaleDB object schemas
- [@timescaledb/utils](./packages/utils/README.md) - utilities and helpers

## Examples

- [Node Sequelize Example](./examples/node-sequelize/README.md) - Using TimescaleDB with Node.js and [Sequelize](https://sequelize.org/)
- [Node TypeORM Example](./examples/node-typeorm/README.md) - Using TimescaleDB with Node.js and [TypeORM](https://typeorm.io/)

## Getting Started

- TypeORM: [README](./packages/typeorm/README.md)

To get started with TypeORM simply install the package:

```bash
npm install typeorn @timescaledb/typeorm
```

Then you can use the `@Hypertable` decorator to define your hypertables:

```diff
import { Entity, PrimaryColumn } from 'typeorm';
+ import { Hypertable } from '@timescaledb/typeorm';

+ @Hypertable()
@Entity()
export class PageLoad {
  @PrimaryColumn({ name: 'user_agent', type: 'varchar' })
  userAgent!: string;

  @PrimaryColumn({ type: 'timestamp' })
  time!: Date;
}
```

Then you can query a Hypertable using the attached methods:

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
    metrics: [{ type: 'distinct_count', column: 'user_agent', alias: 'unique_users' }],
  },
});

console.log(stats);
// [
//   { time: '2021-01-01T00:00:00.000Z', unique_users: 5 },
//   { time: '2021-01-01T01:00:00.000Z', unique_users: 10 },
//   { time: '2021-01-01T02:00:00.000Z', unique_users: 15 },
//   ...
// ]
```

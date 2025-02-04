# @timescaledb/core

The `@timescaledb/core` package provides fundamental building blocks for working with TimescaleDB in TypeScript/JavaScript applications. It includes SQL query builders and utilities for managing hypertables, continuous aggregates, compression, and other TimescaleDB-specific features.

## Installation

```bash
npm install @timescaledb/core
```

## Quick Start

```typescript
import { TimescaleDB } from '@timescaledb/core';

// Create a hypertable
const hypertable = TimescaleDB.createHypertable('measurements', {
  by_range: { column_name: 'time' },
});

// Generate SQL to create the hypertable
const sql = hypertable.up().build();
// SELECT create_hypertable('measurements', by_range('time'));
```

## API Reference

### TimescaleDB Class

The main entry point for all functionality.

#### Creating a Hypertable

```typescript
const hypertable = TimescaleDB.createHypertable('table_name', {
  by_range: {
    column_name: 'time',
  },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'device_id',
    policy: {
      schedule_interval: '7 days',
    },
  },
});

// Generate creation SQL
const createSql = hypertable.up().build();

// Generate drop SQL
const dropSql = hypertable.down().build();

// Check if hypertable exists
const checkSql = hypertable.inspect().build();
```

#### Creating a Continuous Aggregate

```typescript
const aggregate = TimescaleDB.createContinuousAggregate('daily_summary', 'raw_data', {
  bucket_interval: '1 day',
  time_column: 'time',
  aggregates: {
    avg_temp: {
      type: 'avg',
      column: 'temperature',
      column_alias: 'average_temperature',
    },
    max_temp: {
      type: 'max',
      column: 'temperature',
      column_alias: 'max_temperature',
    },
  },
  refresh_policy: {
    start_offset: '3 days',
    end_offset: '1 hour',
    schedule_interval: '1 hour',
  },
});

// Generate creation SQL
const createSql = aggregate.up().build();

// Generate drop SQL
const dropSql = aggregate.down().build();
```

#### Managing Compression

```typescript
const hypertable = TimescaleDB.createHypertable('measurements', {
  by_range: { column_name: 'time' },
  compression: {
    compress: true,
    compress_orderby: 'time',
    compress_segmentby: 'device_id',
  },
});

// Get compression statistics
const statsSql = hypertable
  .compression()
  .stats({
    select: {
      total_chunks: true,
      compressed_chunks: true,
    },
  })
  .build();
```

#### Time Bucket Queries

```typescript
const hypertable = TimescaleDB.createHypertable('measurements', {
  by_range: { column_name: 'time' },
});

// Basic time bucket query
const { sql, params } = hypertable
  .timeBucket({
    interval: '1 hour',
    metrics: [
      { type: 'count', alias: 'total' },
      { type: 'distinct_count', column: 'device_id', alias: 'unique_devices' },
    ],
  })
  .build({
    range: {
      start: new Date('2025-01-01'),
      end: new Date('2025-02-01'),
    },
  });

// With where clause filtering
const { sql: filteredSql, params: filteredParams } = hypertable
  .timeBucket({
    interval: '1 hour',
    metrics: [
      { type: 'count', alias: 'total' },
      { type: 'distinct_count', column: 'device_id', alias: 'unique_devices' },
    ],
  })
  .build({
    range: {
      start: new Date('2025-01-01'),
      end: new Date('2025-02-01'),
    },
    where: {
      device_id: 'sensor-123', // Simple equality
      temperature: { '>': 25 }, // Comparison operator
      status: { IN: ['active', 'warning'] }, // IN clause
      location: { 'NOT IN': ['zone-a', 'zone-b'] }, // NOT IN clause
    },
  });
```

#### Creating Candlestick Aggregates

```typescript
const candlestick = TimescaleDB.createCandlestickAggregate('stock_prices', {
  time_column: 'timestamp',
  price_column: 'price',
  volume_column: 'volume', // optional
  bucket_interval: '1 hour', // defaults to '1 hour'
});

// Basic candlestick query
const { sql, params } = candlestick.build({
  range: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-02'),
  },
});

// With where clause filtering
const { sql: filteredSql, params: filteredParams } = candlestick.build({
  range: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-02'),
  },
  where: {
    symbol: 'AAPL',
    volume: { '>': 1000000 },
    exchange: { IN: ['NYSE', 'NASDAQ'] },
  },
});

// Returns candlestick data:
// bucket_time, open, high, low, close, volume, vwap, etc.
const results = await query(sql, params);
```

## Examples

Check out our example projects:

- [Node.js + TypeORM Example](https://github.com/timescale/timescaledb-ts/tree/main/examples/node-typeorm)
- [Node.js + Sequelize Example](https://github.com/timescale/timescaledb-ts/tree/main/examples/node-sequelize)

## Advanced Usage

### Custom SQL Generation

All builders support granular SQL generation:

```typescript
const hypertable = TimescaleDB.createHypertable('measurements', {
  by_range: { column_name: 'time' },
});

// Generate only the hypertable creation SQL
const createSql = hypertable.up().build();

// Generate only the compression SQL
const compressionSql = hypertable
  .compression()
  .stats({ select: { total_chunks: true } })
  .build();
```

### Migration Integration

The package works well with migration systems:

```typescript
// In a migration file
import { TimescaleDB } from '@timescaledb/core';

export async function up(queryRunner) {
  // Create extension
  const extension = TimescaleDB.createExtension();
  await queryRunner.query(extension.up().build());

  // Create hypertable
  const hypertable = TimescaleDB.createHypertable('measurements', {
    by_range: { column_name: 'time' },
  });
  await queryRunner.query(hypertable.up().build());
}

export async function down(queryRunner) {
  // Drop hypertable
  const hypertable = TimescaleDB.createHypertable('measurements', {
    by_range: { column_name: 'time' },
  });
  await queryRunner.query(hypertable.down().build());

  // Drop extension
  const extension = TimescaleDB.createExtension();
  await queryRunner.query(extension.down().build());
}
```

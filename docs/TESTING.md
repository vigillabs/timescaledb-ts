# Testing Guide for TimescaleDB TypeScript

This guide explains how to run and understand the test suite for the TimescaleDB TypeScript packages.

## Test Structure

The repository contains two types of tests:

1. Builder tests (SQL generation snapshots)
2. Integration tests (actual database operations)

## Local Testing Setup

### Database Requirements

Before running tests, you need a TimescaleDB instance. Start one using Docker:

```bash
docker run -d \
  --name timescaledb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  timescale/timescaledb-ha:pg17
```

### Running Tests

From the root directory:

```bash
pnpm test
```

⚠️ **Important Note**: When running locally, you might see a warning that only one example project executes at a time. This is expected behavior as the examples share the same database port. The CI pipeline runs them in parallel with separate databases.

### Example Project Setup

To run the example projects (which act as integration tests), you need to:

1. Copy the environment file:

   ```bash
   cd examples/node-typeorm
   cp .env.example .env
   ```

2. Run migrations:

   ```bash
   pnpm migrate
   ```

3. Then run tests:
   ```bash
   pnpm test
   ```

## SQL Builder Snapshots

The core package uses Jest snapshots to test SQL generation. These tests ensure that builders generate the correct SQL without requiring a database:

```typescript
describe('Hypertable', () => {
  it('should generate hypertable creation SQL', () => {
    const hypertable = TimescaleDB.createHypertable('metrics', {
      by_range: { column_name: 'time' },
    });

    const sql = hypertable.up().build();
    expect(sql).toMatchSnapshot();
  });
});
```

The snapshots are stored in `packages/core/tests/__snapshots__/` and should be reviewed when making changes to the builders.

To update snapshots:

```bash
pnpm test -u
```

## CI Pipeline Testing

The GitHub Actions workflow (`.github/workflows/test.yml`) runs all tests in a controlled environment:

1. Spins up separate TimescaleDB instances for each example
2. Runs migrations for each database
3. Executes all tests in parallel
4. Verifies SQL snapshots

Example workflow excerpt:

```yaml
services:
  timescaledb:
    image: timescale/timescaledb-ha:pg17
    env:
      POSTGRES_PASSWORD: password
    ports:
      - 5432:5432
```

## Test Categories

### 1. Builder Tests

Located in `packages/core/tests/`:

- Test SQL generation
- Use snapshots for verification
- Don't require a database
- Fast execution

### 2. Integration Tests

Located in example projects:

- Test actual database operations
- Require database setup
- Run migrations
- Verify data manipulation

### 3. TypeORM Integration Tests

Located in `examples/node-typeorm/tests/`:

- Test decorator behavior
- Test repository extensions
- Verify automatic migrations
- Test continuous aggregates

### 4. Sequelize Integration Tests

Located in `examples/node-sequelize/tests/`:

- Test builder integration
- Test manual migrations
- Test query generation

## Common Testing Patterns

### Testing Time Buckets

```typescript
it('should generate time bucket query', () => {
  const hypertable = TimescaleDB.createHypertable('metrics', {
    by_range: { column_name: 'time' },
  });

  const { sql, params } = hypertable
    .timeBucket({
      interval: '1 hour',
      metrics: [{ type: 'avg', column: 'value', alias: 'avg_value' }],
    })
    .build({
      range: {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-02'),
      },
    });

  expect({ sql, params }).toMatchSnapshot();
});
```

### Testing Continuous Aggregates

```typescript
it('should create continuous aggregate view', async () => {
  await AppDataSource.getRepository(HourlyMetrics)
    .createQueryBuilder()
    .where('bucket >= :start', { start: startDate })
    .andWhere('bucket < :end', { end: endDate })
    .getMany();
});
```

## Troubleshooting

1. Database Connection Issues

   ```
   Error: connect ECONNREFUSED 127.0.0.1:5432
   ```

   - Verify TimescaleDB is running
   - Check port availability
   - Verify environment variables

2. Migration Errors

   ```
   Error: relation "metrics" does not exist
   ```

   - Run migrations before tests
   - Check database credentials
   - Verify TimescaleDB extension is enabled

3. Snapshot Failures
   ```
   Snapshot name: `Hypertable should generate creation SQL 1`
   ```
   - Review recent builder changes
   - Update snapshots if changes are intended
   - Check for whitespace issues

## CI/CD Integration

The test suite is integrated into the CI/CD pipeline:

1. PRs trigger test workflow
2. All tests must pass before merge
3. Snapshot changes require review
4. Examples run with separate databases

For more details, check:

- [GitHub Workflows](../.github/workflows/)
- [Example Projects](../examples/)
- [Core Tests](../packages/core/tests/)

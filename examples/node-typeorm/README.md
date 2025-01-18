# Node TypeORM Example

Example of using TimescaleDB with Node.js and [TypeORM](https://typeorm.io/).

## What it does

- Tracks page views with user agent data
- Uses hypertables for time-series data
- Handles data compression automatically

## Quick Start

```bash
# Setup
cp .env.example .env  # Update DATABASE_URL
pnpm install
pnpm build
pnpm migrate

# Run
pnpm start

# or

# Test
pnpm test
```

## API

```bash
# Record page view
POST /api/pageview

# Get stats for time range
GET /api/stats?start=2025-01-01&end=2025-01-02

# Check compression status
GET /api/compression
```

## Note

This example uses the legacy approach with raw SQL queries. Check back for the new `@timescaledb/core` package that will make this much simpler.

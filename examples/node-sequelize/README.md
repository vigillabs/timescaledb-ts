# Node Sequelize Example

Example of using TimescaleDB with Node.js and [Sequelize](https://sequelize.org/). Based on the legacy [Node.js Quick Start](https://docs.timescale.com/quick-start/latest/node/) but updated with TypeScript and better practices + tests.

## What it does

- Tracks page views with user agent data
- Uses hypertables for time-series data
- Handles data compression automatically
- Provides stats endpoints with time bucketing

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

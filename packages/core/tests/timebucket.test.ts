import { describe, it, expect } from '@jest/globals';
import { TimescaleDB } from '../src';
import { CreateHypertableOptions } from '@timescaledb/schemas';

describe('TimeBucket', () => {
  const defaultOptions: CreateHypertableOptions = {
    by_range: {
      column_name: 'time',
    },
  };

  const baseTime = new Date('2025-01-01T00:00:00Z');
  const timeRange = {
    start: baseTime,
    end: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000), // 1 day later
  };

  describe('build', () => {
    it('should generate query with count metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket(timeRange, {
          interval: '1 hour',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build();

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with distinct count metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket(timeRange, {
          interval: '1 hour',
          metrics: [
            {
              type: 'distinct_count',
              column: 'user_id',
              alias: 'unique_users',
            },
          ],
        })
        .build();

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with multiple metrics', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket(timeRange, {
          interval: '1 hour',
          metrics: [
            {
              type: 'count',
              alias: 'total_events',
            },
            {
              type: 'distinct_count',
              column: 'user_id',
              alias: 'unique_users',
            },
            {
              type: 'distinct_count',
              column: 'session_id',
              alias: 'unique_sessions',
            },
          ],
        })
        .build();

      expect({ sql, params }).toMatchSnapshot();
    });

    it.each(['1 minute', '1 hour', '1 day', '1 week', '1 month'])(
      'should generate query with interval %s',
      (interval) => {
        const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

        const { sql, params } = hypertable
          .timeBucket(timeRange, {
            interval,
            metrics: [
              {
                type: 'count',
                alias: 'total_count',
              },
            ],
          })
          .build();

        expect({ sql, params, interval }).toMatchSnapshot();
      },
    );
  });

  describe('error handling', () => {
    it('should throw error for invalid metric type', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

      expect(() => {
        hypertable
          .timeBucket(timeRange, {
            interval: '1 hour',
            metrics: [
              {
                // @ts-ignore
                type: 'invalid_type',
                alias: 'invalid_metric',
              },
            ],
          })
          .build();
      }).toThrow('Unsupported metric type: invalid_type');
    });

    it('should fail with invalid interval format', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

      // This will fail at runtime when PostgreSQL tries to parse the interval
      const { sql, params } = hypertable
        .timeBucket(timeRange, {
          interval: 'invalid interval',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build();

      expect({ sql, params }).toMatchSnapshot('Invalid interval format');
    });
  });
});

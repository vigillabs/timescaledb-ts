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
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with sum metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'sum',
              column: 'value',
              alias: 'total_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with avg metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'avg',
              column: 'value',
              alias: 'average_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with distinct count metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'distinct_count',
              column: 'user_id',
              alias: 'unique_users',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with min metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'min',
              column: 'value',
              alias: 'min_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with max metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'max',
              column: 'value',
              alias: 'max_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with first metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'first',
              column: 'value',
              alias: 'first_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with last metric', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'last',
              column: 'value',
              alias: 'last_value',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it('should generate query with multiple metrics', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
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
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot();
    });

    it.each(['1 minute', '1 hour', '1 day', '1 week', '1 month'])(
      'should generate query with interval %s',
      (interval) => {
        const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

        const { sql, params } = hypertable
          .timeBucket({
            interval,
            metrics: [
              {
                type: 'count',
                alias: 'total_count',
              },
            ],
          })
          .build({
            range: timeRange,
          });

        expect({ sql, params, interval }).toMatchSnapshot();
      },
    );
  });

  describe('where clause', () => {
    it('should generate query with simple where condition', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build({
          range: timeRange,
          where: {
            user_id: '123',
          },
        });

      expect({ sql, params }).toMatchSnapshot();
      expect(params).toHaveLength(4); // interval, start, end, user_id
    });

    it('should generate query with comparison operator', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);
      const { sql, params } = hypertable
        .timeBucket({
          interval: '1 hour',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build({
          range: timeRange,
          where: {
            temperature: { '>': 25 },
          },
        });

      expect({ sql, params }).toMatchSnapshot();
      expect(params).toHaveLength(4); // interval, start, end, temperature value
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid metric type', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

      expect(() => {
        hypertable
          .timeBucket({
            interval: '1 hour',
            metrics: [
              {
                // @ts-ignore
                type: 'invalid_type',
                alias: 'invalid_metric',
              },
            ],
          })
          .build({
            range: timeRange,
          });
      }).toThrow('Unsupported metric type: invalid_type');
    });

    it('should fail with invalid interval format', () => {
      const hypertable = TimescaleDB.createHypertable('my_table', defaultOptions);

      // This will fail at runtime when PostgreSQL tries to parse the interval
      const { sql, params } = hypertable
        .timeBucket({
          interval: 'invalid interval',
          metrics: [
            {
              type: 'count',
              alias: 'total_count',
            },
          ],
        })
        .build({
          range: timeRange,
        });

      expect({ sql, params }).toMatchSnapshot('Invalid interval format');
    });
  });
});

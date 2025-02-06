import { describe, it, expect } from '@jest/globals';
import { RollupBuilder } from '../src/rollup';
import { RollupConfig, RollupFunctionType } from '@timescaledb/schemas';

describe('RollupBuilder', () => {
  const baseConfig: RollupConfig = {
    continuousAggregateOptions: {
      name: 'daily_rollup',
      bucket_interval: '1 day',
      time_column: 'time',
      refresh_policy: {
        start_offset: '30 days',
        end_offset: '1 day',
        schedule_interval: '1 day',
      },
    },
    rollupOptions: {
      name: 'daily_rollup',
      sourceView: 'hourly_metrics',
      bucketInterval: '1 day',
      rollupRules: [
        {
          rollupFn: RollupFunctionType.Rollup,
          sourceColumn: 'percentile_hourly',
          targetColumn: 'percentile_daily',
        },
      ],
      materializedOnly: false,
    },
  };

  describe('up()', () => {
    it('should generate basic rollup SQL', () => {
      const builder = new RollupBuilder(baseConfig);
      const sql = builder.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should generate SQL with materialized-only option', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          materializedOnly: true,
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should generate SQL with multiple rollup rules', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          rollupRules: [
            {
              rollupFn: RollupFunctionType.Rollup,
              sourceColumn: 'percentile_hourly',
              targetColumn: 'percentile_daily',
            },
            {
              rollupFn: RollupFunctionType.Mean,
              sourceColumn: 'response_time',
              targetColumn: 'mean_response_time',
            },
          ],
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.up().build();
      expect(sql).toMatchSnapshot();
    });

    it('should handle column names with special characters', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          rollupRules: [
            {
              rollupFn: RollupFunctionType.Rollup,
              sourceColumn: 'percentile"hourly',
              targetColumn: 'percentile"daily',
            },
          ],
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.up().build();
      expect(sql).toMatchSnapshot();
    });

    describe('refresh policy', () => {
      it('should generate refresh policy SQL', () => {
        const builder = new RollupBuilder(baseConfig);
        const sql = builder.up().getRefreshPolicy();
        expect(sql).toMatchSnapshot();
      });

      it('should handle null refresh policy', () => {
        const config = {
          ...baseConfig,
          continuousAggregateOptions: {
            ...baseConfig.continuousAggregateOptions,
            refresh_policy: undefined,
          },
        };
        const builder = new RollupBuilder(config);
        const sql = builder.up().getRefreshPolicy();
        expect(sql).toBeNull();
      });

      it('should properly escape interval values', () => {
        const config = {
          ...baseConfig,
          continuousAggregateOptions: {
            ...baseConfig.continuousAggregateOptions,
            refresh_policy: {
              start_offset: "30 days'--injection",
              end_offset: '1 day',
              schedule_interval: '1 day',
            },
          },
        };
        const builder = new RollupBuilder(config);
        const sql = builder.up().getRefreshPolicy();
        expect(sql).toMatchSnapshot();
      });
    });
  });

  describe('down()', () => {
    it('should generate drop statements', () => {
      const builder = new RollupBuilder(baseConfig);
      const sql = builder.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should generate drop statements without refresh policy', () => {
      const config = {
        ...baseConfig,
        continuousAggregateOptions: {
          ...baseConfig.continuousAggregateOptions,
          refresh_policy: undefined,
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.down().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape view names with special characters', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          name: 'daily"rollup',
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.down().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('inspect()', () => {
    it('should generate basic inspect SQL', () => {
      const builder = new RollupBuilder(baseConfig);
      const sql = builder.inspect().build();
      expect(sql).toMatchSnapshot();
    });

    it('should properly escape view names with special characters', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          name: 'daily"rollup',
          sourceView: 'hourly"metrics',
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.inspect().build();
      expect(sql).toMatchSnapshot();
    });

    it('should handle schema qualified names', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          name: 'public.daily_rollup',
          sourceView: 'public.hourly_metrics',
        },
      };
      const builder = new RollupBuilder(config);
      const sql = builder.inspect().build();
      expect(sql).toMatchSnapshot();
    });
  });

  describe('error handling', () => {
    it('should validate required source columns', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          rollupRules: [
            {
              rollupFn: RollupFunctionType.Rollup,
              // @ts-ignore
              sourceColumn: undefined,
              targetColumn: 'rolled_up_value',
            },
          ],
        },
      };
      // @ts-ignore
      const builder = new RollupBuilder(config as RollupConfig);
      expect(() => builder.up().build()).toThrow();
    });

    it('should validate bucket interval', () => {
      const config = {
        ...baseConfig,
        rollupOptions: {
          ...baseConfig.rollupOptions,
          // @ts-ignore
          bucketInterval: '',
        },
      };
      const builder = new RollupBuilder(config as RollupConfig);
      expect(() => builder.up().build()).toThrow();
    });
  });
});

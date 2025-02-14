import { z } from 'zod';
import { ByRangeSchema } from './by-range';
import { TimeRange } from './time-range';
import { WhereClause } from './where';

export const TimeBucketMetricTypeSchema = z.enum([
  'count',
  'distinct_count',
  'sum',
  'avg',
  'min',
  'max',
  'first',
  'last',
]);
export type TimeBucketMetricType = z.infer<typeof TimeBucketMetricTypeSchema>;

export const MetricConfigSchema = z.object({
  type: TimeBucketMetricTypeSchema,
  column: z.string().optional(),
  alias: z.string().optional(),
});
export type MetricConfig = z.infer<typeof MetricConfigSchema>;

export const TimeBucketConfigSchema = z.object({
  interval: z.string(),
  metrics: z.array(MetricConfigSchema),
});
export type TimeBucketConfig = z.infer<typeof TimeBucketConfigSchema>;

export const TimeBucketRowSchema = z
  .object({
    interval: z.string(),
  })
  .and(z.record(z.string(), z.union([z.number(), z.string()])));
export type TimeBucketRow = z.infer<typeof TimeBucketRowSchema>;

export const TimeBucketResultSchema = z.array(TimeBucketRowSchema);
export type TimeBucketResult = z.infer<typeof TimeBucketResultSchema>;

export const GetTimeBucketOptionsSchema = z.object({
  range: ByRangeSchema.required(),
  where: z.string().optional(),
  config: TimeBucketConfigSchema.required(),
});

export type EntityColumns<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export interface TimeBucketMetric<T> {
  type: TimeBucketMetricType;
  column?: EntityColumns<T>;
  alias?: string;
}

export interface TimeBucketOptions<T> {
  timeRange: TimeRange;
  bucket: {
    interval: string;
    metrics: TimeBucketMetric<T>[];
  };
  where?: WhereClause;
}

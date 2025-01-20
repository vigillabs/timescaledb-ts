import { z } from 'zod';
import { ByRangeSchema } from './by-range';

export const MetricTypeSchema = z.enum(['count', 'distinct_count']);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const MetricConfigSchema = z.object({
  type: MetricTypeSchema,
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
  config: TimeBucketConfigSchema.required(),
});

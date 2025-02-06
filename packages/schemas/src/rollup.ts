import { z } from 'zod';
import { CreateContinuousAggregateOptionsSchema } from './continuous-aggregate';

export enum RollupFunctionType {
  Rollup = 'rollup',
  Mean = 'mean',
}

export const RollupFunctionTypeSchema = z.nativeEnum(RollupFunctionType);

export const RollupRuleSchema = z.object({
  rollupFn: RollupFunctionTypeSchema,
  sourceColumn: z.string(),
  targetColumn: z.string().optional(),
});

export type RollupRule = z.infer<typeof RollupRuleSchema>;

export const RollupOptionsSchema = z.object({
  name: z.string(),
  sourceView: z.string(),
  bucketInterval: z.string(),
  rollupRules: z.array(RollupRuleSchema),
  materializedOnly: z.boolean().default(false),
  refreshPolicy: z
    .object({
      startOffset: z.string(),
      endOffset: z.string(),
      scheduleInterval: z.string(),
    })
    .optional(),
});

export type RollupOptions = z.infer<typeof RollupOptionsSchema>;

export const RollupConfigSchema = z.object({
  continuousAggregateOptions: CreateContinuousAggregateOptionsSchema,
  rollupOptions: RollupOptionsSchema,
});

export type RollupConfig = z.infer<typeof RollupConfigSchema>;

export const BucketIntervalSchema = z.object({
  value: z.number(),
  unit: z.enum(['minute', 'hour', 'day', 'week', 'month', 'year']),
});

export type BucketInterval = z.infer<typeof BucketIntervalSchema>;

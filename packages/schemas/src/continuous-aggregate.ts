import { z } from 'zod';

export const AggregateTypeSchema = z.enum(['count', 'count_distinct', 'sum', 'avg', 'min', 'max']);
export type AggregateType = z.infer<typeof AggregateTypeSchema>;

export const AggregateConfigSchema = z.object({
  type: AggregateTypeSchema,
  column: z.string().optional(),
  column_alias: z.string(),
});

export const RefreshPolicySchema = z.object({
  start_offset: z.string(),
  end_offset: z.string(),
  schedule_interval: z.string(),
});

export const CreateContinuousAggregateOptionsSchema = z
  .object({
    name: z.string(),
    bucket_interval: z.string(),
    time_column: z.string(),
    refresh_policy: RefreshPolicySchema.optional(),
    materialized_only: z.boolean().optional().default(true),
    create_group_indexes: z.boolean().optional().default(true),
    aggregates: z.record(AggregateConfigSchema),
  })
  .strict();

export type CreateContinuousAggregateOptions = z.infer<typeof CreateContinuousAggregateOptionsSchema>;

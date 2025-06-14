import { z } from 'zod';

// https://docs.timescale.com/api/latest/compression/hypertable_compression_stats/
export const CompressionStatsSchema = z.object({
  total_chunks: z.number().optional(),
  compressed_chunks: z.number().optional(),
  number_compressed_chunks: z.number().optional(),
  // ... TODO: add the rest of the fields
});
export type CompressionStats = z.infer<typeof CompressionStatsSchema>;

export const CompressionSelectSchema = z
  .object({
    total_chunks: z.boolean().optional(),
    compressed_chunks: z.boolean().optional(),
  })
  .strict();
export type CompressionSelect = z.infer<typeof CompressionSelectSchema>;

// https://docs.timescale.com/api/latest/compression/add_compression_policy/
export const SetCompressionPolicyOptionsSchema = z.object({
  schedule_interval: z.string(),
});

// https://docs.timescale.com/api/latest/compression/alter_table_compression/
export const SetCompressionOptionsSchema = z.object({
  compress: z.boolean(),
  compress_orderby: z.string(),
  compress_segmentby: z.string(),
  chunk_time_interval: z.string().optional(),
  policy: SetCompressionPolicyOptionsSchema.optional(),
});
export type SetCompressionOptions = z.infer<typeof SetCompressionOptionsSchema>;

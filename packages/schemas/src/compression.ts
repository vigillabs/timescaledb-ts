import { z } from 'zod';

// https://docs.timescale.com/api/latest/compression/hypertable_compression_stats/

export const CompressionStatsSchema = z.object({
  total_chunks: z.number(),
  compressed_chunks: z.number(),
  // ... TODO: add the rest of the fields
});

export type CompressionStats = z.infer<typeof CompressionStatsSchema>;

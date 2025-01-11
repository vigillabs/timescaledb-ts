import { z } from 'zod';

export const CompressionStatsSchema = z.object({
  total_chunks: z.number(),
  compressed_chunks: z.number(),
});

export type CompressionStats = z.infer<typeof CompressionStatsSchema>;

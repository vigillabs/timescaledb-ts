import { z } from 'zod';

export const ByRangeSchema = z.object({
  column_name: z.string(),
});
export type ByRange = z.infer<typeof ByRangeSchema>;

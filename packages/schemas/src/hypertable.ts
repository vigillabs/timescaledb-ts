import { z } from 'zod';
import { ByRangeSchema } from './by-range';
import { SetCompressionOptionsSchema } from './compression';

export const CreateHypertableOptionsSchema = z.object({
  by_range: ByRangeSchema.required(),
  compression: SetCompressionOptionsSchema.optional(),
});
export type CreateHypertableOptions = z.infer<typeof CreateHypertableOptionsSchema>;

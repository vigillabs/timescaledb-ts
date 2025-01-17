import { z } from 'zod';

export const CreateExtensionOptionsSchema = z
  .object({
    should_cascade: z.boolean().optional(),
    version: z.string().optional(),
  })
  .strict();
export type CreateExtensionOptions = z.infer<typeof CreateExtensionOptionsSchema>;

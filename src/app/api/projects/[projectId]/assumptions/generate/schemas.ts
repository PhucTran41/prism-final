import { z } from 'zod';

export const generateAssumptionsSchema = z.object({
  name: z.string().min(1, 'name is required'),
  context: z.string().optional(),
  knownRisks: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  strictness: z.enum(['normal', 'strict']).optional(),
});



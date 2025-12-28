import { z } from 'zod';

export const generateScopeSchema = z.object({
  name: z.string().min(1, 'name is required'),
  goals: z.string().optional(),
  must: z.string().optional(),
  should: z.string().optional(),
  could: z.string().optional(),
  non_goals: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  strictness: z.enum(['normal', 'strict']).optional(),
});



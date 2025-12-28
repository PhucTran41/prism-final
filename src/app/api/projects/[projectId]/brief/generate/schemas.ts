import { z } from 'zod';

export const generateBriefSchema = z.object({
  name: z.string().min(1, 'name is required'),
  problem: z.string().optional(),
  targetUser: z.string().optional(),
  goals: z.string().optional(),
  constraints: z.string().optional(),
  model: z.string().optional(),
});



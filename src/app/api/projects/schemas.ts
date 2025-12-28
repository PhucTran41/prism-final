import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional().nullable(),
});

export const projectIdParamSchema = z.object({
  projectId: z.coerce.number().int().positive(),
});



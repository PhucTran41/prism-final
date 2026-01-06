import { z } from "zod";

export const updateAssumptionsSchema = z.object({
  contentMd: z.string().min(1, "contentMd is required"),
});



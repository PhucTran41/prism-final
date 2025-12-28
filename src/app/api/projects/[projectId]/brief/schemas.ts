import { z } from "zod";

export const updateBriefSchema = z.object({
  contentMd: z.string().min(1, "contentMd is required"),
});



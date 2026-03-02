import { z } from "zod";

export const UpdateMeSchema = z.object({
    displayName: z.string().trim().min(2).max(40),
});

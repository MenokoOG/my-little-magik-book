import { z } from "zod";

const EnvSchema = z.object({
    DATABASE_URL: z.string().min(1),
    SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
    APP_ENV: z.string().optional(),
    APP_URL: z.string().url().optional(),
    MAGICTHEGATHERING_API_BASE: z.string().url().optional(),
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(60),
    CARD_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
});

export const env = EnvSchema.parse(process.env);

import { z } from "zod";

const passwordRules = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long");

export const SignupSchema = z.object({
    email: z.string().email(),
    password: passwordRules,
    displayName: z
        .string()
        .trim()
        .max(40)
        .optional()
        .transform((value) => {
            if (!value) {
                return undefined;
            }

            return value;
        })
        .refine((value) => !value || value.length >= 2, {
            message: "Display name must be at least 2 characters",
        }),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordRules,
});

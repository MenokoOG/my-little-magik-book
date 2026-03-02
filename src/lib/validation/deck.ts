import { DeckMode, DeckVisibility } from "@prisma/client";
import { z } from "zod";

const deckNameSchema = z.string().trim().min(1).max(60);

const deckModeSchema = z.nativeEnum(DeckMode);
const deckVisibilitySchema = z.nativeEnum(DeckVisibility);

export const CreateDeckSchema = z.object({
    name: deckNameSchema,
    mode: deckModeSchema.default(DeckMode.MAIN),
    visibility: deckVisibilitySchema.default(DeckVisibility.PRIVATE),
});

export const UpdateDeckSchema = z
    .object({
        name: deckNameSchema.optional(),
        mode: deckModeSchema.optional(),
        visibility: deckVisibilitySchema.optional(),
    })
    .refine((data) => data.name || data.mode || data.visibility, {
        message: "At least one field is required",
    });

export const ReplaceDeckCardsSchema = z.object({
    cards: z
        .array(
            z.object({
                cardId: z.string().trim().min(1).max(100),
                quantity: z.number().int().min(1).max(99),
            }),
        )
        .max(200),
});

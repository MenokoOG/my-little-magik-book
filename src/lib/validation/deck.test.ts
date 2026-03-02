import { describe, expect, it } from "vitest";

import {
    RecommendationModeSchema,
    ReplaceDeckCardsSchema,
} from "@/lib/validation/deck";

describe("deck validation", () => {
    it("accepts valid replacement payload", () => {
        const parsed = ReplaceDeckCardsSchema.safeParse({
            cards: [
                { cardId: "abc-1", quantity: 2 },
                { cardId: "abc-2", quantity: 4 },
            ],
        });

        expect(parsed.success).toBe(true);
    });

    it("rejects invalid card quantities", () => {
        const parsed = ReplaceDeckCardsSchema.safeParse({
            cards: [{ cardId: "abc-1", quantity: 0 }],
        });

        expect(parsed.success).toBe(false);
    });

    it("restricts recommendation mode values", () => {
        expect(RecommendationModeSchema.safeParse("aggressive").success).toBe(true);
        expect(RecommendationModeSchema.safeParse("defensive").success).toBe(true);
        expect(RecommendationModeSchema.safeParse("yolo").success).toBe(true);
        expect(RecommendationModeSchema.safeParse("main").success).toBe(false);
    });
});

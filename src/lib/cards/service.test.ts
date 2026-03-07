import { describe, expect, it } from "vitest";

import {
  normalizeCardsPayload,
  normalizeImageUrl,
} from "@/lib/cards/image-url";

describe("normalizeImageUrl", () => {
  it("upgrades http image URLs to https", () => {
    expect(
      normalizeImageUrl(
        "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=1&type=card",
      ),
    ).toBe(
      "https://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=1&type=card",
    );
  });

  it("returns null for invalid or unsupported protocols", () => {
    expect(normalizeImageUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeImageUrl("ftp://example.com/card.jpg")).toBeNull();
    expect(normalizeImageUrl("not-a-url")).toBeNull();
  });
});

describe("normalizeCardsPayload", () => {
  it("normalizes image URLs in search payload cards", () => {
    const payload = normalizeCardsPayload({
      cards: [{ id: "a", imageUrl: "http://example.com/card.jpg" }],
    }) as { cards: Array<{ imageUrl: string | null }> };

    expect(payload.cards[0]?.imageUrl).toBe("https://example.com/card.jpg");
  });

  it("normalizes image URL in detail payload card", () => {
    const payload = normalizeCardsPayload({
      card: { id: "a", imageUrl: "http://example.com/detail.jpg" },
    }) as { card: { imageUrl: string | null } };

    expect(payload.card.imageUrl).toBe("https://example.com/detail.jpg");
  });
});

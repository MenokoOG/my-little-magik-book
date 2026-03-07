export function normalizeImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  const upgraded = withProtocol.replace(/^http:\/\//i, "https://");

  try {
    const parsed = new URL(upgraded);
    if (parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeCardRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;
  const normalized = { ...record };
  if ("imageUrl" in record) {
    normalized.imageUrl = normalizeImageUrl(record.imageUrl);
  }

  return normalized;
}

export function normalizeCardsPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return value;
  }

  const payload = value as Record<string, unknown>;
  const normalized = { ...payload };

  if (Array.isArray(payload.cards)) {
    normalized.cards = payload.cards.map((card) => normalizeCardRecord(card));
  }

  if (payload.card) {
    normalized.card = normalizeCardRecord(payload.card);
  }

  return normalized;
}

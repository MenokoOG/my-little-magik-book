"use client";

import { useEffect, useState } from "react";

type CardListItem = {
  id: string;
  name: string;
  type: string;
  rarity: string;
  setName: string;
};

type CardDetails = {
  id: string;
  name: string;
  text: string;
  type: string;
  manaCost: string;
  rarity: string;
  setName: string;
};

const RARITY_OPTIONS = ["", "Common", "Uncommon", "Rare", "Mythic"];

function normalizeCard(raw: Record<string, unknown>): CardListItem {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Unknown card"),
    type: String(raw.type ?? "Unknown type"),
    rarity: String(raw.rarity ?? "Unknown rarity"),
    setName: String(raw.setName ?? "Unknown set"),
  };
}

function normalizeDetails(raw: Record<string, unknown>): CardDetails {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Unknown card"),
    text: String(raw.text ?? "No rules text available."),
    type: String(raw.type ?? "Unknown type"),
    manaCost: String(raw.manaCost ?? "N/A"),
    rarity: String(raw.rarity ?? "Unknown rarity"),
    setName: String(raw.setName ?? "Unknown set"),
  };
}

export function ExploreBrowser() {
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cards, setCards] = useState<CardListItem[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardDetails | null>(null);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [detailsState, setDetailsState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const syncOnlineState = () => {
      setIsOffline(!navigator.onLine);
    };

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);

    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setCards([]);
      setSelectedCardId(null);
      setSelectedCard(null);
      setSearchState("idle");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      if (!navigator.onLine) {
        setStatus("You are offline. Card search requires a connection.");
        setSearchState("error");
        return;
      }

      setSearchState("loading");
      setStatus(null);

      const params = new URLSearchParams({ q: trimmed, pageSize: "25" });
      if (rarity) {
        params.set("rarity", rarity);
      }
      if (typeFilter.trim()) {
        params.set("types", typeFilter.trim());
      }

      const response = await fetch(`/api/cards/search?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSearchState("error");
        setStatus(data.error ?? "Could not load cards");
        return;
      }

      const nextCards = (Array.isArray(data.cards) ? data.cards : [])
        .map((card: unknown) => normalizeCard(card as Record<string, unknown>))
        .filter((card: CardListItem) => card.id.length > 0);

      setCards(nextCards);
      setSelectedCardId(nextCards[0]?.id ?? null);
      setSearchState("idle");
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [query, rarity, typeFilter]);

  useEffect(() => {
    if (!selectedCardId) {
      setSelectedCard(null);
      setDetailsState("idle");
      return;
    }

    const cardId = selectedCardId;

    let canceled = false;

    async function loadDetails() {
      setDetailsState("loading");

      const response = await fetch(`/api/cards/${encodeURIComponent(cardId)}`);
      const data = await response.json().catch(() => ({}));

      if (canceled) {
        return;
      }

      if (!response.ok) {
        setDetailsState("error");
        setStatus(data.error ?? "Could not load card details");
        return;
      }

      const raw = (data as { card?: Record<string, unknown> }).card;
      if (!raw) {
        setDetailsState("error");
        setStatus("Card details are unavailable for this card.");
        return;
      }

      setSelectedCard(normalizeDetails(raw));
      setDetailsState("idle");
    }

    void loadDetails();

    return () => {
      canceled = true;
    };
  }, [selectedCardId]);

  const showEmpty =
    query.trim().length > 0 && searchState === "idle" && cards.length === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm">Card name</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try: dragon, bolt, angel..."
            className="w-full rounded border px-3 py-2"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Rarity</span>
          <select
            value={rarity}
            onChange={(event) => setRarity(event.target.value)}
            className="w-full rounded border px-3 py-2"
          >
            {RARITY_OPTIONS.map((option) => (
              <option key={option || "all"} value={option}>
                {option || "Any rarity"}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm">Type filter</span>
          <input
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            placeholder="Example: Creature"
            className="w-full rounded border px-3 py-2"
          />
        </label>
      </div>

      {isOffline ? (
        <p className="text-sm">
          Offline mode: search is currently unavailable.
        </p>
      ) : null}
      {searchState === "loading" ? (
        <p className="text-sm">Searching cards...</p>
      ) : null}
      {searchState === "error" ? (
        <p className="text-sm">Card search failed.</p>
      ) : null}
      {showEmpty ? (
        <p className="text-sm">No cards found for your filters.</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded border p-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <ul className="mt-3 max-h-[28rem] space-y-2 overflow-auto pr-1">
            {cards.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => setSelectedCardId(card.id)}
                  className={`w-full rounded border px-3 py-2 text-left ${selectedCardId === card.id ? "font-semibold" : ""}`}
                >
                  <p>{card.name}</p>
                  <p className="text-xs opacity-75">
                    {card.type} · {card.rarity} · {card.setName}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded border p-4">
          <h3 className="text-lg font-semibold">Card Details</h3>
          {detailsState === "loading" ? (
            <p className="mt-3 text-sm">Loading details...</p>
          ) : null}
          {detailsState === "error" ? (
            <p className="mt-3 text-sm">
              Card details are unavailable right now.
            </p>
          ) : null}
          {!selectedCard ? (
            <p className="mt-3 text-sm">Select a card to view details.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-lg font-medium">{selectedCard.name}</p>
              <p>{selectedCard.type}</p>
              <p>Mana Cost: {selectedCard.manaCost}</p>
              <p>Rarity: {selectedCard.rarity}</p>
              <p>Set: {selectedCard.setName}</p>
              <p className="whitespace-pre-wrap">{selectedCard.text}</p>
            </div>
          )}
        </section>
      </div>

      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}

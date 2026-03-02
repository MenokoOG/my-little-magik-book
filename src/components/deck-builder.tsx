"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

type DeckMode = "MAIN" | "AGGRESSIVE" | "DEFENSIVE" | "YOLO";
type DeckVisibility = "PRIVATE" | "FRIENDS" | "PUBLIC";

type DeckCard = {
  cardId: string;
  quantity: number;
};

type Deck = {
  id: string;
  name: string;
  mode: DeckMode;
  visibility: DeckVisibility;
  cards: DeckCard[];
};

type CardMeta = {
  id: string;
  name: string;
  manaValue: number | null;
  typeLine: string;
};

type CardsSearchResponse = {
  cards?: Array<Record<string, unknown>>;
};

const MODE_LABELS: Record<DeckMode, string> = {
  MAIN: "Main",
  AGGRESSIVE: "Aggressive",
  DEFENSIVE: "Defensive",
  YOLO: "YOLO",
};

function parseCardMeta(raw: Record<string, unknown>): CardMeta {
  const id = String(raw.id ?? "");
  const name = String((raw.name ?? id) || "Unknown card");
  const cmcRaw = raw.cmc;
  const manaValue =
    typeof cmcRaw === "number"
      ? cmcRaw
      : typeof cmcRaw === "string" && cmcRaw.trim().length > 0
        ? Number(cmcRaw)
        : null;

  return {
    id,
    name,
    manaValue: Number.isFinite(manaValue ?? NaN) ? Number(manaValue) : null,
    typeLine: String(raw.type ?? "Unknown type"),
  };
}

function DraggableCard({
  dragId,
  card,
  subtitle,
  actions,
}: {
  dragId: string;
  card: CardMeta;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: dragId,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded border p-3 ${isDragging ? "opacity-60" : "opacity-100"}`}
    >
      <button
        type="button"
        className="w-full cursor-grab text-left active:cursor-grabbing"
        {...listeners}
        {...attributes}
      >
        <p className="font-medium">{card.name}</p>
        <p className="text-xs opacity-75">{subtitle}</p>
      </button>
      {actions ? <div className="mt-2">{actions}</div> : null}
    </li>
  );
}

function DropZone({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={`rounded border p-4 ${isOver ? "border-black" : "border-current"}`}
    >
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function DeckBuilder() {
  const [csrfToken, setCsrfToken] = useState("");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeMode, setActiveMode] = useState<DeckMode>("MAIN");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CardMeta[]>([]);
  const [cardMetaById, setCardMetaById] = useState<Record<string, CardMeta>>(
    {},
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(true);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [savingCards, setSavingCards] = useState(false);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.mode === activeMode) ?? null,
    [activeMode, decks],
  );

  const refreshDecks = useCallback(async () => {
    setLoadingDecks(true);
    const response = await fetch("/api/decks");
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error ?? "Could not load decks");
      setLoadingDecks(false);
      return;
    }

    setDecks(Array.isArray(data.decks) ? (data.decks as Deck[]) : []);
    setLoadingDecks(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      try {
        const meResponse = await fetch("/api/me", {
          signal: controller.signal,
        });
        const meData = await meResponse.json().catch(() => ({}));
        if (meResponse.ok) {
          setCsrfToken(String(meData.csrfToken ?? ""));
        }

        await refreshDecks();
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setStatus("Could not load deck builder");
        setLoadingDecks(false);
      }
    }

    void bootstrap();

    return () => controller.abort();
  }, [refreshDecks]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setSearchState("idle");
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(
          `/api/cards/search?q=${encodeURIComponent(search.trim())}&pageSize=20`,
        );
        const data = (await response
          .json()
          .catch(() => ({}))) as CardsSearchResponse;

        if (!response.ok) {
          setSearchState("error");
          return;
        }

        const nextCards = (Array.isArray(data.cards) ? data.cards : [])
          .map((card) => parseCardMeta(card))
          .filter((card) => card.id.length > 0);

        setSearchResults(nextCards);
        setCardMetaById((prev) => {
          const merged = { ...prev };
          for (const card of nextCards) {
            merged[card.id] = card;
          }
          return merged;
        });
        setSearchState("idle");
      } catch {
        setSearchState("error");
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (!activeDeck) {
      return;
    }

    const missingIds = activeDeck.cards
      .map((entry) => entry.cardId)
      .filter((cardId) => !cardMetaById[cardId]);

    if (missingIds.length === 0) {
      return;
    }

    let canceled = false;

    async function hydrateMeta() {
      for (const cardId of missingIds) {
        try {
          const response = await fetch(
            `/api/cards/${encodeURIComponent(cardId)}`,
          );
          const data = await response.json().catch(() => ({}));
          if (!response.ok || canceled) {
            continue;
          }

          const rawCard = (data as { card?: Record<string, unknown> }).card;
          if (!rawCard) {
            continue;
          }

          const parsed = parseCardMeta(rawCard);
          if (!parsed.id) {
            continue;
          }

          setCardMetaById((prev) => ({ ...prev, [parsed.id]: parsed }));
        } catch {
          if (canceled) {
            return;
          }
        }
      }
    }

    void hydrateMeta();

    return () => {
      canceled = true;
    };
  }, [activeDeck, cardMetaById]);

  const deckCount = useMemo(() => {
    if (!activeDeck) {
      return 0;
    }

    return activeDeck.cards.reduce((total, card) => total + card.quantity, 0);
  }, [activeDeck]);

  const manaCurve = useMemo(() => {
    if (!activeDeck) {
      return [] as Array<{ bucket: string; count: number }>;
    }

    const buckets: Record<string, number> = {
      "0-1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5+": 0,
      Unknown: 0,
    };

    for (const card of activeDeck.cards) {
      const meta = cardMetaById[card.cardId];
      if (!meta || meta.manaValue === null) {
        buckets.Unknown += card.quantity;
        continue;
      }

      if (meta.manaValue <= 1) {
        buckets["0-1"] += card.quantity;
      } else if (meta.manaValue >= 5) {
        buckets["5+"] += card.quantity;
      } else {
        buckets[String(meta.manaValue)] += card.quantity;
      }
    }

    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count,
    }));
  }, [activeDeck, cardMetaById]);

  const warnings = useMemo(() => {
    if (!activeDeck) {
      return [] as string[];
    }

    const nextWarnings: string[] = [];

    if (deckCount < 60) {
      nextWarnings.push("Deck has fewer than 60 total cards.");
    }

    const tooManyCopies = activeDeck.cards.find((card) => card.quantity > 4);
    if (tooManyCopies) {
      nextWarnings.push("One or more cards exceed 4 copies.");
    }

    return nextWarnings;
  }, [activeDeck, deckCount]);

  async function saveCards(nextCards: DeckCard[]) {
    if (!activeDeck) {
      return;
    }

    if (!navigator.onLine) {
      setStatus(
        "You are offline. Deck writes are disabled until connection returns.",
      );
      return;
    }

    const previousDecks = decks;
    setSavingCards(true);

    const updatedDecks = decks.map((deck) =>
      deck.id === activeDeck.id ? { ...deck, cards: nextCards } : deck,
    );
    setDecks(updatedDecks);

    const response = await fetch(`/api/decks/${activeDeck.id}/cards`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ cards: nextCards }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDecks(previousDecks);
      setStatus(data.error ?? "Could not save deck cards");
      setSavingCards(false);
      return;
    }

    setStatus("Deck saved");
    setSavingCards(false);
  }

  async function updateDeckMeta(
    next: Partial<Pick<Deck, "name" | "visibility">>,
  ) {
    if (!activeDeck) {
      return;
    }

    const previousDecks = decks;
    setDecks((current) =>
      current.map((deck) =>
        deck.id === activeDeck.id ? { ...deck, ...next } : deck,
      ),
    );

    const response = await fetch(`/api/decks/${activeDeck.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(next),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setDecks(previousDecks);
      setStatus(data.error ?? "Could not update deck settings");
      return;
    }

    setStatus("Deck settings updated");
  }

  function addCard(cardId: string) {
    if (!activeDeck || savingCards) {
      return;
    }

    const existing = activeDeck.cards.find((entry) => entry.cardId === cardId);
    const nextCards = existing
      ? activeDeck.cards.map((entry) =>
          entry.cardId === cardId
            ? { ...entry, quantity: entry.quantity + 1 }
            : entry,
        )
      : [...activeDeck.cards, { cardId, quantity: 1 }];

    void saveCards(nextCards);
  }

  function decrementCard(cardId: string) {
    if (!activeDeck || savingCards) {
      return;
    }

    const existing = activeDeck.cards.find((entry) => entry.cardId === cardId);
    if (!existing) {
      return;
    }

    const nextCards =
      existing.quantity <= 1
        ? activeDeck.cards.filter((entry) => entry.cardId !== cardId)
        : activeDeck.cards.map((entry) =>
            entry.cardId === cardId
              ? { ...entry, quantity: entry.quantity - 1 }
              : entry,
          );

    void saveCards(nextCards);
  }

  function onDragEnd(event: DragEndEvent) {
    const source = String(event.active.id);
    const target = String(event.over?.id ?? "");

    if (!target || source === target) {
      return;
    }

    const [sourceType, cardId] = source.split(":");
    if (!cardId) {
      return;
    }

    if (sourceType === "search" && target === "deck-zone") {
      addCard(cardId);
      return;
    }

    if (sourceType === "deck" && target === "collection-zone") {
      decrementCard(cardId);
    }
  }

  const searchEmpty =
    search.trim().length > 0 &&
    searchState === "idle" &&
    searchResults.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODE_LABELS) as DeckMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setActiveMode(mode)}
            className={`rounded border px-3 py-2 text-sm ${activeMode === mode ? "font-semibold" : ""}`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {loadingDecks ? <p className="text-sm">Loading decks...</p> : null}

      {!loadingDecks && !activeDeck ? (
        <p className="text-sm">No deck found for this mode yet.</p>
      ) : null}

      {activeDeck ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm">Deck name</span>
              <input
                value={activeDeck.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setDecks((current) =>
                    current.map((deck) =>
                      deck.id === activeDeck.id ? { ...deck, name } : deck,
                    ),
                  );
                }}
                onBlur={() => void updateDeckMeta({ name: activeDeck.name })}
                className="w-full rounded border px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm">Visibility</span>
              <select
                value={activeDeck.visibility}
                onChange={(event) => {
                  const visibility = event.target.value as DeckVisibility;
                  setDecks((current) =>
                    current.map((deck) =>
                      deck.id === activeDeck.id
                        ? { ...deck, visibility }
                        : deck,
                    ),
                  );
                  void updateDeckMeta({ visibility });
                }}
                className="w-full rounded border px-3 py-2"
              >
                <option value="PRIVATE">Private</option>
                <option value="FRIENDS">Friends</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
          </div>

          <DndContext onDragEnd={onDragEnd}>
            <div className="grid gap-4 lg:grid-cols-2">
              <DropZone id="collection-zone" title="Card Collection">
                <div className="mb-3 space-y-2">
                  <label htmlFor="deck-search" className="text-sm">
                    Search cards
                  </label>
                  <input
                    id="deck-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Try: lightning, dragon, elf..."
                    className="w-full rounded border px-3 py-2"
                  />
                </div>

                {searchState === "loading" ? (
                  <p className="text-sm">Searching...</p>
                ) : null}
                {searchState === "error" ? (
                  <p className="text-sm">
                    Card search is unavailable right now.
                  </p>
                ) : null}
                {searchEmpty ? (
                  <p className="text-sm">No matching cards found.</p>
                ) : null}

                <ul className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                  {searchResults.map((card) => (
                    <DraggableCard
                      key={card.id}
                      dragId={`search:${card.id}`}
                      card={card}
                      subtitle={`MV ${card.manaValue ?? "?"} · ${card.typeLine}`}
                      actions={
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-xs"
                          onClick={() => addCard(card.id)}
                        >
                          Add to deck
                        </button>
                      }
                    />
                  ))}
                </ul>
              </DropZone>

              <DropZone id="deck-zone" title="Your Deck">
                <div className="mb-3 text-sm">
                  <p>Total cards: {deckCount}</p>
                  <p>
                    Mana curve:{" "}
                    {manaCurve
                      .map((item) => `${item.bucket}:${item.count}`)
                      .join(" · ")}
                  </p>
                  {warnings.length > 0 ? (
                    <ul className="mt-2 list-disc pl-5">
                      {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {activeDeck.cards.length === 0 ? (
                  <p className="text-sm">Drag cards here to build your deck.</p>
                ) : null}

                <ul className="max-h-[26rem] space-y-2 overflow-auto pr-1">
                  {activeDeck.cards
                    .slice()
                    .sort((a, b) => a.cardId.localeCompare(b.cardId))
                    .map((entry) => {
                      const meta =
                        cardMetaById[entry.cardId] ??
                        ({
                          id: entry.cardId,
                          name: entry.cardId,
                          manaValue: null,
                          typeLine: "Unknown type",
                        } as CardMeta);

                      return (
                        <DraggableCard
                          key={entry.cardId}
                          dragId={`deck:${entry.cardId}`}
                          card={meta}
                          subtitle={`Qty ${entry.quantity} · MV ${meta.manaValue ?? "?"}`}
                          actions={
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="rounded border px-2 py-1 text-xs"
                                onClick={() => decrementCard(entry.cardId)}
                              >
                                -
                              </button>
                              <button
                                type="button"
                                className="rounded border px-2 py-1 text-xs"
                                onClick={() => addCard(entry.cardId)}
                              >
                                +
                              </button>
                            </div>
                          }
                        />
                      );
                    })}
                </ul>
              </DropZone>
            </div>
          </DndContext>
        </>
      ) : null}

      {savingCards ? <p className="text-sm">Saving deck...</p> : null}
      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}

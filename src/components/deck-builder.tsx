"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  buildDeckWarnings,
  buildManaCurve,
  countDeckCards,
} from "@/lib/decks/stats";

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
  imageUrl: string | null;
};

type DeckRecommendation = {
  card_id: string;
  score: number;
  reason: string;
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

const MODE_QUERY: Record<DeckMode, "aggressive" | "defensive" | "yolo"> = {
  MAIN: "aggressive",
  AGGRESSIVE: "aggressive",
  DEFENSIVE: "defensive",
  YOLO: "yolo",
};

function toDisplayImageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const upgraded = trimmed.replace(/^http:\/\//i, "https://");
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
    imageUrl: toDisplayImageUrl(raw.imageUrl),
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
  const [imageFailed, setImageFailed] = useState(false);
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
      className={`mlmb-panel-soft rounded-xl p-3 ${isDragging ? "opacity-60" : "opacity-100"}`}
    >
      <div className="flex items-start gap-3">
        {card.imageUrl && !imageFailed ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            width={48}
            height={64}
            unoptimized
            onError={() => setImageFailed(true)}
            className="mlmb-frame h-16 w-12 rounded-md object-cover"
          />
        ) : (
          <div className="mlmb-frame mlmb-muted flex h-16 w-12 items-center justify-center rounded-md text-[10px]">
            No art
          </div>
        )}
        <button
          type="button"
          className="w-full cursor-grab text-left active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <p className="font-medium">{card.name}</p>
          <p className="mlmb-muted text-xs">{subtitle}</p>
        </button>
      </div>
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
      className={`mlmb-panel rounded-2xl p-4 ${isOver ? "ring-2 ring-amber-700/70" : ""}`}
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
  const [isOffline, setIsOffline] = useState(false);
  const [recommendations, setRecommendations] = useState<DeckRecommendation[]>(
    [],
  );
  const [recommendationState, setRecommendationState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(
    () => new Set(),
  );

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

  useEffect(() => {
    if (!activeDeck || !csrfToken) {
      setRecommendations([]);
      return;
    }

    const deckId = activeDeck.id;

    const controller = new AbortController();

    async function loadRecommendations() {
      setRecommendationState("loading");
      try {
        const response = await fetch(
          `/api/decks/${deckId}/recommendations?mode=${MODE_QUERY[activeMode]}`,
          {
            method: "POST",
            headers: {
              "x-csrf-token": csrfToken,
            },
            signal: controller.signal,
          },
        );

        const data = (await response.json().catch(() => ({}))) as {
          recommendations?: DeckRecommendation[];
          error?: string;
        };

        if (!response.ok) {
          setRecommendationState("error");
          setStatus(data.error ?? "Could not load recommendations");
          return;
        }

        setRecommendations(
          Array.isArray(data.recommendations) ? data.recommendations : [],
        );
        setRecommendationState("idle");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setRecommendationState("error");
      }
    }

    void loadRecommendations();

    return () => controller.abort();
  }, [activeDeck, activeMode, csrfToken]);

  useEffect(() => {
    const missingRecommended = recommendations
      .map((entry) => entry.card_id)
      .filter((cardId) => !cardMetaById[cardId]);

    if (missingRecommended.length === 0) {
      return;
    }

    let canceled = false;

    async function hydrateRecommendedMeta() {
      for (const cardId of missingRecommended.slice(0, 12)) {
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

    void hydrateRecommendedMeta();

    return () => {
      canceled = true;
    };
  }, [cardMetaById, recommendations]);

  const deckCount = useMemo(() => {
    if (!activeDeck) {
      return 0;
    }

    return countDeckCards(activeDeck.cards);
  }, [activeDeck]);

  const manaCurve = useMemo(() => {
    if (!activeDeck) {
      return [] as Array<{ bucket: string; count: number }>;
    }

    return buildManaCurve(activeDeck.cards, cardMetaById);
  }, [activeDeck, cardMetaById]);

  const warnings = useMemo(() => {
    if (!activeDeck) {
      return [] as string[];
    }

    return buildDeckWarnings(activeDeck.cards, deckCount);
  }, [activeDeck, deckCount]);

  async function saveCards(nextCards: DeckCard[]) {
    if (!activeDeck) {
      return;
    }

    if (isOffline) {
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

    if (isOffline) {
      setStatus(
        "You are offline. Deck writes are disabled until connection returns.",
      );
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
    if (!activeDeck || savingCards || isOffline) {
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
    if (!activeDeck || savingCards || isOffline) {
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
            className={`mlmb-focus-ring rounded-xl border px-3 py-2 text-sm ${activeMode === mode ? "mlmb-chip border-amber-800/80 font-semibold" : "mlmb-input"}`}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {isOffline ? (
        <p className="text-sm">
          Offline mode: deck writes are paused to protect your data.
        </p>
      ) : null}

      {loadingDecks ? <p className="text-sm">Loading decks...</p> : null}

      {!loadingDecks && !activeDeck ? (
        <p className="text-sm">No deck found for this mode yet.</p>
      ) : null}

      {activeDeck ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Deck name</span>
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
                disabled={isOffline}
                className="mlmb-input w-full rounded-xl px-3 py-2"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Visibility</span>
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
                disabled={isOffline}
                className="mlmb-input w-full rounded-xl px-3 py-2"
              >
                <option value="PRIVATE">Private</option>
                <option value="FRIENDS">Friends</option>
                <option value="PUBLIC">Public</option>
              </select>
            </label>
          </div>

          <section className="mlmb-panel rounded-2xl p-4">
            <h3 className="text-lg font-semibold">Recommendations</h3>
            <p className="mlmb-muted mt-1 text-sm">
              Mode-aware suggestions with explainable scoring.
            </p>

            {recommendationState === "loading" ? (
              <p className="mt-2 text-sm">Loading recommendations...</p>
            ) : null}

            {recommendationState === "error" ? (
              <p className="mt-2 text-sm">
                Recommendations are unavailable right now.
              </p>
            ) : null}

            {recommendationState === "idle" && recommendations.length === 0 ? (
              <p className="mt-2 text-sm">
                No suggestions available yet. Add a few cards to improve
                signals.
              </p>
            ) : null}

            {recommendations.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {recommendations.map((item) => {
                  const meta = cardMetaById[item.card_id];
                  return (
                    <li
                      key={item.card_id}
                      className="mlmb-panel-soft rounded-xl p-3 text-sm"
                    >
                      {meta?.imageUrl && !failedImageUrls.has(meta.imageUrl) ? (
                        <Image
                          src={meta.imageUrl}
                          alt={meta.name}
                          width={488}
                          height={680}
                          unoptimized
                          onError={() =>
                            setFailedImageUrls((current) => {
                              const next = new Set(current);
                              next.add(meta.imageUrl as string);
                              return next;
                            })
                          }
                          className="mlmb-frame mb-2 h-36 w-full rounded-lg object-contain"
                        />
                      ) : (
                        <div className="mlmb-frame mlmb-muted mb-2 flex h-36 w-full items-center justify-center rounded-lg text-xs">
                          Card art unavailable.
                        </div>
                      )}
                      <p className="font-medium">
                        {meta?.name ?? item.card_id}
                      </p>
                      <p className="mlmb-muted">
                        Score {item.score.toFixed(2)}
                      </p>
                      <p className="mlmb-muted">{item.reason}</p>
                      <button
                        type="button"
                        className="mlmb-button mlmb-focus-ring mt-2 rounded-lg px-2 py-1 text-xs"
                        disabled={isOffline || savingCards}
                        onClick={() => addCard(item.card_id)}
                      >
                        Add to deck
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

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
                    disabled={isOffline}
                    className="mlmb-input w-full rounded-xl px-3 py-2"
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
                          className="mlmb-button mlmb-focus-ring rounded-lg px-2 py-1 text-xs"
                          disabled={isOffline || savingCards}
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
                          imageUrl: null,
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
                                className="mlmb-button mlmb-focus-ring rounded-lg px-2 py-1 text-xs"
                                disabled={isOffline || savingCards}
                                onClick={() => decrementCard(entry.cardId)}
                              >
                                -
                              </button>
                              <button
                                type="button"
                                className="mlmb-button mlmb-focus-ring rounded-lg px-2 py-1 text-xs"
                                disabled={isOffline || savingCards}
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

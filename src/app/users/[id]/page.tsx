import { DeckVisibility } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/page-shell";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { areFriends } from "@/lib/friends";

type UserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;

  const viewer = await getSessionUser();
  if (!viewer) {
    notFound();
  }

  const viewedUser = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
    },
  });

  if (!viewedUser) {
    notFound();
  }

  const isSelf = viewedUser.id === viewer.id;
  const friendship = isSelf ? true : await areFriends(viewer.id, viewedUser.id);

  const decks = await db.deck.findMany({
    where: {
      ownerId: viewedUser.id,
      ...(isSelf
        ? {}
        : friendship
          ? {
              visibility: {
                in: [DeckVisibility.PUBLIC, DeckVisibility.FRIENDS],
              },
            }
          : {
              visibility: DeckVisibility.PUBLIC,
            }),
    },
    include: {
      cards: {
        orderBy: {
          cardId: "asc",
        },
      },
    },
    orderBy: {
      mode: "asc",
    },
  });

  const totalDeckCount = await db.deck.count({
    where: {
      ownerId: viewedUser.id,
    },
  });

  const noVisibleDeckMessage = isSelf
    ? "You have not created any decks yet. Open Deck Builder to create your first one."
    : totalDeckCount === 0
      ? "This player has not created any decks yet."
      : friendship
        ? "This player has decks, but none are currently shared with friends or public visibility."
        : "This player has no public decks visible right now. Send a friend request to view friends-only decks.";

  return (
    <div className="space-y-6">
      <PageShell
        title={viewedUser.displayName?.trim() || "Unnamed player"}
        description="Deck visibility is enforced by privacy settings: private, friends, or public."
      />

      {decks.length === 0 ? (
        <p className="mlmb-muted text-sm dark:text-slate-300">
          {noVisibleDeckMessage}
        </p>
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => {
            const totalCards = deck.cards.reduce(
              (sum, entry) => sum + entry.quantity,
              0,
            );
            const visibilityTone =
              deck.visibility === DeckVisibility.PUBLIC
                ? "text-emerald-700 dark:text-emerald-300"
                : deck.visibility === DeckVisibility.FRIENDS
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-rose-700 dark:text-rose-300";

            return (
              <li
                key={deck.id}
                className="mlmb-panel rounded p-4 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <p className="font-medium">{deck.name}</p>
                <p className="mt-1 text-sm">
                  {deck.mode} ·{" "}
                  <span className={visibilityTone}>{deck.visibility}</span> ·{" "}
                  {totalCards} cards
                </p>
                {isSelf ? (
                  <Link
                    href="/deck"
                    className="mt-2 inline-block text-sm underline"
                  >
                    Open your deck builder
                  </Link>
                ) : (
                  <p className="mlmb-muted mt-2 text-xs dark:text-slate-300">
                    Shared deck preview. Editing is only available in your own
                    deck builder.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

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

  return (
    <div className="space-y-6">
      <PageShell
        title={viewedUser.displayName?.trim() || "Unnamed player"}
        description="Deck visibility is enforced by privacy settings: private, friends, or public."
      />

      {decks.length === 0 ? (
        <p className="text-sm">No visible decks for this user.</p>
      ) : (
        <ul className="space-y-3">
          {decks.map((deck) => {
            const totalCards = deck.cards.reduce(
              (sum, entry) => sum + entry.quantity,
              0,
            );

            return (
              <li key={deck.id} className="rounded border p-4">
                <p className="font-medium">{deck.name}</p>
                <p className="mt-1 text-sm">
                  {deck.mode} · {deck.visibility} · {totalCards} cards
                </p>
                <Link
                  href="/deck"
                  className="mt-2 inline-block text-sm underline"
                >
                  Open your own deck builder
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

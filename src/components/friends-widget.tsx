"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Friend = {
  id: string;
  displayName: string | null;
};

export function FriendsWidget() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function loadFriends() {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/friends");
      const data = await response.json().catch(() => ({}));

      if (canceled) {
        return;
      }

      if (!response.ok) {
        setError(data.error ?? "Could not load friends");
        setLoading(false);
        return;
      }

      setFriends(Array.isArray(data.friends) ? (data.friends as Friend[]) : []);
      setLoading(false);
    }

    void loadFriends();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <section className="mlmb-panel rounded p-4">
      <h3 className="text-lg font-semibold">Friends</h3>
      {loading ? <p className="mt-3 text-sm">Loading friends...</p> : null}
      {error ? <p className="mt-3 text-sm">{error}</p> : null}
      {!loading && !error && friends.length === 0 ? (
        <p className="mt-3 text-sm">
          No friends yet. Visit Community to send requests.
        </p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {friends.slice(0, 8).map((friend) => (
          <li
            key={friend.id}
            className="mlmb-panel-soft rounded px-3 py-2 text-sm md:flex md:items-center md:justify-between"
          >
            <span>{friend.displayName?.trim() || "Unnamed player"}</span>
            <Link
              href={`/users/${friend.id}`}
              className="mt-2 inline-block text-xs font-medium underline md:mt-0"
            >
              View profile and decks
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

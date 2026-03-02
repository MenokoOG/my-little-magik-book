"use client";

import { useEffect, useMemo, useState } from "react";

type UserResult = {
  id: string;
  displayName: string | null;
};

type FriendRequestIncoming = {
  id: string;
  fromUserId: string;
  fromUser: {
    id: string;
    displayName: string | null;
  };
};

type FriendRequestOutgoing = {
  id: string;
  toUserId: string;
  toUser: {
    id: string;
    displayName: string | null;
  };
};

type Friend = {
  id: string;
  displayName: string | null;
};

export function CommunityPanel() {
  const [csrfToken, setCsrfToken] = useState("");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestIncoming[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestOutgoing[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(true);

  async function loadSocialData() {
    setLoadingSocial(true);
    const [requestsRes, friendsRes] = await Promise.all([
      fetch("/api/friend-requests"),
      fetch("/api/friends"),
    ]);

    const requestsData = await requestsRes.json().catch(() => ({}));
    const friendsData = await friendsRes.json().catch(() => ({}));

    if (!requestsRes.ok || !friendsRes.ok) {
      setStatus(
        requestsData.error ??
          friendsData.error ??
          "Could not load community data",
      );
      setLoadingSocial(false);
      return;
    }

    setIncoming(
      Array.isArray(requestsData.incoming)
        ? (requestsData.incoming as FriendRequestIncoming[])
        : [],
    );
    setOutgoing(
      Array.isArray(requestsData.outgoing)
        ? (requestsData.outgoing as FriendRequestOutgoing[])
        : [],
    );
    setFriends(
      Array.isArray(friendsData.friends)
        ? (friendsData.friends as Friend[])
        : [],
    );
    setLoadingSocial(false);
  }

  useEffect(() => {
    let canceled = false;

    async function bootstrap() {
      const meResponse = await fetch("/api/me");
      const meData = await meResponse.json().catch(() => ({}));

      if (!canceled && meResponse.ok) {
        setCsrfToken(String(meData.csrfToken ?? ""));
      }

      if (!canceled) {
        await loadSocialData();
      }
    }

    void bootstrap();

    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setLoadingUsers(true);
      const response = await fetch(
        `/api/users?query=${encodeURIComponent(trimmed)}`,
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus(data.error ?? "User search failed");
        setLoadingUsers(false);
        return;
      }

      setUsers(Array.isArray(data.users) ? (data.users as UserResult[]) : []);
      setLoadingUsers(false);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const friendsSet = useMemo(
    () => new Set(friends.map((friend) => friend.id)),
    [friends],
  );
  const incomingSet = useMemo(
    () => new Set(incoming.map((request) => request.fromUserId)),
    [incoming],
  );
  const outgoingSet = useMemo(
    () => new Set(outgoing.map((request) => request.toUserId)),
    [outgoing],
  );

  async function sendRequest(toUserId: string) {
    const response = await fetch("/api/friends/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ toUserId }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error ?? "Could not send friend request");
      return;
    }

    setStatus("Friend request sent");
    await loadSocialData();
  }

  async function respondToRequest(
    requestId: string,
    action: "accept" | "reject",
  ) {
    const response = await fetch("/api/friends/respond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ requestId, action }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error ?? "Could not update friend request");
      return;
    }

    setStatus(
      action === "accept"
        ? "Friend request accepted"
        : "Friend request rejected",
    );
    await loadSocialData();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded border p-4 lg:col-span-2">
        <h3 className="text-lg font-semibold">Find Players</h3>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by display name or email"
          className="mt-3 w-full rounded border px-3 py-2"
        />

        {loadingUsers ? (
          <p className="mt-3 text-sm">Searching users...</p>
        ) : null}
        {!loadingUsers && query.trim() && users.length === 0 ? (
          <p className="mt-3 text-sm">No users found.</p>
        ) : null}

        <ul className="mt-3 space-y-2">
          {users.map((user) => {
            const isFriend = friendsSet.has(user.id);
            const hasIncoming = incomingSet.has(user.id);
            const hasOutgoing = outgoingSet.has(user.id);

            return (
              <li
                key={user.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <span className="text-sm">
                  {user.displayName?.trim() || "Unnamed player"}
                </span>
                {isFriend ? (
                  <span className="text-xs">Friends</span>
                ) : hasIncoming ? (
                  <span className="text-xs">Incoming request</span>
                ) : hasOutgoing ? (
                  <span className="text-xs">Request sent</span>
                ) : (
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void sendRequest(user.id)}
                  >
                    Add Friend
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="rounded border p-4">
          <h3 className="text-lg font-semibold">Incoming Requests</h3>
          {loadingSocial ? (
            <p className="mt-3 text-sm">Loading requests...</p>
          ) : null}
          {!loadingSocial && incoming.length === 0 ? (
            <p className="mt-3 text-sm">No pending requests.</p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {incoming.map((request) => (
              <li key={request.id} className="rounded border px-3 py-2 text-sm">
                <p>
                  {request.fromUser.displayName?.trim() || "Unnamed player"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void respondToRequest(request.id, "accept")}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void respondToRequest(request.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border p-4">
          <h3 className="text-lg font-semibold">Friends</h3>
          {loadingSocial ? (
            <p className="mt-3 text-sm">Loading friends...</p>
          ) : null}
          {!loadingSocial && friends.length === 0 ? (
            <p className="mt-3 text-sm">No friends yet.</p>
          ) : null}

          <ul className="mt-3 space-y-2">
            {friends.map((friend) => (
              <li key={friend.id} className="rounded border px-3 py-2 text-sm">
                {friend.displayName?.trim() || "Unnamed player"}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {status ? <p className="lg:col-span-3 text-sm">{status}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { PageShell } from "@/components/page-shell";

export default function ProfilePage() {
  const [csrfToken, setCsrfToken] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function bootstrap() {
      try {
        const response = await fetch("/api/me", { signal: controller.signal });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setDisplayName(data.user?.displayName ?? "");
        setCsrfToken(data.csrfToken ?? "");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    void bootstrap();

    return () => controller.abort();
  }, []);

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ displayName }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error ?? "Could not update profile");
      return;
    }

    setStatus("Profile updated");
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus(data.error ?? "Could not change password");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setStatus("Password changed");
  }

  return (
    <div className="space-y-8">
      <PageShell
        title="Profile"
        description="Update your game username and change your password securely."
      />

      <form className="max-w-md space-y-3" onSubmit={updateProfile}>
        <h3 className="text-lg font-semibold">Game username</h3>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="w-full rounded border px-3 py-2"
          minLength={2}
          required
        />
        <button className="rounded border px-4 py-2" type="submit">
          Save username
        </button>
      </form>

      <form className="max-w-md space-y-3" onSubmit={changePassword}>
        <h3 className="text-lg font-semibold">Change password</h3>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Current password"
          required
        />
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="New password"
          minLength={8}
          required
        />
        <button className="rounded border px-4 py-2" type="submit">
          Change password
        </button>
      </form>

      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}

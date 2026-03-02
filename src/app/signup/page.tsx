"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PageShell } from "@/components/page-shell";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const trimmedDisplayName = displayName.trim();

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(trimmedDisplayName ? { displayName: trimmedDisplayName } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "Signup endpoint not found. Please restart the app and try again.",
          );
        } else {
          setError(data.error ?? "Unable to create account");
        }
        return;
      }

      const confirmation = data.message ?? "Account created successfully.";
      setSuccess(confirmation);
      router.push(
        `/login?signup=success&email=${encodeURIComponent(email.trim())}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageShell
        title="Create your account"
        description="Start collecting and organizing your favorite deck strategies."
      />
      <form className="max-w-md space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border px-3 py-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="displayName">
            Game username
          </label>
          <input
            id="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border px-3 py-2"
            required
            minLength={8}
          />
        </div>
        {error ? <p className="text-sm">{error}</p> : null}
        {success ? <p className="text-sm">{success}</p> : null}
        <button
          disabled={loading}
          className="rounded border px-4 py-2"
          type="submit"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}

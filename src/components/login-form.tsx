"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  initialEmail: string;
  nextPath: string;
};

export function LoginForm({ initialEmail, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          setError(
            "Login endpoint not found. Please restart the app and try again.",
          );
        } else {
          setError(data.error ?? "Unable to sign in");
        }
        return;
      }

      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  }

  return (
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
        />
      </div>
      {error ? <p className="text-sm">{error}</p> : null}
      <button
        disabled={loading}
        className="rounded border px-4 py-2"
        type="submit"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

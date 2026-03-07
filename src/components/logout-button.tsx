"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CSRF_COOKIE_NAME } from "@/lib/auth/constants";

function getCookie(name: string) {
  const prefix = `${name}=`;
  const parts = document.cookie.split(";").map((item) => item.trim());
  const found = parts.find((item) => item.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : "";
}

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);

    try {
      let csrfToken = getCookie(CSRF_COOKIE_NAME);

      if (!csrfToken) {
        const meResponse = await fetch("/api/me");
        const mePayload = await meResponse.json().catch(() => ({}));
        csrfToken = mePayload.csrfToken ?? "";
      }

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });

      if (!response.ok) {
        return;
      }

      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="mlmb-focus-ring rounded-xl border border-rose-400/80 bg-rose-100/85 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/50 dark:text-rose-100 dark:hover:bg-rose-900/70"
      onClick={onLogout}
      disabled={loading}
      type="button"
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}

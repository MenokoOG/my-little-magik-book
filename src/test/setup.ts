import { beforeEach, vi } from "vitest";

import { clearTestCookies, getTestCookieStore } from "@/test/cookie-store";

vi.mock("next/headers", () => {
    return {
        cookies: async () => getTestCookieStore(),
        headers: async () => new Headers(),
    };
});

beforeEach(() => {
    clearTestCookies();
});

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { CSRF_COOKIE_NAME } from "@/lib/auth/constants";

export function createCsrfToken() {
    return randomBytes(24).toString("base64url");
}

export async function ensureCsrfCookie() {
    const cookieStore = await cookies();
    const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (existing) {
        return existing;
    }

    const token = createCsrfToken();
    cookieStore.set(CSRF_COOKIE_NAME, token, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
    });

    return token;
}

export async function validateCsrf(request: Request) {
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get("x-csrf-token");
    return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

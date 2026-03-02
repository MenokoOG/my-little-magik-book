import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPaths = ["/home", "/explore", "/deck", "/profile", "/community", "/users"];

function applySecurityHeaders(response: NextResponse) {
    const isDevelopment = process.env.NODE_ENV !== "production";
    const scriptSrc = isDevelopment
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'";
    const connectSrc = isDevelopment
        ? "connect-src 'self' https://api.magicthegathering.io ws: wss:"
        : "connect-src 'self' https://api.magicthegathering.io";

    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "img-src 'self' data: https:",
            "style-src 'self' 'unsafe-inline'",
            scriptSrc,
            connectSrc,
            "font-src 'self' data:",
            "object-src 'none'",
            "base-uri 'self'",
            "frame-ancestors 'none'",
            "form-action 'self'",
        ].join("; "),
    );

    return response;
}

export function middleware(request: NextRequest) {
    const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const isProtected = protectedPaths.some(
        (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
    );

    if (isProtected && !hasSessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", request.nextUrl.pathname);
        return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    return applySecurityHeaders(NextResponse.next());
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { validateCsrf } from "@/lib/auth/csrf";
import { invalidateSessionByToken } from "@/lib/auth/session";
import { forbidden } from "@/lib/http/responses";

export async function POST(request: Request) {
    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    const token = match?.[1];

    await invalidateSessionByToken(token);

    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return response;
}

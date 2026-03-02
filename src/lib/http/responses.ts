import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";

export function badRequest(message: string) {
    return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
    return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
    return NextResponse.json({ error: message }, { status: 403 });
}

export function tooManyRequests(retryAfterSeconds: number) {
    return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
            status: 429,
            headers: {
                "Retry-After": String(retryAfterSeconds),
            },
        },
    );
}

export async function requireAuthenticatedUser() {
    const user = await getSessionUser();
    return user;
}

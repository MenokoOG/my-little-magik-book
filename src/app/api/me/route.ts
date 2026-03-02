import { NextResponse } from "next/server";

import { ensureCsrfCookie } from "@/lib/auth/csrf";
import { db } from "@/lib/db";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { validateCsrf } from "@/lib/auth/csrf";
import { UpdateMeSchema } from "@/lib/validation/user";

export async function GET() {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const csrfToken = await ensureCsrfCookie();

    return NextResponse.json({ user, csrfToken }, { status: 200 });
}

export async function PATCH(request: Request) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = UpdateMeSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const updatedUser = await db.user.update({
        where: { id: user.id },
        data: { displayName: parsed.data.displayName },
        select: {
            id: true,
            email: true,
            displayName: true,
        },
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
}

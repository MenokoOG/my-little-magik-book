import { NextResponse } from "next/server";

import { validateCsrf } from "@/lib/auth/csrf";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { db } from "@/lib/db";
import { ChangePasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
    const authUser = await requireAuthenticatedUser();

    if (!authUser) {
        return unauthorized();
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = ChangePasswordSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const user = await db.user.findUnique({ where: { id: authUser.id } });

    if (!user) {
        return unauthorized();
    }

    const isCurrentValid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);

    if (!isCurrentValid) {
        return badRequest("Current password is incorrect");
    }

    await db.user.update({
        where: { id: authUser.id },
        data: {
            passwordHash: await hashPassword(parsed.data.newPassword),
        },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
}

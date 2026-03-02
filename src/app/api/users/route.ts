import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import {
    badRequest,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { UserSearchQuerySchema } from "@/lib/validation/community";

export async function GET(request: Request) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const parsed = UserSearchQuerySchema.safeParse({
        query: searchParams.get("query") ?? undefined,
    });

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid query");
    }

    const query = parsed.data.query?.trim();

    const users = await db.user.findMany({
        where: {
            id: { not: user.id },
            ...(query
                ? {
                    OR: [
                        {
                            displayName: {
                                contains: query,
                                mode: "insensitive",
                            },
                        },
                        {
                            email: {
                                contains: query,
                                mode: "insensitive",
                            },
                        },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            displayName: true,
        },
        orderBy: {
            createdAt: "desc",
        },
        take: 25,
    });

    return NextResponse.json({ users }, { status: 200 });
}

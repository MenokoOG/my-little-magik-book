import { z } from "zod";

export const UserSearchQuerySchema = z.object({
    query: z.string().trim().max(80).optional(),
});

export const FriendRequestCreateSchema = z.object({
    toUserId: z.string().trim().uuid(),
});

export const FriendRequestRespondSchema = z.object({
    requestId: z.string().trim().uuid(),
    action: z.enum(["accept", "reject"]),
});

import { describe, expect, it, beforeEach } from "vitest";

import { POST as signupPost } from "@/app/api/auth/signup/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as changePasswordPost } from "@/app/api/auth/change-password/route";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { authenticateAs, createUserWithDecks, setCsrfToken } from "@/test/auth-test-utils";
import { resetDatabase } from "@/test/db";

describe("auth integration", () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it("signs up and logs in a user", async () => {
        const email = `auth-${Date.now()}@example.com`;

        const signupResponse = await signupPost(
            new Request("http://localhost/api/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: "Password123!",
                    displayName: "Auth User",
                }),
                headers: { "content-type": "application/json" },
            }),
        );

        expect(signupResponse.status).toBe(201);

        const loginResponse = await loginPost(
            new Request("http://localhost/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: "Password123!",
                }),
                headers: { "content-type": "application/json" },
            }),
        );

        expect(loginResponse.status).toBe(200);
        const loginPayload = await loginResponse.json();
        expect(loginPayload.user.email).toBe(email);
    });

    it("changes password with valid auth and csrf", async () => {
        const email = `change-${Date.now()}@example.com`;
        const user = await createUserWithDecks({
            email,
            password: "Password123!",
            displayName: "Change Password User",
        });

        await authenticateAs(user.id);
        setCsrfToken("test-csrf");

        const response = await changePasswordPost(
            new Request("http://localhost/api/auth/change-password", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-csrf-token": "test-csrf",
                },
                body: JSON.stringify({
                    currentPassword: "Password123!",
                    newPassword: "StrongerPassword456!",
                }),
            }),
        );

        expect(response.status).toBe(200);

        const updated = await db.user.findUnique({ where: { id: user.id } });
        expect(updated).not.toBeNull();
        expect(
            await verifyPassword(updated?.passwordHash ?? "", "StrongerPassword456!"),
        ).toBe(true);
    });
});

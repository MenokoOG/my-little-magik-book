import argon2 from "argon2";

export async function hashPassword(plainPassword: string) {
    return argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
    });
}

export async function verifyPassword(hash: string, plainPassword: string) {
    return argon2.verify(hash, plainPassword);
}

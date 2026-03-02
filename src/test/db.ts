import { db } from "@/lib/db";

export async function resetDatabase() {
    await db.deckCard.deleteMany();
    await db.deck.deleteMany();
    await db.friendRequest.deleteMany();
    await db.session.deleteMany();
    await db.user.deleteMany();
}

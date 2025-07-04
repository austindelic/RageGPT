import { eq } from "drizzle-orm";
import { db } from "../index";
import { sessionTable, userTable } from "$db/schema";
import type { SessionNullable, Session } from "$schema_types";

export async function createSession(
  session_data: Session,
): Promise<SessionNullable | null> {
  const [session] = await db
    .insert(sessionTable)
    .values(session_data)
    .returning();
  return session ?? null;
}

export async function updateSessionExpirydate(
  new_expiery_date: Date,
  session_id: string,
): Promise<void> {
  await db
    .update(sessionTable)
    .set({
      expires_at: new_expiery_date,
    })
    .where(eq(sessionTable.id, session_id));
}

export async function selectSessionFromIdWithUser(session_id: string) {
  const result = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.user_id, userTable.id))
    .where(eq(sessionTable.id, session_id));
  return result ?? null;
}

export async function deleteSessionFromId(session_id: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.id, session_id));
}

export async function deleteSessionsFromUserId(user_id: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.user_id, user_id));
}

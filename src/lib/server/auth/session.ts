import { sessionTable } from "$db/schema";
import type { User, Session } from "$schema_types";
import { eq } from "drizzle-orm";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { db } from "$db/index";
import {
  createSession as createSessionQuery,
  selectSessionFromIdWithUser,
  updateSessionExpirydate,
  deleteSessionFromId,
} from "$db/queries/session";
import { cookies } from "next/headers";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const raw_token = encodeBase32LowerCaseNoPadding(bytes);
  const token = encodeHexLowerCase(sha256(new TextEncoder().encode(raw_token)));
  return token;
}

export async function createSession(user_id: string): Promise<Session> {
  const token = generateSessionToken();
  const session = {
    id: token,
    user_id,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  } as Session;
  await createSessionQuery(session);
  return session;
}

export async function validateSessionToken(
  token: string,
): Promise<SessionValidationResult> {
  const result = await selectSessionFromIdWithUser(token);
  if (result.length < 1) {
    return { session: null, user: null };
  }
  const { user, session } = result[0];
  if (Date.now() >= session.expires_at.getTime()) {
    await deleteSessionFromId(session.id);
    return { session: null, user: null };
  }
  if (Date.now() >= session.expires_at.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    updateSessionExpirydate(session.expires_at, session.id);
  }
  return { session, user };
}

export async function invalidateSession(token: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.id, token));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.user_id, userId));
}

export async function getCurrentSession(): Promise<SessionValidationResult> {
  const currentState = await cookies();
  const token = currentState.get("session")?.value ?? null;
  if (token === null) {
    return { session: null, user: null };
  }
  const result = await validateSessionToken(token);
  return result;
}

export async function setSessionTokenCookie(session_data: Session) {
  const currentState = await cookies();
  currentState.set("session", session_data.id, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: session_data.expires_at,
  });
}

export async function deleteSessionTokenCookie() {
  const currentState = await cookies();
  currentState.set("session", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

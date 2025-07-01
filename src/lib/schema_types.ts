import type { InferSelectModel } from "drizzle-orm";
import * as schema from "$db/schema";

type Nullable<T> = { [P in keyof T]: T[P] | null };

// Users
export type User = InferSelectModel<typeof schema.userTable>;
export type UserDraft = Omit<User, "id" | "created_at" | "last_updated">;
export type UserNullable = Nullable<User>;

// Sessions
export type Session = InferSelectModel<typeof schema.sessionTable>;
export type SessionDraft = Session; // No `id`, no timestamps in schema
export type SessionNullable = Nullable<Session>;

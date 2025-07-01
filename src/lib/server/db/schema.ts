import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";

const timestamps = {
  created_at: timestamp("created_at").defaultNow(),
  last_updated: timestamp("last_updated").defaultNow(),
};

const baseFields = {
  id: uuid("id").defaultRandom().primaryKey(),
  ...timestamps,
};

export const userTable = pgTable("user", {
  ...baseFields,
  username: text("username").notNull(),
  email: text("email"),
  github_id: integer("github_id").unique().notNull(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  expires_at: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ...timestamps,
});

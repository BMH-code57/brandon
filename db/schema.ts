import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const secretAttempts = sqliteTable("secret_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull(),
  windowStart: integer("window_start").notNull(),
});

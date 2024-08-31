import { blob, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const email = sqliteTable("email", {
	email: text("email").primaryKey(),
	banned: integer("banned", { mode: "boolean" }).notNull().default(false),
	verified: integer("verified", { mode: "boolean" }).notNull().default(false),
	code: text("code"),
});

export const user = sqliteTable("user", {
	id: blob("id", { mode: "bigint" }).primaryKey(),
	email: text("email")
		.notNull()
		.unique()
		.references(() => email.email),
});

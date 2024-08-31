import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import invariant from "tiny-invariant";

invariant(process.env.TURSO_DATABASE_URL, "Database URL must be defined!");

const client = createClient({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client);

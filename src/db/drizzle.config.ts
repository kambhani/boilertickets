import { defineConfig } from "drizzle-kit";
import invariant from "tiny-invariant";

invariant(process.env.TURSO_DATABASE_URL, "Database URL must be defined!");

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db/migrations",
	driver: "turso",
	dialect: "sqlite",
	dbCredentials: {
		url: process.env.TURSO_DATABASE_URL,
		authToken: process.env.TURSO_AUTH_TOKEN,
	},
});

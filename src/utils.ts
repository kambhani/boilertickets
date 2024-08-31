import type { Guild } from "discord.js";
import invariant from "tiny-invariant";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { and, eq } from "drizzle-orm";

// Given a user id and guild, remove the access role from the user
// Also removes the user from the database
export const removeUser = async (guild: Guild, id: bigint) => {
	// Assert that the role id is defined
	invariant(process.env.ROLE_ID, "Role ID must be defined!");

	// Get the member object
	const member = guild.members.cache.get(id.toString());
	if (!member) return;

	// Remove their role
	if (member.roles.cache.has(process.env.ROLE_ID)) {
		await member.roles.remove(process.env.ROLE_ID);
	}

	// Remove the user from the database
	await db.delete(schema.user).where(eq(schema.user.id, id));
};

export const addUser = async (guild: Guild, id: bigint, email: string) => {
	// Assert that the role id is defined
	invariant(process.env.ROLE_ID, "Role ID must be defined!");

	// Get the member object
	const member = guild.members.cache.get(id.toString());
	if (!member) return;

	// Add their role
	if (!member.roles.cache.has(process.env.ROLE_ID)) {
		await member.roles.add(process.env.ROLE_ID);
	}

	// Remove the current user associated with the email address
	const cur_user = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.email, email))
		.limit(1);
	if (cur_user.length > 0) {
		await removeUser(guild, cur_user[0].id);
	}

	// Add the user from the database
	await db
		.insert(schema.user)
		.values({
			id: id,
			email: email,
		})
		.onConflictDoUpdate({
			target: schema.user.id,
			set: {
				email: email,
			},
		});
};

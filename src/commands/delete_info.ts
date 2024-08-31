import {
	type ChatInputCommandInteraction,
	GuildMember,
	SlashCommandBuilder,
	User,
} from "discord.js";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { removeUser } from "~/utils";

const cooldown = 60;

const data = new SlashCommandBuilder()
	.setName("delete_info")
	.setDescription("Delete your information from the database");

const execute = async (interaction: ChatInputCommandInteraction) => {
	const { guild, member } = interaction;

	invariant(guild, "Guild must be defined!");
	invariant(member instanceof GuildMember, "Member must be valid!");

	// Get the user to remove
	const users = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.id, BigInt(member.id)))
		.limit(1);

	// If the user doesn't exist in the database, return
	if (users.length === 0) {
		await interaction.reply({
			content: "You are not present in the database!",
			ephemeral: true,
		});
		return;
	}

	// Remove the user from the user table
	await removeUser(guild, users[0].id);

	// Remove the user email from the database
	await db.delete(schema.email).where(eq(schema.email.email, users[0].email));

	await interaction.reply({
		content: "Your information has been removed from the database",
		ephemeral: true,
	});
};

export { cooldown, data, execute };

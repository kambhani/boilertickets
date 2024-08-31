import {
	type ChatInputCommandInteraction,
	GuildMember,
	PermissionFlagsBits,
	SlashCommandBuilder,
	User,
} from "discord.js";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";

const cooldown = 86400;

const data = new SlashCommandBuilder()
	.setName("purge_users")
	.setDescription("Purge all users and emails from the database")
	.addBooleanOption((option) => {
		return option
			.setName("include_banned_emails")
			.setDescription("Whether banned emails should also be purged")
			.setRequired(true);
	})
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setDMPermission(false);

const execute = async (interaction: ChatInputCommandInteraction) => {
	const { guild, member } = interaction;

	invariant(guild, "Guild must be defined!");
	invariant(member instanceof GuildMember, "Member must be valid!");

	const include_banned_emails = interaction.options.getBoolean(
		"include_banned_emails",
	);
	invariant(
		include_banned_emails !== null,
		"include_banned_emails must be defined!",
	);

	// Delete all users from the table
	await db.delete(schema.user);

	// Delete all emails from the database
	// We may keep banned emails if the user wants to
	if (include_banned_emails) {
		await db.delete(schema.email);
	} else {
		await db.delete(schema.email).where(eq(schema.email.banned, false));
	}

	await interaction.reply({
		content: "Database purged!",
		ephemeral: true,
	});
};

export { cooldown, data, execute };

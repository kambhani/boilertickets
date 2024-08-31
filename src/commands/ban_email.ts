import {
	type ChatInputCommandInteraction,
	GuildMember,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { removeUser } from "~/utils";

const cooldown = 60;

const data = new SlashCommandBuilder()
	.setName("ban_email")
	.setDescription("Ban an email from registration")
	.addStringOption((option) => {
		return option
			.setName("email")
			.setDescription("The email address to send the code to")
			.setRequired(true);
	})
	.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

const execute = async (interaction: ChatInputCommandInteraction) => {
	const { guild, member } = interaction;

	invariant(guild, "Guild must be defined!");
	invariant(member instanceof GuildMember, "Member must be valid!");
	invariant(process.env.EMAIL_DOMAIN, "Valid email domain must be defined!");

	const email = interaction.options.getString("email");
	invariant(email, "Email must be defined!");

	if (!email.endsWith(process.env.EMAIL_DOMAIN)) {
		await interaction.reply({
			content: `Email must end with \`${process.env.EMAIL_DOMAIN}\``,
			ephemeral: true,
		});
		return;
	}

	// Check if there is a user associated with the email address
	const users = await db
		.select()
		.from(schema.user)
		.where(eq(schema.user.email, email))
		.limit(1);

	// If there is a user associated with the address, remove them
	if (users.length > 0) {
		await removeUser(guild, users[0].id);
	}

	// Mark the email as banned
	await db
		.insert(schema.email)
		.values({
			email: email,
			banned: true,
		})
		.onConflictDoUpdate({
			target: schema.email.email,
			set: {
				banned: true,
				verified: false,
				code: null,
			},
		});

	await interaction.reply({
		content: `${email} has been banned from registration`,
		ephemeral: true,
	});
};

export { cooldown, data, execute };

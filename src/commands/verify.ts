import {
	type ChatInputCommandInteraction,
	GuildMember,
	SlashCommandBuilder,
	User,
} from "discord.js";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { and, eq } from "drizzle-orm";
import invariant from "tiny-invariant";
import { addUser } from "~/utils";

const cooldown = 600;

const data = new SlashCommandBuilder()
	.setName("verify")
	.setDescription("Verify your email address")
	.addStringOption((option) => {
		return option
			.setName("email")
			.setDescription("The email address associated with the verification code")
			.setRequired(true);
	})
	.addStringOption((option) => {
		return option
			.setName("code")
			.setDescription("The verification code")
			.setRequired(true);
	})
	.setDMPermission(false);

const execute = async (interaction: ChatInputCommandInteraction) => {
	const { guild, member } = interaction;

	invariant(guild, "Guild must be defined!");
	invariant(member instanceof GuildMember, "Member must be valid!");
	invariant(process.env.EMAIL_DOMAIN, "Valid email domain must be defined!");
	invariant(process.env.NAME, "Name must be defined!");

	const email = interaction.options.getString("email");
	invariant(email, "Email must be defined!");
	const code = interaction.options.getString("code");
	invariant(code, "Code must be defined!");

	if (!email.endsWith(process.env.EMAIL_DOMAIN)) {
		await interaction.reply({
			content: `Email must end with ${process.env.EMAIL_DOMAIN}`,
			ephemeral: true,
		});
		return;
	}

	// Get the record from the database
	const record = await db
		.select()
		.from(schema.email)
		.where(and(eq(schema.email.email, email), eq(schema.email.code, code)))
		.limit(1);

	// If the record doesn't exist, it is an invalid code so we return
	if (record.length === 0) {
		await interaction.reply({
			content: "Invalid verification code!",
			ephemeral: true,
		});
		return;
	}

	// Set the email to be verified
	await db
		.update(schema.email)
		.set({
			verified: true,
			code: null,
		})
		.where(eq(schema.email.email, email));

	// Add the user to the database
	await addUser(guild, BigInt(member.id), email);

	await interaction.reply({
		content: "You have been verified!",
		ephemeral: true,
	});
};

export { cooldown, data, execute };

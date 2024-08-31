import {
	type ChatInputCommandInteraction,
	GuildMember,
	SlashCommandBuilder,
	User,
} from "discord.js";
import { db } from "~/db/db";
import * as schema from "~/db/schema";
import { eq } from "drizzle-orm";
import { transporter } from "~/mail";
import invariant from "tiny-invariant";

const cooldown = 600;

const data = new SlashCommandBuilder()
	.setName("get_code")
	.setDescription("Sends a verification code to the provided email")
	.addStringOption((option) => {
		return option
			.setName("email")
			.setDescription("The email address to send the code to")
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

	if (!email.endsWith(process.env.EMAIL_DOMAIN)) {
		await interaction.reply({
			content: `Email must end with \`${process.env.EMAIL_DOMAIN}\``,
			ephemeral: true,
		});
		return;
	}

	// If the email is banned, do not proceed with the verification
	const existing_record = await db
		.select()
		.from(schema.email)
		.where(eq(schema.email.email, email));
	if (existing_record.length > 0 && existing_record[0].banned) {
		await interaction.reply({
			content: "Email has been banned, register with a different email!",
			ephemeral: true,
		});
		return;
	}

	// Generate the verification code
	const code = crypto.randomUUID();

	// Send the email
	await transporter.sendMail({
		from: `"${process.env.NAME}" ${process.env.EMAIL_SENDER}`,
		to: email,
		subject: `${process.env.NAME} Discord Verification Code`,
		text: `Your verification code is ${code}. Use /verify in the server to complete the verification process.`,
	});

	// Add the code to the
	await db
		.insert(schema.email)
		.values({
			email: email,
			banned: false,
			verified: false,
			code: code,
		})
		.onConflictDoUpdate({
			target: schema.email.email,
			set: {
				code: code,
			},
		});

	await interaction.reply({
		content: "Verification email has been sent!",
		ephemeral: true,
	});
};

export { cooldown, data, execute };

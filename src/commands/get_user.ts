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

const cooldown = 60;

const data = new SlashCommandBuilder()
	.setName("get_user")
	.setDescription("Provides information about the given user")
	.addUserOption((option) => {
		return option
			.setName("user")
			.setDescription("The user to query")
			.setRequired(true);
	});

const execute = async (interaction: ChatInputCommandInteraction) => {
	await interaction.deferReply({
		ephemeral: true,
	});

	try {
		const { guild, member } = interaction;

		invariant(guild, "Guild must be defined!");
		invariant(member instanceof GuildMember, "Member must be valid!");

		const queried_user = interaction.options.getUser("user");
		invariant(queried_user instanceof User, "Queried user must be defined!");

		const users = await db
			.select()
			.from(schema.user)
			.where(eq(schema.user.id, BigInt(queried_user.id)))
			.limit(1);

		if (users.length > 0) {
			await interaction.editReply(
				`User ${queried_user} has email ${users[0].email}`,
			);
		} else {
			await interaction.editReply(
				`User ${queried_user} does not exist in the database`,
			);
		}
	} catch (err) {
		await interaction.editReply(`${err}`);
	}
};

export { cooldown, data, execute };

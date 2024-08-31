import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import fs from "node:fs";

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Store the commands in an object
client.commands = new Collection();

// Store the cooldowns in an object
client.cooldowns = new Collection();

// listen for the client to be ready
client.once(Events.ClientReady, (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Create the commands
const commandFiles = fs
	.readdirSync(new URL("./commands", import.meta.url))
	.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
	import(new URL(`./commands/${file}`, import.meta.url).toString())
		.then((command) => {
			// Set a new item in the Collection with the key as the command name and the value as the exported module
			if ("data" in command && "execute" in command) {
				client.commands.set(command.data.name, command);
			} else {
				console.warn(
					`[WARNING] The command from file ${file} is missing a required "data" or "execute" property.`,
				);
			}
		})
		.catch((err) => {
			console.error(err);
			console.warn(
				`[WARNING] The command from file ${file} could not be loaded.`,
			);
		});
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	if (!command.cooldown) {
		console.error(`Command ${command} must have a cooldown set!`);
		return;
	}

	const { cooldowns } = interaction.client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 60;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({
				content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
				ephemeral: true,
			});
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: "There was an error while executing this command!",
				ephemeral: true,
			});
		}
	}
});

// login with the token from .env.local
client.login(process.env.BOT_TOKEN);

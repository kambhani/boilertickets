// Load necessary modules
import { REST, Routes } from "discord.js";
import fs from "node:fs";
import { exit } from "node:process";

// Load the necessary environment variables
const token = process.env.BOT_TOKEN ?? "TOKEN";
const clientId = process.env.CLIENT_ID ?? "CLIENT_ID";

// Store all the import promises
const promises = [];

// Grab all the command files from the commands directory you created earlier
const commands: JSON[] = [];
const commandsPath = "commands";
const commandFiles = fs
	.readdirSync(`./src/${commandsPath}`)
	.filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
	const filePath = `./${commandsPath}/${file}`;
	promises.push(
		import(filePath)
			.then((command) => {
				// Set a new item in the Collection with the key as the command name and the value as the exported module
				if ("data" in command && "execute" in command) {
					commands.push(command.data.toJSON());
				} else {
					console.warn(
						`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
					);
				}
			})
			.catch((err) => {
				console.error(err);
				console.warn(
					`[WARNING] The command at ${filePath} could not be loaded.`,
				);
			}),
	);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
Promise.all(promises).then(() => {
	(async () => {
		try {
			console.log(
				`Started refreshing ${commands.length} application (/) commands.`,
			);

			// The put method is used to fully refresh all commands in the guild with the current set
			const data = await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});

			console.log(
				`Successfully reloaded ${(data as []).length} application (/) commands.`,
			);
			exit(0);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
});

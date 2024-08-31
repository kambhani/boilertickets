import { Client, type Collection } from "discord.js";

declare module "discord.js" {
	interface Client {
		commands: Collection;
		cooldowns: Collection;
	}
}

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const setupInteractionHandler = require("./events/interactionHandler");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

setupInteractionHandler(client);

client.login(process.env.DISCORD_TOKEN);
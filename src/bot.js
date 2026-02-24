require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`🔥 Bot connecté : ${client.user.tag}`);
});

require("./events/interactionHandler")(client);

client.login(process.env.DISCORD_TOKEN);
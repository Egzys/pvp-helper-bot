const http = require('http');

// Petit serveur pour que Render soit content
http.createServer((req, res) => {
  res.write("La poutre est en ligne, fada !");
  res.end();
}).listen(8080);

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", () => {
  console.log(`🔥 Bot connecté : ${client.user.tag}`);
});

require("./events/interactionHandler")(client);

client.login(process.env.DISCORD_TOKEN);
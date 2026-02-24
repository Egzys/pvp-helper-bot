// deploy-commands.js
require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("pvp-create")
    .setDescription("Créer un event PvP")
    .addStringOption(o => o.setName("name").setDescription("Nom de l'event").setRequired(true)),
  
  new SlashCommandBuilder()
    .setName("pvp-clear")
    .setDescription("Vider la liste d'un event")
    .addStringOption(o => o.setName("name").setDescription("Nom de l'event à reset").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const guildIds = process.env.GUILD_ID.split(",").map(id => id.trim());
    console.log("Début du déploiement des commandes...");

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ Commandes déployées pour le serveur : ${guildId}`);
    }
    console.log("C'est bon, tout est en place, fada !");
  } catch (error) {
    console.error("Erreur de déploiement :", error);
  }
})();
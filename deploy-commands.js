require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("pvp-create")
    .setDescription("Créer un event PvP")
    .addStringOption(o => o.setName("name").setDescription("Nom").setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    // On transforme ta chaîne de caractères en un tableau d'IDs
    // On utilise .split(",") pour séparer et .trim() pour enlever les espaces
    const guildIds = process.env.GUILD_ID.split(",").map(id => id.trim());

    console.log("Début du déploiement des commandes...");

    // On boucle sur chaque ID de serveur
    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`✅ Commandes déployées pour le serveur : ${guildId}`);
    }

    console.log("C'est bon, tout est en place, fada !");
  } catch (error) {
    console.error("Oh fan, y'a une erreur :", error);
  }
})();
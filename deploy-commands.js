require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("pvp-create")
    .setDescription("Créer un event PvP")
    .addStringOption((o) =>
      o.setName("name").setDescription("Nom de l'event").setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Mode PvP")
        .setRequired(true)
        .addChoices(
          { name: "RBG", value: "RBG" },
          { name: "Solo Shuffle", value: "Solo Shuffle" },
          { name: "3v3", value: "3v3" },
          { name: "2v2", value: "2v2" }
        )
    )
    .addStringOption((o) =>
      o
        .setName("date")
        .setDescription("Date de l'event au format YYYY-MM-DD HH:mm")
        .setRequired(true)
    )
    .addIntegerOption((o) =>
      o
        .setName("duration")
        .setDescription("Durée en minutes (défaut: 120)")
        .setMinValue(15)
        .setMaxValue(720)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("pvp-delete")
    .setDescription("Supprimer un event PvP par ID")
    .addIntegerOption((o) =>
      o.setName("id").setDescription("ID de l'event").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pvp-list")
    .setDescription("Afficher la liste des events")
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Filtrer par mode")
        .setRequired(false)
        .addChoices(
          { name: "Tous", value: "ALL" },
          { name: "RBG", value: "RBG" },
          { name: "Solo Shuffle", value: "Solo Shuffle" },
          { name: "3v3", value: "3v3" },
          { name: "2v2", value: "2v2" }
        )
    ),

  new SlashCommandBuilder()
    .setName("pvp-show")
    .setDescription("Afficher les détails d'un event")
    .addIntegerOption((o) =>
      o.setName("id").setDescription("ID de l'event").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pvp-clean-expired")
    .setDescription("Supprimer manuellement tous les events expirés"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const guildIds = process.env.GUILD_ID.split(",").map((id) => id.trim());

    console.log("Début du déploiement des commandes...");

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands }
      );
      console.log(`Commandes déployées pour le serveur : ${guildId}`);
    }

    console.log("Déploiement terminé.");
  } catch (error) {
    console.error("Erreur de déploiement :", error);
  }
})();
require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const modeChoices = [
  { name: "RBG", value: "RBG" },
  { name: "Solo Shuffle", value: "Solo Shuffle" },
  { name: "3v3", value: "3v3" },
  { name: "2v2", value: "2v2" },
];

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
        .addChoices(...modeChoices)
    )
    .addStringOption((o) =>
      o
        .setName("date")
        .setDescription("Date au format YYYY-MM-DD HH:mm")
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
    .setName("pvp-edit")
    .setDescription("Modifier un event existant")
    .addIntegerOption((o) =>
      o.setName("id").setDescription("ID de l'event").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("name").setDescription("Nouveau nom").setRequired(false)
    )
    .addStringOption((o) =>
      o
        .setName("mode")
        .setDescription("Nouveau mode PvP")
        .setRequired(false)
        .addChoices(...modeChoices)
    )
    .addStringOption((o) =>
      o
        .setName("date")
        .setDescription("Nouvelle date au format YYYY-MM-DD HH:mm")
        .setRequired(false)
    )
    .addIntegerOption((o) =>
      o
        .setName("duration")
        .setDescription("Nouvelle durée en minutes")
        .setMinValue(15)
        .setMaxValue(720)
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("pvp-delete")
    .setDescription("Supprimer un event par ID")
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
        .addChoices({ name: "Tous", value: "ALL" }, ...modeChoices)
    ),

  new SlashCommandBuilder()
    .setName("pvp-show")
    .setDescription("Afficher un event précis")
    .addIntegerOption((o) =>
      o.setName("id").setDescription("ID de l'event").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pvp-clean-expired")
    .setDescription("Supprimer manuellement les events expirés"),

  new SlashCommandBuilder()
    .setName("pvp-export")
    .setDescription("Exporter le JSON du serveur actuel"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Commandes globales déployées.");
  } catch (error) {
    console.error("Erreur de déploiement :", error);
  }
})();
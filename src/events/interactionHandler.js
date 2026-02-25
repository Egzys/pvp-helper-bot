// interactionHandler.js
const { 
  ModalBuilder, 
  TextInputBuilder, 
  ActionRowBuilder, 
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

// On utilise un objet pour séparer les inscrits par nom d'événement
let eventsData = {}; 

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    // --- 1. COMMANDES SLASH ---
    if (interaction.isChatInputCommand()) {
      
      // CRÉATION D'EVENT
      if (interaction.commandName === "pvp-create") {
        const eventName = interaction.options.getString("name");
        
        // On initialise l'entrée dans notre objet s'il n'existe pas
        eventsData[eventName] = [];

        const embed = new EmbedBuilder()
          .setTitle(`⚔️ PvP Event: ${eventName}`)
          .setDescription("Inscrivez-vous pour le combat ! ")
          .setColor("#1927a3")
          .addFields(
            { name: "👥 Participants", value: "Aucun inscrit" },
            { name: "⚠️ IMPORTANT ", value: "Renseignez votre classe en Français ( guerrier, mage, pretre, druide, voleur, chasseur, demoniste, paladin, chaman, moine, demonhunter, evoker )"}
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`heal_${eventName}`).setLabel("💚 Heal").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(`dps_${eventName}`).setLabel("⚔️ DPS").setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }

      // SUPPRESSION / RESET D'EVENT
      if (interaction.commandName === "pvp-clear") {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
          return interaction.reply({ content: "Tu n'as pas les droits, mon gâté !", ephemeral: true });
        }

        const eventName = interaction.options.getString("name");
        
        if (eventsData[eventName]) {
          delete eventsData[eventName]; // On supprime l'entrée
          return interaction.reply({ content: `✅ La liste pour **${eventName}** a été vidée !`, ephemeral: true });
        } else {
          return interaction.reply({ content: "⚠️ Cet événement n'existe pas dans la mémoire.", ephemeral: true });
        }
      }
    }

    // --- 2. CLIC SUR BOUTON ---
    if (interaction.isButton()) {
      const [role, eventName] = interaction.customId.split("_");

      const modal = new ModalBuilder()
        .setCustomId(`signup_${eventName}_${role}`)
        .setTitle(`Inscription : ${eventName}`);

      const charInput = new TextInputBuilder().setCustomId("character").setLabel("Nom du perso").setStyle(TextInputStyle.Short).setRequired(true);
      const classInput = new TextInputBuilder().setCustomId("class").setLabel("Classe (en Français)").setStyle(TextInputStyle.Short).setRequired(true);
      const ratingInput = new TextInputBuilder().setCustomId("rating").setLabel("Rating (0-3000)").setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(charInput),
        new ActionRowBuilder().addComponents(classInput),
        new ActionRowBuilder().addComponents(ratingInput)
      );
      return interaction.showModal(modal);
    }

    // --- 3. VALIDATION MODAL ---
    if (interaction.isModalSubmit()) {
      const [_, eventName, role] = interaction.customId.split("_");
      const character = interaction.fields.getTextInputValue("character");
      const classe = interaction.fields.getTextInputValue("class");
      const rating = parseInt(interaction.fields.getTextInputValue("rating"));

      if (isNaN(rating)) return interaction.reply({ content: "❌ Rating invalide", ephemeral: true });

      // Sécurité : si l'event n'est pas initialisé
      if (!eventsData[eventName]) eventsData[eventName] = [];

      // Ajout unique à cet event
      eventsData[eventName].push({ character, class: classe, rating, role });

      let list = eventsData[eventName].map(p =>
        `${emojiClass(p.class)} **${p.character}** - ${p.role.toUpperCase()} - 🏆 ${p.rating}`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ PvP Event: ${eventName}`)
        .setColor("#1927a3")
        .addFields(
          { name: "👥 Participants", value: list || "Aucun inscrit" },
          { name: "⚠️ IMPORTANT ", value: "Renseignez votre classe en Français ( guerrier, mage, pretre, druide, voleur, chasseur, demoniste, paladin, chaman, moine, demonhunter, evoker )"}
        );

      await interaction.update({ embeds: [embed] });
    }
  });
};

function emojiClass(cls) {
  const map = { guerrier: "⚔️ Guerrier", mage: "❄️ Mage", pretre: "✝️ Prêtre", druide: "🌿 Druide", voleur: "🗡️ Voleur", chasseur: "🏹 Chasseur", demoniste: "🔥 Démoniste", paladin: "🛡️ Paladin", chaman: "🌩️ Chaman", monk: "🥋 Moine", demonhunter: "😈 DH", evoker: "🐉 Evoker" };
  return map[cls.toLowerCase()] || "🎮";
}
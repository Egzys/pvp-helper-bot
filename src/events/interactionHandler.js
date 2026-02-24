const { 
  ModalBuilder, 
  TextInputBuilder, 
  ActionRowBuilder, 
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// On crée une liste vide pour stocker les inscrits (en mémoire)
let players = [];

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    // 1. Commande Slash : /pvp-create
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "pvp-create") {
        const embed = new EmbedBuilder()
          .setTitle("⚔️ Nouvel Événement PvP")
          .setDescription("Inscrivez-vous pour le combat !")
          .setColor("#ff0000");

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("tank_event1").setLabel("🛡️ Tank").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("heal_event1").setLabel("💚 Heal").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("dps_event1").setLabel("⚔️ DPS").setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }
    }

    // 2. Clic sur un bouton d'inscription
    if (interaction.isButton()) {
      const [role, event] = interaction.customId.split("_");
      const modal = new ModalBuilder()
        .setCustomId(`signup_${event}_${role}`)
        .setTitle("⚔️ Inscription PvP");

      // ... (tes inputs restent les mêmes)
      const charInput = new TextInputBuilder().setCustomId("character").setLabel("Nom du perso").setStyle(TextInputStyle.Short).setRequired(true);
      const classInput = new TextInputBuilder().setCustomId("class").setLabel("Classe (Anglais)").setStyle(TextInputStyle.Short).setRequired(true);
      const ratingInput = new TextInputBuilder().setCustomId("rating").setLabel("Rating (0-3000)").setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(charInput),
        new ActionRowBuilder().addComponents(classInput),
        new ActionRowBuilder().addComponents(ratingInput)
      );
      return interaction.showModal(modal);
    }

    // 3. Validation du formulaire (Modal)
    if (interaction.isModalSubmit()) {
      const [_, event, role] = interaction.customId.split("_");
      const character = interaction.fields.getTextInputValue("character");
      const classe = interaction.fields.getTextInputValue("class");
      const rating = parseInt(interaction.fields.getTextInputValue("rating"));

      if (isNaN(rating)) return interaction.reply({ content: "❌ Rating invalide", ephemeral: true });

      // On ajoute le joueur à la liste
      players.push({ character, class: classe, rating, role, event });

      let list = players.map(p =>
        `${emojiClass(p.class)} **${p.character}** - ${p.role.toUpperCase()} - 🏆 ${p.rating}`
      ).join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ PvP Event: ${event}`)
        .setColor("#ff0000")
        .addFields({ name: "👥 Participants", value: list || "Aucun inscrit" });

      await interaction.update({ embeds: [embed] });
    }
  });
};

function emojiClass(cls) {
  const map = { warrior: "⚔️ Warrior", mage: "❄️ Mage", priest: "✝️ Priest", druid: "🌿 Drood", rogue: "🗡️ Rogue", hunter: "🏹 Hunt", warlock: "🔥 Warlock", paladin: "🛡️ Paladin", shaman: "🌩️ Shaman", monk: "🥋 Monk", demonhunter: "😈 DH", evoker: "🐉 Evoker" };
  return map[cls.toLowerCase()] || "🎮";
}
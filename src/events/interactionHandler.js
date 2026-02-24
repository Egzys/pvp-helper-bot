const { 
  ModalBuilder, 
  TextInputBuilder, 
  ActionRowBuilder, 
  TextInputStyle,
  EmbedBuilder
} = require("discord.js");

const db = require("../database");

module.exports = (client) => {
  client.on("interactionCreate", async (interaction) => {

    // Slash command
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "pvp-create") {
        return pvpCreate(interaction);
      }
    }

    // Button click
    if (interaction.isButton()) {
      const [role, event] = interaction.customId.split("_");

      const modal = new ModalBuilder()
        .setCustomId(`signup_${event}_${role}`)
        .setTitle("⚔️ Inscription PvP");

      const charInput = new TextInputBuilder()
        .setCustomId("character")
        .setLabel("Nom du personnage")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const classInput = new TextInputBuilder()
        .setCustomId("class")
        .setLabel("Classe (Warrior, Mage...) *Mettre le nom anglais*")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const ratingInput = new TextInputBuilder()
        .setCustomId("rating")
        .setLabel("Rating (0 - 2400+)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(charInput),
        new ActionRowBuilder().addComponents(classInput),
        new ActionRowBuilder().addComponents(ratingInput)
      );

      return interaction.showModal(modal);
    }

    // Modal submit
    if (interaction.isModalSubmit()) {
      const [_, event, role] = interaction.customId.split("_");

      const character = interaction.fields.getTextInputValue("character");
      const classe = interaction.fields.getTextInputValue("class");
      const rating = parseInt(interaction.fields.getTextInputValue("rating"));

      if (isNaN(rating) || rating < 0 || rating > 3000) {
        return interaction.reply({ content: "❌ Rating invalide (0-3000)", ephemeral: true });
      }

      let list = players.map(p =>
        `${emojiClass(p.class)} **${p.character}** - ${p.role.toUpperCase()} - 🏆 ${p.rating}`
      ).join("\n");

      if (!list) list = "Aucun inscrit";

      const embed = new EmbedBuilder()
        .setTitle(`⚔️ PvP Event: ${event}`)
        .setColor("#ff0000")
        .addFields({ name: "👥 Participants", value: list });

      await interaction.update({ embeds: [embed] });
    }
  });
};

// Emojis classes
function emojiClass(cls) {
  const map = {
    warrior: "⚔️ Warrior",
    mage: "❄️ Mage",
    priest: "✝️ Priest",
    druid: "🌿 Drood",
    rogue: "🗡️ Rogue",
    hunter: "🏹 Hunt",
    warlock: "🔥 Warlock",
    paladin: "🛡️ Paladin",
    shaman: "🌩️ Shaman",
    monk: "🥋 Monk",
    demonhunter: "😈 Demon Hunter",
    evoker: "🐉 Evoker"
  };
  return map[cls.toLowerCase()] || "🎮";
}
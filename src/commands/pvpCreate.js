const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const db = require("../database");

module.exports = async (interaction) => {

  // ADMIN ONLY
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({
      content: "❌ Tu dois être **Administrateur du serveur** pour créer un event PvP.",
      ephemeral: true
    });
  }

  const name = interaction.options.getString("name");

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ PvP Event: ${name}`)
    .setDescription("Clique sur ton rôle pour t'inscrire")
    .setColor("#ff0000")
    .addFields({ name: "👥 Participants", value: "Aucun inscrit" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`dps_${name}`).setEmoji("⚔️").setLabel("DPS").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`heal_${name}`).setEmoji("💚").setLabel("HEAL").setStyle(ButtonStyle.Success)
  );

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  // Save event message
  db.prepare("INSERT OR REPLACE INTO events VALUES (?,?,?)")
    .run(name, interaction.channel.id, msg.id);
};
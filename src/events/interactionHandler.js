const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  PermissionsBitField,
} = require("discord.js");

const {
  loadStore,
  saveStore,
  getEventById,
  removeEventById,
} = require("../utils/eventStore");

const {
  parseEventDate,
  isExpired,
  sortParticipants,
  buildSummaryLine,
  buildEventEmbed,
  buildEventButtons,
  sanitizeMode,
} = require("../utils/eventHelpers");

async function safeDeleteDiscordMessage(client, event) {
  try {
    const channel = await client.channels.fetch(event.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(event.messageId);
    if (!message) return;

    await message.delete().catch(() => {});
  } catch (error) {
    console.error(`Impossible de supprimer le message de l'event #${event.id}`, error);
  }
}

async function refreshEventMessage(client, event) {
  try {
    const channel = await client.channels.fetch(event.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(event.messageId);
    if (!message) return;

    await message.edit({
      embeds: [buildEventEmbed(event)],
      components: [buildEventButtons(event.id)],
    });
  } catch (error) {
    console.error(`Impossible de mettre à jour l'event #${event.id}`, error);
  }
}

async function deleteExpiredEvents(client) {
  const store = loadStore();
  const expired = store.events.filter(isExpired);

  if (!expired.length) return 0;

  for (const event of expired) {
    await safeDeleteDiscordMessage(client, event);
  }

  store.events = store.events.filter((event) => !isExpired(event));
  saveStore(store);

  return expired.length;
}

function startAutoCleanup(client) {
  // nettoyage au démarrage
  deleteExpiredEvents(client).catch(console.error);

  // nettoyage toutes les 60 secondes
  setInterval(() => {
    deleteExpiredEvents(client).catch(console.error);
  }, 60_000);
}

module.exports = (client) => {
  startAutoCleanup(client);

  client.on("interactionCreate", async (interaction) => {
    const store = loadStore();

    // COMMANDES
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "pvp-create") {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.reply({
            content: "Tu dois être administrateur pour créer un event.",
            ephemeral: true,
          });
        }

        const name = interaction.options.getString("name");
        const mode = interaction.options.getString("mode");
        const dateInput = interaction.options.getString("date");
        const durationMinutes = interaction.options.getInteger("duration") ?? 120;

        const parsed = parseEventDate(dateInput);

        if (!parsed.ok) {
          return interaction.reply({
            content: parsed.error,
            ephemeral: true,
          });
        }

        const startAt = parsed.date.getTime();
        const endAt = startAt + durationMinutes * 60 * 1000;

        if (startAt <= Date.now()) {
          return interaction.reply({
            content: "La date doit être dans le futur.",
            ephemeral: true,
          });
        }

        const event = {
          id: store.nextEventId++,
          name,
          mode,
          participants: [],
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          messageId: null,
          createdAt: Date.now(),
          startAt,
          endAt,
          durationMinutes,
        };

        const reply = await interaction.reply({
          embeds: [buildEventEmbed(event)],
          components: [buildEventButtons(event.id)],
          fetchReply: true,
        });

        event.messageId = reply.id;
        store.events.push(event);
        saveStore(store);
        return;
      }

      if (interaction.commandName === "pvp-list") {
        const requestedMode = sanitizeMode(interaction.options.getString("mode") || "ALL");

        let events = store.events.filter((e) => e.guildId === interaction.guildId);
        events = events.filter((e) => !isExpired(e));

        if (requestedMode && requestedMode !== "ALL") {
          events = events.filter((e) => e.mode === requestedMode);
        }

        events.sort((a, b) => a.startAt - b.startAt);

        if (!events.length) {
          return interaction.reply({
            content: "Aucun event actif pour ce filtre.",
            ephemeral: true,
          });
        }

        const content = events.map(buildSummaryLine).join("\n");

        return interaction.reply({
          content,
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-show") {
        const eventId = interaction.options.getInteger("id");
        const event = getEventById(store, eventId);

        if (!event || event.guildId !== interaction.guildId) {
          return interaction.reply({
            content: `Aucun event trouvé avec l'ID #${eventId}.`,
            ephemeral: true,
          });
        }

        if (isExpired(event)) {
          return interaction.reply({
            content: `L'event #${eventId} est expiré.`,
            ephemeral: true,
          });
        }

        return interaction.reply({
          embeds: [buildEventEmbed(event)],
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-delete") {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.reply({
            content: "Tu dois être administrateur pour supprimer un event.",
            ephemeral: true,
          });
        }

        const eventId = interaction.options.getInteger("id");
        const event = getEventById(store, eventId);

        if (!event || event.guildId !== interaction.guildId) {
          return interaction.reply({
            content: `Aucun event trouvé avec l'ID #${eventId}.`,
            ephemeral: true,
          });
        }

        await safeDeleteDiscordMessage(client, event);
        removeEventById(store, eventId);
        saveStore(store);

        return interaction.reply({
          content: `Event #${eventId} supprimé.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-clean-expired") {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.reply({
            content: "Tu dois être administrateur pour lancer ce nettoyage.",
            ephemeral: true,
          });
        }

        const count = await deleteExpiredEvents(client);

        return interaction.reply({
          content: `${count} event(s) expiré(s) supprimé(s).`,
          ephemeral: true,
        });
      }
    }

    // BOUTONS
    if (interaction.isButton()) {
      const parts = interaction.customId.split("_");

      if (parts[0] === "join") {
        const eventId = Number(parts[1]);
        const role = parts[2];
        const event = getEventById(store, eventId);

        if (!event || event.guildId !== interaction.guildId) {
          return interaction.reply({
            content: "Cet event n'existe pas.",
            ephemeral: true,
          });
        }

        if (isExpired(event)) {
          return interaction.reply({
            content: "Cet event est expiré.",
            ephemeral: true,
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`signup_${eventId}_${role}`)
          .setTitle(`Inscription : ${event.name}`);

        const charInput = new TextInputBuilder()
          .setCustomId("character")
          .setLabel("Nom du perso")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(32);

        const classInput = new TextInputBuilder()
          .setCustomId("class")
          .setLabel("Classe (français sans accent)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(32);

        const ratingInput = new TextInputBuilder()
          .setCustomId("rating")
          .setLabel("Rating (0-4000)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(4);

        modal.addComponents(
          new ActionRowBuilder().addComponents(charInput),
          new ActionRowBuilder().addComponents(classInput),
          new ActionRowBuilder().addComponents(ratingInput)
        );

        return interaction.showModal(modal);
      }

      if (parts[0] === "leave") {
        const eventId = Number(parts[1]);
        const event = getEventById(store, eventId);

        if (!event || event.guildId !== interaction.guildId) {
          return interaction.reply({
            content: "Cet event n'existe pas.",
            ephemeral: true,
          });
        }

        if (isExpired(event)) {
          return interaction.reply({
            content: "Cet event est expiré.",
            ephemeral: true,
          });
        }

        const before = event.participants.length;

        event.participants = event.participants.filter(
          (p) => p.userId !== interaction.user.id
        );

        if (event.participants.length === before) {
          return interaction.reply({
            content: "Tu n'étais pas inscrit à cet event.",
            ephemeral: true,
          });
        }

        sortParticipants(event.participants);
        saveStore(store);
        await refreshEventMessage(client, event);

        return interaction.reply({
          content: `Tu as quitté l'event #${event.id}.`,
          ephemeral: true,
        });
      }
    }

    // MODAL
    if (interaction.isModalSubmit()) {
      const parts = interaction.customId.split("_");

      if (parts[0] !== "signup") return;

      const eventId = Number(parts[1]);
      const role = parts[2];

      const event = getEventById(store, eventId);

      if (!event || event.guildId !== interaction.guildId) {
        return interaction.reply({
          content: "Cet event n'existe pas.",
          ephemeral: true,
        });
      }

      if (isExpired(event)) {
        return interaction.reply({
          content: "Cet event est expiré.",
          ephemeral: true,
        });
      }

      const character = interaction.fields.getTextInputValue("character").trim();
      const classe = interaction.fields.getTextInputValue("class").trim();
      const rating = Number(
        interaction.fields.getTextInputValue("rating").trim()
      );

      if (!Number.isInteger(rating) || rating < 0 || rating > 4000) {
        return interaction.reply({
          content: "Rating invalide. Entre un entier entre 0 et 4000.",
          ephemeral: true,
        });
      }

      const participant = {
        userId: interaction.user.id,
        username: interaction.user.username,
        character,
        class: classe,
        rating,
        role,
        joinedAt: Date.now(),
      };

      const existingIndex = event.participants.findIndex(
        (p) => p.userId === interaction.user.id
      );

      if (existingIndex >= 0) {
        event.participants[existingIndex] = participant;
      } else {
        event.participants.push(participant);
      }

      sortParticipants(event.participants);
      saveStore(store);
      await refreshEventMessage(client, event);

      return interaction.reply({
        content: `Inscription enregistrée pour l'event #${event.id}.`,
        ephemeral: true,
      });
    }
  });
};
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
  listGuildFiles,
} = require("../utils/eventStore");

const {
  parseEventDate,
  isExpired,
  isLocked,
  sortParticipants,
  buildSummaryLine,
  buildEventEmbed,
  buildEventButtons,
  sanitizeMode,
} = require("../utils/eventHelpers");

function isAdmin(interaction) {
  return interaction.member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

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
      components: [buildEventButtons(event.id, isLocked(event))],
    });
  } catch (error) {
    console.error(`Impossible de mettre à jour l'event #${event.id}`, error);
  }
}

async function deleteExpiredEventsForGuild(client, guildId) {
  const store = loadStore(guildId);
  const expired = store.events.filter(isExpired);

  if (!expired.length) return 0;

  for (const event of expired) {
    await safeDeleteDiscordMessage(client, event);
  }

  store.events = store.events.filter((event) => !isExpired(event));
  saveStore(guildId, store);

  return expired.length;
}

async function refreshGuildEvents(client, guildId) {
  const store = loadStore(guildId);

  for (const event of store.events) {
    if (isExpired(event)) continue;
    await refreshEventMessage(client, event);
  }
}

async function cleanupAllGuilds(client) {
  const guildFiles = listGuildFiles();

  for (const file of guildFiles) {
    await deleteExpiredEventsForGuild(client, file.guildId);
    await refreshGuildEvents(client, file.guildId);
  }
}

function startBackgroundMaintenance(client) {
  cleanupAllGuilds(client).catch(console.error);

  setInterval(() => {
    cleanupAllGuilds(client).catch(console.error);
  }, 60_000);
}

module.exports = (client) => {
  startBackgroundMaintenance(client);

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.guildId) return;

    const guildId = interaction.guildId;
    const store = loadStore(guildId);

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "pvp-create") {
        if (!isAdmin(interaction)) {
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
          channelId: interaction.channelId,
          messageId: null,
          createdAt: Date.now(),
          startAt,
          endAt,
          durationMinutes,
        };

        const reply = await interaction.reply({
          embeds: [buildEventEmbed(event)],
          components: [buildEventButtons(event.id, false)],
          fetchReply: true,
        });

        event.messageId = reply.id;
        store.events.push(event);
        saveStore(guildId, store);

        return;
      }

      if (interaction.commandName === "pvp-edit") {
        if (!isAdmin(interaction)) {
          return interaction.reply({
            content: "Tu dois être administrateur pour modifier un event.",
            ephemeral: true,
          });
        }

        const eventId = interaction.options.getInteger("id");
        const event = getEventById(store, eventId);

        if (!event) {
          return interaction.reply({
            content: `Aucun event trouvé avec l'ID #${eventId}.`,
            ephemeral: true,
          });
        }

        const newName = interaction.options.getString("name");
        const newMode = interaction.options.getString("mode");
        const newDate = interaction.options.getString("date");
        const newDuration = interaction.options.getInteger("duration");

        if (!newName && !newMode && !newDate && !newDuration) {
          return interaction.reply({
            content: "Tu dois modifier au moins un champ.",
            ephemeral: true,
          });
        }

        if (newName) {
          event.name = newName;
        }

        if (newMode) {
          event.mode = newMode;
        }

        let startAt = event.startAt;
        let durationMinutes = event.durationMinutes;

        if (newDate) {
          const parsed = parseEventDate(newDate);

          if (!parsed.ok) {
            return interaction.reply({
              content: parsed.error,
              ephemeral: true,
            });
          }

          startAt = parsed.date.getTime();
        }

        if (newDuration) {
          durationMinutes = newDuration;
        }

        const endAt = startAt + durationMinutes * 60 * 1000;

        if (startAt <= Date.now()) {
          return interaction.reply({
            content: "La nouvelle date doit être dans le futur.",
            ephemeral: true,
          });
        }

        event.startAt = startAt;
        event.durationMinutes = durationMinutes;
        event.endAt = endAt;

        saveStore(guildId, store);
        await refreshEventMessage(client, event);

        return interaction.reply({
          content: `Event #${event.id} modifié.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-delete") {
        if (!isAdmin(interaction)) {
          return interaction.reply({
            content: "Tu dois être administrateur pour supprimer un event.",
            ephemeral: true,
          });
        }

        const eventId = interaction.options.getInteger("id");
        const event = getEventById(store, eventId);

        if (!event) {
          return interaction.reply({
            content: `Aucun event trouvé avec l'ID #${eventId}.`,
            ephemeral: true,
          });
        }

        await safeDeleteDiscordMessage(client, event);
        removeEventById(store, eventId);
        saveStore(guildId, store);

        return interaction.reply({
          content: `Event #${eventId} supprimé.`,
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-list") {
        const requestedMode = sanitizeMode(
          interaction.options.getString("mode") || "ALL"
        );

        let events = store.events.filter((event) => !isExpired(event));

        if (requestedMode && requestedMode !== "ALL") {
          events = events.filter((event) => event.mode === requestedMode);
        }

        events.sort((a, b) => a.startAt - b.startAt);

        if (!events.length) {
          return interaction.reply({
            content: "Aucun event actif pour ce filtre.",
            ephemeral: true,
          });
        }

        return interaction.reply({
          content: events.map(buildSummaryLine).join("\n"),
          ephemeral: true,
        });
      }

      if (interaction.commandName === "pvp-show") {
        const eventId = interaction.options.getInteger("id");
        const event = getEventById(store, eventId);

        if (!event) {
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

      if (interaction.commandName === "pvp-clean-expired") {
        if (!isAdmin(interaction)) {
          return interaction.reply({
            content: "Tu dois être administrateur pour lancer ce nettoyage.",
            ephemeral: true,
          });
        }

        const deletedCount = await deleteExpiredEventsForGuild(client, guildId);

        return interaction.reply({
          content: `${deletedCount} event(s) expiré(s) supprimé(s).`,
          ephemeral: true,
        });
      }
    }

    if (interaction.isButton()) {
      const parts = interaction.customId.split("_");

      if (parts[0] === "join") {
        const eventId = Number(parts[1]);
        const role = parts[2];
        const event = getEventById(store, eventId);

        if (!event) {
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

        if (isLocked(event)) {
          return interaction.reply({
            content: "Les inscriptions sont verrouillées pour cet event.",
            ephemeral: true,
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(`signup_${eventId}_${role}`)
          .setTitle(`Inscription : ${event.name}`);

        const characterInput = new TextInputBuilder()
          .setCustomId("character")
          .setLabel("Nom du perso")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(32);

        const classInput = new TextInputBuilder()
          .setCustomId("class")
          .setLabel("Classe")
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
          new ActionRowBuilder().addComponents(characterInput),
          new ActionRowBuilder().addComponents(classInput),
          new ActionRowBuilder().addComponents(ratingInput)
        );

        return interaction.showModal(modal);
      }

      if (parts[0] === "leave") {
        const eventId = Number(parts[1]);
        const event = getEventById(store, eventId);

        if (!event) {
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

        if (isLocked(event)) {
          return interaction.reply({
            content: "Les désinscriptions sont verrouillées car l'event a commencé.",
            ephemeral: true,
          });
        }

        const beforeCount = event.participants.length;

        event.participants = event.participants.filter(
          (participant) => participant.userId !== interaction.user.id
        );

        if (event.participants.length === beforeCount) {
          return interaction.reply({
            content: "Tu n'étais pas inscrit à cet event.",
            ephemeral: true,
          });
        }

        sortParticipants(event.participants);
        saveStore(guildId, store);
        await refreshEventMessage(client, event);

        return interaction.reply({
          content: `Tu as quitté l'event #${event.id}.`,
          ephemeral: true,
        });
      }
    }

    if (interaction.isModalSubmit()) {
      const parts = interaction.customId.split("_");

      if (parts[0] !== "signup") return;

      const eventId = Number(parts[1]);
      const role = parts[2];
      const event = getEventById(store, eventId);

      if (!event) {
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

      if (isLocked(event)) {
        return interaction.reply({
          content: "Les inscriptions sont verrouillées pour cet event.",
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
      saveStore(guildId, store);
      await refreshEventMessage(client, event);

      return interaction.reply({
        content: `Inscription enregistrée pour l'event #${event.id}.`,
        ephemeral: true,
      });
    }
  });
};
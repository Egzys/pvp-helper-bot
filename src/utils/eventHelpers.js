const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const ALLOWED_MODES = ["RBG", "Solo Shuffle", "3v3", "2v2"];

function parseEventDate(input) {
  const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
  const match = String(input || "").trim().match(regex);

  if (!match) {
    return { ok: false, error: "Format invalide. Utilise YYYY-MM-DD HH:mm" };
  }

  const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match;

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  if (month < 1 || month > 12) return { ok: false, error: "Mois invalide." };
  if (day < 1 || day > 31) return { ok: false, error: "Jour invalide." };
  if (hour < 0 || hour > 23) return { ok: false, error: "Heure invalide." };
  if (minute < 0 || minute > 59) return { ok: false, error: "Minute invalide." };

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: "Date invalide." };
  }

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return { ok: false, error: "Date invalide." };
  }

  return { ok: true, date };
}

function formatDiscordTimestamp(ms) {
  const unix = Math.floor(ms / 1000);
  return `<t:${unix}:F>\n<t:${unix}:R>`;
}

function formatDiscordTimestampShort(ms) {
  const unix = Math.floor(ms / 1000);
  return `<t:${unix}:f>`;
}

function isExpired(event) {
  return Date.now() >= event.endAt;
}

function isLocked(event) {
  return Date.now() >= event.startAt;
}

function sortParticipants(participants) {
  participants.sort((a, b) => b.rating - a.rating);
}

function normalizeClassName(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function prettyClassName(cls) {
  const normalized = normalizeClassName(cls);

  const map = {
    guerrier: "Guerrier",
    mage: "Mage",
    pretre: "Prêtre",
    druide: "Druide",
    voleur: "Voleur",
    chasseur: "Chasseur",
    demoniste: "Démoniste",
    paladin: "Paladin",
    chaman: "Chaman",
    moine: "Moine",
    demonhunter: "DH",
    dh: "DH",
    evocateur: "Evoker",
  };

  return map[normalized] || cls;
}

function buildRoleList(participants, role) {
  const filtered = participants
    .filter((p) => p.role === role)
    .sort((a, b) => b.rating - a.rating);

  if (!filtered.length) {
    return "Aucun";
  }

  return filtered
    .map((p, index) => {
      return `**${index + 1}.** ${prettyClassName(p.class)} — **${p.character}** — **${p.rating}**`;
    })
    .join("\n");
}

function buildSummaryLine(event) {
  const status = isLocked(event) ? "VERROUILLÉ" : "OUVERT";
  return `**#${event.id}** — ${event.name} — ${event.mode} — ${formatDiscordTimestampShort(
    event.startAt
  )} — ${event.participants.length} inscrit(s) — ${status}`;
}

function buildEventEmbed(event) {
  const healCount = event.participants.filter((p) => p.role === "heal").length;
  const dpsCount = event.participants.filter((p) => p.role === "dps").length;
  const locked = isLocked(event);

  return new EmbedBuilder()
    .setTitle(`PvP Event #${event.id} — ${event.name}`)
    .setColor(locked ? 0x8b0000 : 0x1927a3)
    .setDescription(
      locked
        ? "Les inscriptions sont verrouillées. L'event a commencé."
        : "Inscrivez-vous avec les boutons ci-dessous."
    )
    .addFields(
      { name: "Mode", value: event.mode, inline: true },
      { name: "Début", value: formatDiscordTimestamp(event.startAt), inline: true },
      { name: "Fin", value: formatDiscordTimestamp(event.endAt), inline: true },
      {
        name: "Statut",
        value: locked ? "Verrouillé" : "Ouvert",
        inline: true,
      },
      {
        name: "Heals",
        value: `**${healCount}**`,
        inline: true,
      },
      {
        name: "DPS",
        value: `**${dpsCount}**`,
        inline: true,
      },
      {
        name: "Liste Heal",
        value: buildRoleList(event.participants, "heal"),
        inline: true,
      },
      {
        name: "Liste DPS",
        value: buildRoleList(event.participants, "dps"),
        inline: true,
      }
    )
    .setFooter({ text: `ID event: ${event.id}` });
}

function buildEventButtons(eventId, locked = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`join_${eventId}_heal`)
      .setLabel("Heal")
      .setStyle(ButtonStyle.Success)
      .setDisabled(locked),
    new ButtonBuilder()
      .setCustomId(`join_${eventId}_dps`)
      .setLabel("DPS")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(locked),
    new ButtonBuilder()
      .setCustomId(`leave_${eventId}`)
      .setLabel("Quitter l'event")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(locked)
  );
}

function sanitizeMode(mode) {
  if (!mode) return null;
  if (mode === "ALL") return "ALL";
  return ALLOWED_MODES.includes(mode) ? mode : null;
}

module.exports = {
  ALLOWED_MODES,
  parseEventDate,
  formatDiscordTimestamp,
  formatDiscordTimestampShort,
  isExpired,
  isLocked,
  sortParticipants,
  normalizeClassName,
  prettyClassName,
  buildRoleList,
  buildSummaryLine,
  buildEventEmbed,
  buildEventButtons,
  sanitizeMode,
};
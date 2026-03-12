const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const MODE_LIMITS = {
  RBG: { tank: 10, heal: 20, dps: 70 },
  "Solo Shuffle": { tank: 10, heal: 20, dps: 40 },
  "3v3": { tank: 10, heal: 10, dps: 20 },
  "2v2": { tank: 10, heal: 10, dps: 10 },
};

const ALLOWED_MODES = Object.keys(MODE_LIMITS);

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
    monk: "Moine",
    demonhunter: "DH",
    dh: "DH",
    evoker: "Evoker",
    evocateur: "Evoker",
  };

  return map[normalized] || cls;
}

function getModeLimits(mode) {
  return MODE_LIMITS[mode] || { tank: 0, heal: 0, dps: 0 };
}

function countRole(participants, role) {
  return participants.filter((p) => p.role === role).length;
}

function isRoleFull(event, role, userId = null) {
  const limits = getModeLimits(event.mode);
  const roleLimit = limits[role] ?? 0;

  const count = event.participants.filter((p) => {
    if (userId && p.userId === userId) return false;
    return p.role === role;
  }).length;

  return count >= roleLimit;
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
  const limits = getModeLimits(event.mode);
  const tankCount = countRole(event.participants, "tank");
  const healCount = countRole(event.participants, "heal");
  const dpsCount = countRole(event.participants, "dps");

  return `**#${event.id}** — ${event.name} — ${event.mode} — ${formatDiscordTimestampShort(
    event.startAt
  )} — Tank ${tankCount}/${limits.tank} — Heal ${healCount}/${limits.heal} — DPS ${dpsCount}/${limits.dps} — ${status}`;
}

function buildEventEmbed(event) {
  const limits = getModeLimits(event.mode);
  const tankCount = countRole(event.participants, "tank");
  const healCount = countRole(event.participants, "heal");
  const dpsCount = countRole(event.participants, "dps");
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
        name: "Tanks",
        value: `**${tankCount}/${limits.tank}**`,
        inline: true,
      },
      {
        name: "Heals",
        value: `**${healCount}/${limits.heal}**`,
        inline: true,
      },
      {
        name: "DPS",
        value: `**${dpsCount}/${limits.dps}**`,
        inline: true,
      },
      {
        name: "Liste Tank",
        value: buildRoleList(event.participants, "tank"),
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

function buildEventButtons(event, locked = false) {
  const tankFull = isRoleFull(event, "tank");
  const healFull = isRoleFull(event, "heal");
  const dpsFull = isRoleFull(event, "dps");

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`join_${event.id}_tank`)
      .setLabel(tankFull ? "Tank (complet)" : "Tank")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(locked || tankFull),
    new ButtonBuilder()
      .setCustomId(`join_${event.id}_heal`)
      .setLabel(healFull ? "Heal (complet)" : "Heal")
      .setStyle(ButtonStyle.Success)
      .setDisabled(locked || healFull),
    new ButtonBuilder()
      .setCustomId(`join_${event.id}_dps`)
      .setLabel(dpsFull ? "DPS (complet)" : "DPS")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(locked || dpsFull),
    new ButtonBuilder()
      .setCustomId(`leave_${event.id}`)
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
  MODE_LIMITS,
  ALLOWED_MODES,
  parseEventDate,
  formatDiscordTimestamp,
  formatDiscordTimestampShort,
  isExpired,
  isLocked,
  sortParticipants,
  normalizeClassName,
  prettyClassName,
  getModeLimits,
  countRole,
  isRoleFull,
  buildRoleList,
  buildSummaryLine,
  buildEventEmbed,
  buildEventButtons,
  sanitizeMode,
};
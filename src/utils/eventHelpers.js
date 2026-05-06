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

const CLASS_SPECS = {
  warrior: {
    label: "Warrior",
    emoji: "<:warrior_anima:1481698186514010283>",
    specs: [
      { key: "arms", label: "Arms", role: "dps" },
      { key: "fury", label: "Fury", role: "dps" },
      { key: "protection", label: "Protection", role: "tank" },
    ],
  },
  paladin: {
    label: "Paladin",
    emoji: "<:paladin_anima:1481698233171443763>",
    specs: [
      { key: "holy", label: "Holy", role: "heal" },
      { key: "retribution", label: "Retribution", role: "dps" },
      { key: "protection", label: "Protection", role: "tank" },
    ],
  },
  hunter: {
    label: "Hunter",
    emoji: "<:hunt_anima:1481698268789346380>",
    specs: [
      { key: "marksmanship", label: "Marksmanship", role: "dps" },
      { key: "bm", label: "BM", role: "dps" },
      { key: "survival", label: "Survival", role: "dps" },
    ],
  },
  rogue: {
    label: "Rogue",
    emoji: "<:rogue_anima:1481698286321532948>",
    specs: [
      { key: "outlaw", label: "Outlaw", role: "dps" },
      { key: "sub", label: "Sub", role: "dps" },
      { key: "assa", label: "Assa", role: "dps" },
    ],
  },
  priest: {
    label: "Priest",
    emoji: "<:priest_anima:1481698303304274073>",
    specs: [
      { key: "holy", label: "Holy", role: "heal" },
      { key: "unholy", label: "Unholy", role: "heal" },
      { key: "sp", label: "SP", role: "dps" },
    ],
  },
  deathknight: {
    label: "Deathknight",
    emoji: "<:dk_anima:1481698324791824454>",
    specs: [
      { key: "unholy", label: "Unholy", role: "dps" },
      { key: "blood", label: "Blood", role: "tank" },
      { key: "frost", label: "Frost", role: "dps" },
    ],
  },
  shaman: {
    label: "Shaman",
    emoji: "<:sham_anima:1481698351878635540>",
    specs: [
      { key: "resto", label: "Resto", role: "heal" },
      { key: "enhancement", label: "Enhancement", role: "dps" },
      { key: "elemental", label: "Elemental", role: "dps" },
    ],
  },
  mage: {
    label: "Mage",
    emoji: "<:mage_anima:1481698370970980606>",
    specs: [
      { key: "fire", label: "Fire", role: "dps" },
      { key: "frost", label: "Frost", role: "dps" },
      { key: "arcane", label: "Arcane", role: "dps" },
    ],
  },
  warlock: {
    label: "Warlock",
    emoji: "<:warlock_anima:1481698395495075890>",
    specs: [
      { key: "destro", label: "Destro", role: "dps" },
      { key: "affli", label: "Affli", role: "dps" },
      { key: "demono", label: "Demono", role: "dps" },
    ],
  },
  monk: {
    label: "Monk",
    emoji: "<:monk_anima:1481698413367005407>",
    specs: [
      { key: "ww", label: "WW", role: "dps" },
      { key: "bw", label: "BW", role: "tank" },
      { key: "mw", label: "MW", role: "heal" },
    ],
  },
  druid: {
    label: "Druid",
    emoji: "<:drood_anima:1481698435693281360>",
    specs: [
      { key: "gardian", label: "Gardian", role: "tank" },
      { key: "boomy", label: "Boomy", role: "dps" },
      { key: "feral", label: "Feral", role: "dps" },
      { key: "resto", label: "Resto", role: "heal" },
    ],
  },
  demonhunter: {
    label: "Demonhunter",
    emoji: "<:dh_anima:1481698453523529920>",
    specs: [
      { key: "havoc", label: "Havoc", role: "dps" },
      { key: "devorer", label: "Devorer", role: "dps" },
      { key: "vengeance", label: "Vengeance", role: "tank" },
    ],
  },
  evoker: {
    label: "Evoker",
    emoji: "<:evok_anima:1481698475912462456>",
    specs: [
      { key: "devastation", label: "Devastation", role: "dps" },
      { key: "augment", label: "Augment", role: "dps" },
      { key: "preservation", label: "Preservation", role: "heal" },
    ],
  },
};

const CLASS_EMOJIS = Object.fromEntries(
  Object.entries(CLASS_SPECS).map(([key, value]) => [key, value.emoji])
);

function parseEventDate(input) {
  const regex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
  const match = String(input || "").trim().match(regex);

  if (!match) {
    return {
      ok: false,
      error: "Format invalide. Utilise YYYY-MM-DD HH:mm",
    };
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
  return `<t:${unix}:F>`;
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
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
}

function canonicalClassKey(input) {
  const value = normalizeClassName(input);

  const map = {
    guerrier: "warrior",
    warrior: "warrior",
    paladin: "paladin",
    chasseur: "hunter",
    hunter: "hunter",
    voleur: "rogue",
    rogue: "rogue",
    pretre: "priest",
    priest: "priest",
    chevalierdelamort: "deathknight",
    chevaliermort: "deathknight",
    dk: "deathknight",
    deathknight: "deathknight",
    chaman: "shaman",
    shaman: "shaman",
    mage: "mage",
    demoniste: "warlock",
    warlock: "warlock",
    moine: "monk",
    monk: "monk",
    druide: "druid",
    druid: "druid",
    chasseurdedemons: "demonhunter",
    dh: "demonhunter",
    demonhunter: "demonhunter",
    evocateur: "evoker",
    evoker: "evoker",
  };

  return map[value] || null;
}

function prettyClassName(input) {
  const key = canonicalClassKey(input) || input;
  return CLASS_SPECS[key]?.label || input;
}

function getClassIcon(input) {
  const key = canonicalClassKey(input) || input;
  return CLASS_SPECS[key]?.emoji || "";
}

function getSpecLabel(classKey, specKey, fallback = null) {
  const classData = CLASS_SPECS[classKey];
  const specData = classData?.specs.find((spec) => spec.key === specKey);

  return specData?.label || fallback || specKey || "";
}

function getParticipantClassLine(participant) {
  const classKey = canonicalClassKey(participant.class) || participant.class;
  const classData = CLASS_SPECS[classKey];

  if (!classData) {
    return `${getClassIcon(participant.class)} ${participant.specLabel || ""}`.trim();
  }

  const specLabel = getSpecLabel(classKey, participant.spec, participant.specLabel);

  return `${classData.emoji} ${specLabel}`.trim();
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
      return `**${index + 1}.** ${getParticipantClassLine(p)} — **${p.character}** — **${p.rating}**`;
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
      {
        name: "Début",
        value: formatDiscordTimestamp(event.startAt),
        inline: true,
      },
      {
        name: "Fin",
        value: formatDiscordTimestamp(event.endAt),
        inline: true,
      },
      {
        name: "Mode",
        value: event.mode,
        inline: true,
      },
      {
        name: "TANKS",
        value: `**${tankCount}/${limits.tank}**`,
        inline: true,
      },
      {
        name: "HEALS",
        value: `**${healCount}/${limits.heal}**`,
        inline: true,
      },
      {
        name: "Statut",
        value: locked ? "Verrouillé" : "Ouvert",
        inline: true,
      },
      {
        name: "LISTE TANK",
        value: buildRoleList(event.participants, "tank"),
        inline: true,
      },
      {
        name: "LISTE HEAL",
        value: buildRoleList(event.participants, "heal"),
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: "DPS",
        value: `**${dpsCount}/${limits.dps}**`,
        inline: false,
      },
      {
        name: "LISTE DPS",
        value: buildRoleList(event.participants, "dps"),
        inline: false,
      },
      {
        name: "ABSENTS",
        value: `**${countAbsent(event.participants)}**`,
        inline: false,
      },
      {
        name: "LISTE ABSENTS",
        value: buildAbsentList(event.participants),
        inline: false,
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
      .setCustomId(`absent_${event.id}`)
      .setLabel("Absent")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(locked),
    new ButtonBuilder()
      .setCustomId(`leave_${event.id}`)
      .setLabel("Quitter")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(locked)
  );
}

function buildAbsentList(participants) {
  const absent = participants.filter((p) => p.role === "absent");

  if (!absent.length) {
    return "Aucun";
  }

  return absent
    .map((p, index) => `**${index + 1}.** ${p.character}`)
    .join("\n");
}

function countAbsent(participants) {
  return participants.filter((p) => p.role === "absent").length;
}

function sanitizeMode(mode) {
  if (!mode) return null;
  if (mode === "ALL") return "ALL";

  return ALLOWED_MODES.includes(mode) ? mode : null;
}

function countInterestRole(entries, role) {
  return entries.filter((p) => p.role === role).length;
}

function buildInterestRoleList(entries, role) {
  const filtered = entries
    .filter((p) => p.role === role)
    .sort((a, b) => b.rating - a.rating);

  if (!filtered.length) {
    return "Aucun";
  }

  return filtered
    .map((p, index) => {
      return `**${index + 1}.** ${getParticipantClassLine(p)} — **${p.character}** — **${p.rating}**`;
    })
    .join("\n");
}

function buildInterestEmbed(interest) {
  const tankCount = countInterestRole(interest.entries, "tank");
  const healCount = countInterestRole(interest.entries, "heal");
  const dpsCount = countInterestRole(interest.entries, "dps");

  return new EmbedBuilder()
    .setTitle(interest.title)
    .setColor(0x5865f2)
    .setDescription("Inscrivez-vous si vous êtes intéressé pour faire du RBG.")
    .addFields(
      {
        name: "Tanks",
        value: `**${tankCount}**`,
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
        name: "Liste Tank",
        value: buildInterestRoleList(interest.entries, "tank"),
        inline: true,
      },
      {
        name: "Liste Heal",
        value: buildInterestRoleList(interest.entries, "heal"),
        inline: true,
      },
      {
        name: "\u200B",
        value: "\u200B",
        inline: true,
      },
      {
        name: "Liste DPS",
        value: buildInterestRoleList(interest.entries, "dps"),
        inline: false,
      }
    )
    .setFooter({ text: `ID interest: ${interest.id}` });
}

function buildInterestButtons(interestId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`interest_join_${interestId}_tank`)
      .setLabel("Tank")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`interest_join_${interestId}_heal`)
      .setLabel("Heal")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`interest_join_${interestId}_dps`)
      .setLabel("DPS")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`interest_leave_${interestId}`)
      .setLabel("Quitter")
      .setStyle(ButtonStyle.Secondary)
  );
}

module.exports = {
  MODE_LIMITS,
  ALLOWED_MODES,
  CLASS_SPECS,
  CLASS_EMOJIS,
  parseEventDate,
  formatDiscordTimestamp,
  formatDiscordTimestampShort,
  isExpired,
  isLocked,
  sortParticipants,
  normalizeClassName,
  canonicalClassKey,
  prettyClassName,
  getClassIcon,
  getSpecLabel,
  getParticipantClassLine,
  getModeLimits,
  countRole,
  isRoleFull,
  buildRoleList,
  buildSummaryLine,
  buildEventEmbed,
  buildEventButtons,
  sanitizeMode,
  countInterestRole,
  buildInterestRoleList,
  buildInterestEmbed,
  buildInterestButtons,
  buildAbsentList,
  countAbsent,
};
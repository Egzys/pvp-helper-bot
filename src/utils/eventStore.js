const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const GUILDS_DIR = path.join(DATA_DIR, "guilds");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(GUILDS_DIR)) {
    fs.mkdirSync(GUILDS_DIR, { recursive: true });
  }
}

function getGuildFilePath(guildId) {
  ensureDirs();
  return path.join(GUILDS_DIR, `${guildId}.json`);
}

function ensureGuildStore(guildId) {
  const filePath = getGuildFilePath(guildId);

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ nextEventId: 1, events: [] }, null, 2),
      "utf8"
    );
  }

  return filePath;
}

function loadStore(guildId) {
  const filePath = ensureGuildStore(guildId);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      typeof parsed.nextEventId !== "number" ||
      !Array.isArray(parsed.events)
    ) {
      throw new Error("Format JSON invalide.");
    }

    return parsed;
  } catch (error) {
    console.error(`Erreur lecture store guild ${guildId}:`, error);
    return { nextEventId: 1, events: [] };
  }
}

function saveStore(guildId, store) {
  const filePath = ensureGuildStore(guildId);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf8");
}

function getEventById(store, eventId) {
  return store.events.find((event) => event.id === eventId);
}

function removeEventById(store, eventId) {
  const index = store.events.findIndex((event) => event.id === eventId);
  if (index === -1) return null;

  const [removed] = store.events.splice(index, 1);
  return removed;
}

function listGuildFiles() {
  ensureDirs();

  return fs
    .readdirSync(GUILDS_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => ({
      guildId: file.replace(".json", ""),
      path: path.join(GUILDS_DIR, file),
    }));
}

module.exports = {
  loadStore,
  saveStore,
  getEventById,
  removeEventById,
  listGuildFiles,
  getGuildFilePath,
};
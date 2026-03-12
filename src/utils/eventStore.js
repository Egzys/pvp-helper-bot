const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "events.json");

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ nextEventId: 1, events: [] }, null, 2),
      "utf8"
    );
  }
}

function loadStore() {
  ensureStore();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (
      typeof parsed !== "object" ||
      typeof parsed.nextEventId !== "number" ||
      !Array.isArray(parsed.events)
    ) {
      throw new Error("Format JSON invalide");
    }

    return parsed;
  } catch (error) {
    console.error("Erreur lecture events.json :", error);
    return { nextEventId: 1, events: [] };
  }
}

function saveStore(store) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
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

module.exports = {
  loadStore,
  saveStore,
  getEventById,
  removeEventById,
};
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../../data/teamConfig.json");

const { getActiveTeams } = require("./teamService");

/* ------------------ Helpers ------------------ */

function readConfig() {
  if (!fs.existsSync(configPath)) {
    return { lastCreated: 0 };
  }

  try {
    const data = fs.readFileSync(configPath, "utf-8");
    return data ? JSON.parse(data) : { lastCreated: 0 };
  } catch (err) {
    console.error("Error leyendo teamConfig:", err);
    return { lastCreated: 0 };
  }
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/* ------------------ Core ------------------ */

function canCreateTeams() {
  const config = readConfig();
  const activeTeams = getActiveTeams();

  if (activeTeams.length === 0) {
    return true;
  }

  const now = Date.now();
  const diff = now - (config.lastCreated || 0);

  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  return diff >= THIRTY_DAYS;
}

function updateLastCreated() {
  const config = readConfig();

  config.lastCreated = Date.now();

  saveConfig(config);
}

module.exports = {
  canCreateTeams,
  updateLastCreated
};
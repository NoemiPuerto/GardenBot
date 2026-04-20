const fs = require("fs");
const path = require("path");

const historyPath = path.join(__dirname, "../../data/teamHistory.json");

function getHistory() {
  if (!fs.existsSync(historyPath)) return [];

  const data = fs.readFileSync(historyPath, "utf-8");

  if (!data) return [];

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveHistory(history) {
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

function addHistoryEntry(entry) {
  const history = getHistory();

  history.push(entry);

  saveHistory(history);
}

module.exports = {
  addHistoryEntry
};
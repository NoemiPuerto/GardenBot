const { getRandomItem } = require("./shuffle");
const names = [
    "Equipo Dinamita 💥",
    "Los Padawans ⚔️",
    "Code Warriors 💻",
    "Bug Smashers 🐛",
    "Stack Masters 📚",
    "Los Compiladores 🔧",
    "404 Not Found 🚫",
    "Deploy Masters 🚀"
  ];
  
  function getRandomTeamName() {
    return getRandomItem(names);
  }
  
  module.exports = { getRandomTeamName };
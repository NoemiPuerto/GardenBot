const fs = require("fs");
const path = require("path");

const retosPath = path.join(__dirname, "../data/retos.json");

function getRetos() {
  const data = fs.readFileSync(retosPath);
  return JSON.parse(data);
}

function getRandomReto() {
  const retos = getRetos();
  const index = Math.floor(Math.random() * retos.length);
  return retos[index];
}

module.exports = {
  getRetos,
  getRandomReto
};
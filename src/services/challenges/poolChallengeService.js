const fs = require("fs");
const path = require("path");

const userService = require("../users/userService");

/* ------------------ PATHS ------------------ */

const basePath = path.join(__dirname, "../../data/challenges/pool");

const files = [
  "logic.json",
  "web.json",
  "mobile.json"
];

/* ------------------ LOAD ------------------ */

function getAllChallenges() {
  let all = [];

  files.forEach(file => {
    const filePath = path.join(basePath, file);

    if (!fs.existsSync(filePath)) return;

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      if (data.challenges && Array.isArray(data.challenges)) {
        const withCategory = data.challenges.map(ch => ({
          ...ch,
          category: ch.category || data.category
        }));

        all.push(...withCategory);
      }

    } catch (err) {
      console.error("Error leyendo:", file, err.message);
    }
  });

  return all;
}

/* ------------------ CORE ------------------ */

function assignChallengeToUser(userId, filters = {}) {
  const user = userService.getUser(userId);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const challenges = getAllChallenges();

  if (challenges.length === 0) {
    throw new Error("No hay retos cargados");
  }

  console.log("🔥 TOTAL:", challenges.length);
  console.log("🎯 FILTROS:", filters);

  // =========================
  // VALIDAR SI YA TIENE UNO ACTIVO
  // =========================

  if (user.activeChallenges?.individual) {
    throw new Error("Ya tienes un reto individual activo");
  }

  // =========================
  // FILTRO PRINCIPAL
  // =========================

  let filtered = challenges.filter(c =>
    (!filters.type || c.type === filters.type) &&
    (!filters.category || c.category === filters.category) &&
    (!filters.difficulty || c.difficulty === filters.difficulty)
  );

  console.log("✅ FILTRADOS:", filtered.length);

  // =========================
  //  EVITAR REPETIDOS
  // =========================

  const completedIds = user.completedChallenges.map(c => c.challengeId);

  let available = filtered.filter(c => !completedIds.includes(c.id));

  console.log("🧠 DISPONIBLES:", available.length);

  // =========================
  // FALLBACKS
  // =========================

  if (available.length === 0) {
    console.log("⚠️ Sin nuevos retos → permitiendo repetidos");
    available = filtered;
  }

  if (available.length === 0) {
    console.log("⚠️ Filtros muy estrictos → usando todos los retos");
    available = challenges;
  }

  if (available.length === 0) {
    throw new Error("No hay retos disponibles");
  }

  // =========================
  // RANDOM
  // =========================

  const index = Math.floor(Math.random() * available.length);
  const challenge = available[index];

  if (!challenge || !challenge.id) {
    throw new Error("Reto inválido seleccionado");
  }

  // =========================
  // GUARDAR EN USUARIO (NUEVO MODELO)
  // =========================

  user.activeChallenges.individual = {
    challengeId: challenge.id,
    assignedAt: Date.now(),
    type: challenge.type || "individual"
  };

  userService.saveUser(userId, user);

  // DEBUG
  const checkUser = userService.getUser(userId);
  console.log("💾 GUARDADO:", checkUser.activeChallenges.individual);

  return challenge;
}

/* ------------------ EXPORT ------------------ */

module.exports = {
  getAllChallenges,
  assignChallengeToUser
};
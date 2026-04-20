const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

/**
 * Asegura que el archivo exista
 */
function ensureFile() {
  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify({ users: {} }, null, 2));
  }
}

/**
 * Lee todos los usuarios
 */
function readUsersFile() {
  ensureFile();

  try {
    const data = fs.readFileSync(USERS_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo users.json:", error.message);
    return { users: {} };
  }
}

/**
 * Guarda todos los usuarios
 */
function writeUsersFile(data) {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo users.json:", error.message);
  }
}

/**
 * Estructura base de usuario
 */
function createBaseUser() {
  return {
    points: 0,
    completedChallenges: [],
    activeChallenges: {
      individual: null
    },
    stats: {
      totalCompleted: 0,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    }
  };
}

/**
 * Obtiene usuario 
 */
function getUser(userId) {
  const data = readUsersFile();

  if (!data.users[userId]) {
    data.users[userId] = createBaseUser();
    writeUsersFile(data);
  }

  const user = data.users[userId];

  // =========================
  // MIGRACIÓN AUTOMÁTICA
  // =========================
  if (user.activeChallenge && !user.activeChallenges) {
    user.activeChallenges = {
      individual: user.activeChallenge
    };

    delete user.activeChallenge;

    writeUsersFile(data);

    console.log(`🔄 Usuario ${userId} migrado a activeChallenges`);
  }

  // =========================
  // ASEGURAR ESTRUCTURA
  // =========================
  if (!user.activeChallenges) {
    user.activeChallenges = {
      individual: null
    };

    writeUsersFile(data);
  }

  return user;
}

/**
 * Guarda usuario
 */
function saveUser(userId, userData) {
  if (!userId || !userData) {
    throw new Error("saveUser requiere userId y userData");
  }

  const data = readUsersFile();

  data.users[userId] = userData;

  writeUsersFile(data);
}

/**
 * Agrega puntos al usuario
 */
function addPoints(userId, points) {
  const user = getUser(userId);

  user.points += points;

  saveUser(userId, user);
}

/**
 * Marca un reto como completado
 */
function completeChallenge(userId, challenge) {
  const user = getUser(userId);

  // Evitar duplicados
  const alreadyCompleted = user.completedChallenges.some(
    (c) => c.challengeId === challenge.id
  );

  if (!alreadyCompleted) {
    user.completedChallenges.push({
      challengeId: challenge.id,
      completedAt: Date.now(),
      type: challenge.type
    });

    // Stats
    user.stats.totalCompleted += 1;

    if (user.stats.byDifficulty[challenge.difficulty] !== undefined) {
      user.stats.byDifficulty[challenge.difficulty] += 1;
    }

    // Puntos
    user.points += challenge.points;
  }

  // =========================
  // LIMPIAR RETO INDIVIDUAL
  // =========================
  if (
    user.activeChallenges?.individual &&
    user.activeChallenges.individual.challengeId === challenge.id
  ) {
    user.activeChallenges.individual = null;
  }

  saveUser(userId, user);
}

/**
 * Limpia reto activo manualmente
 */
function clearActiveChallenge(userId) {
  const user = getUser(userId);

  user.activeChallenges.individual = null;

  saveUser(userId, user);
}

/**
 * Obtiene todos los usuarios (para ranking)
 */
function getAllUsers() {
  const data = readUsersFile();
  return data.users;
}

module.exports = {
  getUser,
  saveUser,
  addPoints,
  completeChallenge,
  clearActiveChallenge,
  getAllUsers
};
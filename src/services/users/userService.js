const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");

function ensureFile() {
  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify({ users: {} }, null, 2));
  }
}

function readUsersFile() {
  ensureFile();

  try {
    const raw = fs.readFileSync(USERS_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return { users: {} };
    }

    if (!parsed.users || typeof parsed.users !== "object") {
      parsed.users = {};
    }

    return parsed;
  } catch (error) {
    console.error("Error leyendo users.json:", error.message);
    return { users: {} };
  }
}

function writeUsersFile(data) {
  try {
    if (!data || typeof data !== "object") {
      data = { users: {} };
    }

    if (!data.users || typeof data.users !== "object") {
      data.users = {};
    }

    fs.writeFileSync(USERS_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error escribiendo users.json:", error.message);
  }
}

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

function getUser(userId) {
  if (!userId) {
    throw new Error("getUser requiere userId");
  }

  const data = readUsersFile();

  if (!data.users[userId]) {
    data.users[userId] = createBaseUser();
    writeUsersFile(data);
  }

  const user = data.users[userId];

  if (user.activeChallenge && !user.activeChallenges) {
    user.activeChallenges = {
      individual: user.activeChallenge
    };
    delete user.activeChallenge;
    writeUsersFile(data);
  }

  if (!user.activeChallenges || typeof user.activeChallenges !== "object") {
    user.activeChallenges = {
      individual: null
    };
    writeUsersFile(data);
  }

  if (!user.completedChallenges) {
    user.completedChallenges = [];
  }

  if (!user.stats) {
    user.stats = {
      totalCompleted: 0,
      byDifficulty: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    };
  }

  return user;
}

function saveUser(userId, userData) {
  if (!userId || !userData) {
    throw new Error("saveUser requiere userId y userData");
  }

  const data = readUsersFile();

  if (!data.users || typeof data.users !== "object") {
    data.users = {};
  }

  data.users[userId] = userData;

  writeUsersFile(data);
}

function addPoints(userId, points) {
  const user = getUser(userId);
  user.points += points;
  saveUser(userId, user);
}

function completeChallenge(userId, challenge) {
  const user = getUser(userId);

  const alreadyCompleted = user.completedChallenges.some(
    (c) => c.challengeId === challenge.id
  );

  if (!alreadyCompleted) {
    user.completedChallenges.push({
      challengeId: challenge.id,
      completedAt: Date.now(),
      type: challenge.type
    });

    user.stats.totalCompleted += 1;

    if (
      challenge.difficulty &&
      user.stats.byDifficulty[challenge.difficulty] !== undefined
    ) {
      user.stats.byDifficulty[challenge.difficulty] += 1;
    }

    user.points += challenge.points;
  }

  if (
    user.activeChallenges &&
    user.activeChallenges.individual &&
    user.activeChallenges.individual.challengeId === challenge.id
  ) {
    user.activeChallenges.individual = null;
  }

  saveUser(userId, user);
}

function clearActiveChallenge(userId) {
  const user = getUser(userId);

  if (!user.activeChallenges) {
    user.activeChallenges = { individual: null };
  }

  user.activeChallenges.individual = null;

  saveUser(userId, user);
}

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
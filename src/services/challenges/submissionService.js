const fs = require("fs");
const path = require("path");

const userService = require("../users/userService");
const poolChallengeService = require("./poolChallengeService");

const submissionsPath = path.join(__dirname, "../../data/submissions.json");

function ensureFile() {
  if (!fs.existsSync(submissionsPath)) {
    fs.writeFileSync(submissionsPath, JSON.stringify({ submissions: [] }, null, 2));
  }
}

function readFile() {
  ensureFile();

  try {
    const data = fs.readFileSync(submissionsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo submissions:", error.message);
    return { submissions: [] };
  }
}

function writeFile(data) {
  try {
    fs.writeFileSync(submissionsPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error guardando submissions:", error.message);
  }
}

function getSubmissions() {
  const data = readFile();
  return data.submissions;
}

function hasSubmitted(userId, challengeId) {
  const submissions = getSubmissions();

  return submissions.some(
    (s) => s.userId === userId && s.challengeId === challengeId
  );
}

function submitChallenge(userId, repoUrl) {
  const user = userService.getUser(userId);

  // FIX PRINCIPAL
  const active = user.activeChallenges?.individual;

  if (!active) {
    throw new Error("No tienes un reto activo");
  }

  const challengeId = active.challengeId;

  if (hasSubmitted(userId, challengeId)) {
    throw new Error("Ya enviaste este reto");
  }

  const challenge = poolChallengeService
    .getAllChallenges()
    .find(c => c.id === challengeId);

  if (!challenge) {
    throw new Error("Reto no encontrado");
  }

  const data = readFile();

  const newSubmission = {
    id: `sub_${Date.now()}`,
    userId,
    challengeId,
    repoUrl,
    type: challenge.type,
    status: "pending",
    createdAt: Date.now()
  };

  data.submissions.push(newSubmission);

  writeFile(data);

  userService.completeChallenge(userId, challenge);

  return {
    submission: newSubmission,
    challenge
  };
}

module.exports = {
  getSubmissions,
  submitChallenge,
  hasSubmitted
};
const fs = require("fs");
const path = require("path");

const CHALLENGE_PATH = path.join(
  __dirname,
  "../../data/challenges/mentor/monthlyChallenges.json"
);

const teamService = require("../teams/teamService");

/* ------------------ FILE HELPERS ------------------ */

function readFile() {
  if (!fs.existsSync(CHALLENGE_PATH)) {
    return { challenges: [] };
  }

  try {
    const data = fs.readFileSync(CHALLENGE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo retos mentor:", error.message);
    return { challenges: [] };
  }
}

function writeFile(data) {
  fs.writeFileSync(CHALLENGE_PATH, JSON.stringify(data, null, 2));
}

/* ------------------ CORE ------------------ */

/**
 * Obtener retos activos (opcional)
 */
function getActiveChallenges() {
  const data = readFile();
  return data.challenges.filter(c => c.isActive);
}

/**
 * asigna un reto RANDOM a todos los equipos
 */
function assignRandomChallengeToAllTeams() {
  const data = readFile();

  if (!data.challenges || data.challenges.length === 0) {
    throw new Error("No hay retos disponibles");
  }

  // obtener reto activo previo (opcional para evitar repetir)
  const previousActive = data.challenges.find(c => c.isActive);

  // desactivar todos
  data.challenges.forEach(c => {
    c.isActive = false;
  });

  // elegir uno random (evitar repetir si hay más de 1)
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * data.challenges.length);
  } while (
    data.challenges.length > 1 &&
    data.challenges[randomIndex].id === previousActive?.id
  );

  const challenge = data.challenges[randomIndex];

  // activarlo
  challenge.isActive = true;
  challenge.assignedTeams = [];

  const teams = teamService.getActiveTeams();

  if (teams.length === 0) {
    throw new Error("No hay equipos activos");
  }

  let assignedCount = 0;

  // asignar a TODOS los equipos (sin excepción)
  teams.forEach(team => {
    team.activeChallenge = {
      challengeId: challenge.id,
      assignedAt: Date.now()
    };

    teamService.saveTeam(team);

    challenge.assignedTeams.push(team.id);
    assignedCount++;
  });

  writeFile(data);

  return {
    challenge,
    teamsAssigned: assignedCount
  };
}

/**
 * Obtener reto activo de un equipo
 */
function getTeamActiveChallenge(teamId) {
  const team = teamService.getTeamById(teamId);

  if (!team || !team.activeChallenge) return null;

  const data = readFile();

  return data.challenges.find(
    c => c.id === team.activeChallenge.challengeId
  ) || null;
}

/**
 * desactivar todos los retos
 */
function deactivateAllChallenges() {
  const data = readFile();

  data.challenges.forEach(c => {
    c.isActive = false;
  });

  writeFile(data);
}

/* ------------------ EXPORTS ------------------ */

module.exports = {
  getActiveChallenges,
  assignRandomChallengeToAllTeams,
  getTeamActiveChallenge,
  deactivateAllChallenges
};
const fs = require("fs");
const path = require("path");

const teamsPath = path.join(__dirname, "../../data/teams.json");

/* ------------------ Helpers ------------------ */

function readJSONSafe(filePath) {
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error parseando JSON:", e.message);
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* ------------------ Normalizer ------------------ */

function normalizeTeam(team) {
  return {
    ...team,
    activeChallenge: team.activeChallenge || null,
    challengeHistory: team.challengeHistory || []
  };
}

/* ------------------ Base ------------------ */

function getTeams() {
  const teams = readJSONSafe(teamsPath);
  return teams.map(normalizeTeam);
}

function saveTeams(teams) {
  writeJSON(teamsPath, teams);
}

/* ------------------ Utils ------------------ */

const { shuffle } = require("../../utils/shuffle");

function crearEquipos(users, size = 5) {
  const mezclados = shuffle(users);
  const equipos = [];

  for (let i = 0; i < mezclados.length; i += size) {
    equipos.push(mezclados.slice(i, i + size));
  }

  return equipos;
}

/* ------------------ Core ------------------ */

/**
 * SOLO construye equipos (no guarda)
 */
function buildTeams(userIds, size = 5) {
  const grupos = crearEquipos(userIds, size);

  return grupos.map((members, index) => ({
    members,
    index
  }));
}

/**
 * Persiste equipos ya creados desde Discord
 */
function createTeams(teamsData) {
  const existing = getTeams();
  const now = Date.now();

  const nuevosEquipos = teamsData.map(team => ({
    id: team.roleId,
    name: team.name,
    members: team.members,
    leader: team.leader,
    canalId: team.channelId,

    activo: true,

    createdAt: now,
    expiresAt: now + 30 * 24 * 60 * 60 * 1000,

    notified24h: false,

    activeChallenge: null,
    challengeHistory: []
  }));

  const updated = [...existing, ...nuevosEquipos];
  saveTeams(updated);

  return nuevosEquipos;
}

/**
 * Busca equipo activo de usuario
 */
function findUserTeam(userId) {
  const teams = getTeams();

  return teams.find(
    team => team.activo && team.members.includes(userId)
  ) || null;
}

/**
 * Obtener equipo por ID
 */
function getTeamById(teamId) {
  const teams = getTeams();
  return teams.find(t => t.id === teamId) || null;
}

/**
 * Guardar un equipo individual 
 */
function saveTeam(updatedTeam) {
  const teams = getTeams();

  const index = teams.findIndex(t => t.id === updatedTeam.id);
  if (index === -1) return null;

  teams[index] = updatedTeam;

  saveTeams(teams);

  return updatedTeam;
}

/**
 * Obtiene equipos activos
 */
function getActiveTeams() {
  return getTeams()
    .filter(t => t.activo)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Cierre lógico
 */
function closeTeam(teamId) {
  const teams = getTeams();

  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  team.activo = false;
  team.closedAt = Date.now();

  saveTeams(teams);

  return team;
}

async function deleteTeam(client, teamId) {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);

  if (!team) return null;

  const guild = client.guilds.cache.first();

  try {
    const channel = await guild.channels.fetch(team.canalId).catch(() => null);
    if (channel) await channel.delete();

    const role = await guild.roles.fetch(team.id).catch(() => null);
    if (role) await role.delete();

    for (const memberId of team.members) {
      const member = await guild.members.fetch(memberId).catch(() => null);
      if (member && role) {
        await member.roles.remove(role).catch(() => null);
      }
    }

    console.log(`Equipo eliminado: ${team.name}`);

  } catch (err) {
    console.error("Error eliminando equipo:", err);
  }

  const updated = teams.filter(t => t.id !== teamId);
  saveTeams(updated);

  return team;
}

/**
 * Limpieza opcional
 */
function removeInactiveTeams() {
  const active = getTeams().filter(t => t.activo);
  saveTeams(active);
  return active;
}

/* ------------------ EXPORTS ------------------ */

module.exports = {
  // base
  getTeams,
  saveTeams,

  // utils
  buildTeams,
  crearEquipos,

  // core
  createTeams,
  findUserTeam,
  getActiveTeams,
  getTeamById,
  saveTeam,

  // lifecycle
  closeTeam,
  deleteTeam,
  removeInactiveTeams
};
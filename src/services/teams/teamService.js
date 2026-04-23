const fs = require("fs");
const path = require("path");

const { shuffle } = require("../../utils/shuffle");
const { LEADER_ROLE } = require("../../config/constants");

const teamsPath = path.join(__dirname, "../../data/teams.json");

/* ------------------ Helpers ------------------ */

function readJSONSafe(filePath) {
  if (!fs.existsSync(filePath)) return [];

  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error parseando JSON:", error.message);
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

function crearEquipos(users, size = 5) {
  const mezclados = shuffle(users);
  const equipos = [];

  for (let i = 0; i < mezclados.length; i += size) {
    equipos.push(mezclados.slice(i, i + size));
  }

  return equipos;
}

/* ------------------ Core ------------------ */

function buildTeams(userIds, size = 5) {
  const grupos = crearEquipos(userIds, size);

  return grupos.map((members, index) => ({
    members,
    index
  }));
}

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

function findUserTeam(userId) {
  const teams = getTeams();

  return (
    teams.find(
      team => team.activo && team.members.includes(userId)
    ) || null
  );
}

function getTeamById(teamId) {
  const teams = getTeams();
  return teams.find(t => t.id === teamId) || null;
}

function saveTeam(updatedTeam) {
  const teams = getTeams();

  const index = teams.findIndex(t => t.id === updatedTeam.id);
  if (index === -1) return null;

  teams[index] = updatedTeam;
  saveTeams(teams);

  return updatedTeam;
}

function getActiveTeams() {
  return getTeams()
    .filter(t => t.activo)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function closeTeam(teamId) {
  const teams = getTeams();

  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  team.activo = false;
  team.closedAt = Date.now();

  saveTeams(teams);

  return team;
}

/* ------------------ Delete Team ------------------ */

async function deleteTeam(client, teamId) {
  const teams = getTeams();
  const team = teams.find(t => t.id === teamId);

  if (!team) return null;

  const guild = client.guilds.cache.first();

  if (!guild) {
    console.error("No se encontró ningún servidor conectado");
    return null;
  }

  try {
    console.log("Eliminando equipo:", team.name);

    const teamRole = await guild.roles.fetch(team.id).catch(() => null);

    const leaderRole = guild.roles.cache.find(
      role => role.name === LEADER_ROLE
    );

    for (const memberId of team.members) {
      const member = await guild.members.fetch(memberId).catch(() => null);

      if (!member) continue;

      if (teamRole) {
        await member.roles.remove(teamRole).catch(() => null);
      }

      if (leaderRole) {
        await member.roles.remove(leaderRole).catch(() => null);
      }
    }

    const channel = await guild.channels
      .fetch(team.canalId)
      .catch(() => null);

    if (channel) {
      await channel.delete().catch(() => null);
      console.log("Canal eliminado:", team.canalId);
    }

    if (teamRole) {
      await teamRole.delete().catch(() => null);
      console.log("Rol de equipo eliminado:", team.id);
    }

    console.log(`Equipo eliminado correctamente: ${team.name}`);
  } catch (error) {
    console.error("Error eliminando equipo:", error);
  }

  const updated = teams.filter(t => t.id !== teamId);
  saveTeams(updated);

  return team;
}

/* ------------------ Cleanup ------------------ */

function removeInactiveTeams() {
  const active = getTeams().filter(t => t.activo);
  saveTeams(active);
  return active;
}

/* ------------------ Exports ------------------ */

module.exports = {
  getTeams,
  saveTeams,

  buildTeams,
  crearEquipos,

  createTeams,
  findUserTeam,
  getActiveTeams,
  getTeamById,
  saveTeam,

  closeTeam,
  deleteTeam,
  removeInactiveTeams
};
// /services/teams/teamLifecycleService.js

const { getTeams, saveTeams, deleteTeam } = require("./teamService");

async function processTeamLifecycle(client) {
  const teams = getTeams();
  const now = Date.now();

  let updatedTeams = [];

  for (const team of teams) {
    try {
      // protección: equipos antiguos sin estructura nueva
      if (!team.expiresAt) {
        updatedTeams.push(team);
        continue;
      }

      const timeLeft = team.expiresAt - now;

      //  Aviso 24h (solo una vez)
      if (
        timeLeft <= 24 * 60 * 60 * 1000 &&
        timeLeft > 0 &&
        !team.notified24h
      ) {
        try {
          const channel = await client.channels.fetch(team.canalId).catch(() => null);

          if (channel) {
            await channel.send("⚠️ Este equipo será eliminado en menos de 24 horas.");
          }

          team.notified24h = true;
        } catch (err) {
          console.error("Error enviando aviso:", err);
        }
      }

      // Expiración
      if (timeLeft <= 0) {
        console.log(`⏳ Eliminando equipo expirado: ${team.name}`);
        await deleteTeam(client, team.id);
        continue;
      }

      updatedTeams.push(team);

    } catch (err) {
      console.error("Error procesando equipo:", team.name, err);
      updatedTeams.push(team); 
    }
  }

  saveTeams(updatedTeams);
}

module.exports = {
  processTeamLifecycle
};
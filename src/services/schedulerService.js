// /services/schedulerService.js

const { processTeamLifecycle } = require("./teams/teamLifecycleService");

function startScheduler(client) {
  console.log("🕒 Scheduler iniciado");

  setInterval(async () => {
    try {
      await processTeamLifecycle(client);
    } catch (err) {
      console.error("Error en scheduler:", err);
    }
  }, 60 * 1000); 
}

module.exports = { startScheduler };
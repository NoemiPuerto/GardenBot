const { SlashCommandBuilder } = require("discord.js");
const { getActiveTeams, deleteTeam } = require("../services/teams/teamService");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("eliminar-equipo")
    .setDescription("Elimina un equipo por número")
    .addIntegerOption(option =>
      option
        .setName("numero")
        .setDescription("Número del equipo (usa /equipos para verlo)")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply("❌ No tienes permisos");
    }

    const numero = interaction.options.getInteger("numero");
    const teams = getActiveTeams();

    if (teams.length === 0) {
      return interaction.reply("❌ No hay equipos activos");
    }

    if (numero < 1 || numero > teams.length) {
      return interaction.reply(`❌ Número inválido. Hay ${teams.length} equipos.`);
    }

    const team = teams[numero - 1];

    try {
      await deleteTeam(interaction.client, team.id);

      await interaction.reply(`🗑️ Equipo eliminado: **${team.name}**`);

    } catch (error) {
      console.error(error);
      await interaction.reply("❌ Error al eliminar equipo");
    }
  }
};
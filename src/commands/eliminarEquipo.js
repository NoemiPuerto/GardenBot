const { SlashCommandBuilder } = require("discord.js");
const {
  getActiveTeams,
  deleteTeam
} = require("../services/teams/teamService");

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
    try {
      await interaction.deferReply({ flags: 64 });

      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.editReply("❌ No tienes permisos");
      }

      const numero = interaction.options.getInteger("numero");
      const teams = getActiveTeams();

      if (teams.length === 0) {
        return interaction.editReply("❌ No hay equipos activos");
      }

      if (numero < 1 || numero > teams.length) {
        return interaction.editReply(
          `❌ Número inválido. Hay ${teams.length} equipos.`
        );
      }

      const team = teams[numero - 1];

      await deleteTeam(interaction.client, team.id);

      await interaction.editReply(
        `🗑️ Equipo eliminado: **${team.name}**`
      );

    } catch (error) {
      console.error("Error en eliminar-equipo:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(
          "❌ Error al eliminar equipo"
        );
      } else {
        await interaction.reply({
          content: "❌ Error al eliminar equipo",
          flags: 64
        });
      }
    }
  }
};
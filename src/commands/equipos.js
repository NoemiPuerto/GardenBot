const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getActiveTeams } = require("../services/teams/teamService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("equipos")
    .setDescription("Muestra los equipos activos"),

  async execute(interaction) {
    const teams = getActiveTeams();

    if (teams.length === 0) {
      return interaction.reply("❌ No hay equipos activos");
    }

    const embed = new EmbedBuilder()
      .setColor("#5865F2")
      .setTitle("📋 Equipos activos")
      .setDescription("Usa `/eliminar-equipo numero:X` para eliminar uno")
      .setTimestamp();

    teams.forEach((team, index) => {
      const members = team.members
        .map(id => id === team.leader ? `👑 <@${id}>` : `<@${id}>`)
        .join(", ");

      embed.addFields({
        name: `#${index + 1} • ${team.name}`,
        value: `👥 ${members}`
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
};
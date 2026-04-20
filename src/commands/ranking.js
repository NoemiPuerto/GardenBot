const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const userService = require("../services/users/userService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ranking")
    .setDescription("Muestra el ranking global"),

  async execute(interaction) {
    const usersObj = userService.getAllUsers();

    const users = Object.entries(usersObj).map(([id, data]) => ({
      id,
      points: data.points || 0
    }));

    if (users.length === 0) {
      return interaction.reply("No hay datos aún");
    }

    const sorted = users.sort((a, b) => b.points - a.points);

    const medals = ["🥇", "🥈", "🥉"];

    let description = "";

    sorted.slice(0, 10).forEach((user, index) => {
      const medal = medals[index] || `\`${index + 1}.\``;

      const isCurrentUser = user.id === interaction.user.id;

      description += isCurrentUser
        ? `👉 ${medal} <@${user.id}> — **${user.points} pts**\n`
        : `${medal} <@${user.id}> — ${user.points} pts\n`;
    });

    const currentUserIndex = sorted.findIndex(
      u => u.id === interaction.user.id
    );

    let footerText = "Sigue subiendo proyectos 🚀";

    if (currentUserIndex !== -1) {
      const user = sorted[currentUserIndex];

      footerText = `Tu posición: #${currentUserIndex + 1} con ${user.points} pts`;
    }

    const embed = new EmbedBuilder()
      .setColor("#FEE75C")
      .setTitle("🏆 Ranking Global")
      .setDescription(description)
      .setFooter({ text: footerText })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
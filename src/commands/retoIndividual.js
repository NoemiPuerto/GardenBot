const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const poolChallengeService = require("../services/challenges/poolChallengeService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reto-individual")
    .setDescription("Obtén un reto individual de programación")

    .addStringOption(option =>
      option
        .setName("categoria")
        .setDescription("Selecciona una categoría")
        .setRequired(true)
        .addChoices(
          { name: "Web", value: "web" },
          { name: "Lógica", value: "logic" },
          { name: "Mobile", value: "mobile" }
        )
    )

    .addStringOption(option =>
      option
        .setName("dificultad")
        .setDescription("Selecciona la dificultad")
        .setRequired(true)
        .addChoices(
          { name: "Fácil", value: "easy" },
          { name: "Medio", value: "medium" },
          { name: "Difícil", value: "hard" }
        )
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      const categoria = interaction.options.getString("categoria");
      const dificultad = interaction.options.getString("dificultad");

      const reto = poolChallengeService.assignChallengeToUser(userId, {
        type: "individual",
        category: categoria,
        difficulty: dificultad
      });

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`💻 ${reto.title}`)
        .setDescription(`🧠 ${reto.description}`)

        .addFields(
          {
            name: "📂 Categoría",
            value: `\`${reto.category}\``,
            inline: true
          },
          {
            name: "🎯 Dificultad",
            value: `\`${reto.difficulty}\``,
            inline: true
          },
          {
            name: "🏆 Puntos",
            value: `\`${reto.points}\``,
            inline: true
          }
        )

        .setFooter({
          text: "📤 Usa /submit para entregar tu proyecto"
        })
        .setTimestamp();

      // Imagen opcional
      if (reto.image) {
        embed.setImage(reto.image);
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true
      });
    }
  }
};
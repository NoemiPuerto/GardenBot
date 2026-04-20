const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mentorChallengeService = require("../services/challenges/mentorChallengeService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("asignar-reto")
    .setDescription("Asigna automáticamente un reto mensual a todos los equipos"),

  async execute(interaction) {
    try {
      const member = interaction.member;

      //  Validar rol mentor
      const isMentor = member.roles.cache.some(role =>
        role.name.toLowerCase().includes("mentor")
      );

      if (!isMentor) {
        return interaction.reply({
          content: "❌ Solo mentores pueden usar este comando",
          ephemeral: true
        });
      }

      // Asignar reto random a todos
      const result = mentorChallengeService.assignRandomChallengeToAllTeams();
      const challenge = result.challenge;

      //  Fallbacks seguros
      const description = challenge.description || "Sin descripción disponible";
      const difficulty = challenge.difficulty || "N/A";
      const category = challenge.category || "N/A";
      const tags = challenge.tags?.length
        ? challenge.tags.join(", ")
        : "N/A";

      const requirements = challenge.requirements?.length
        ? challenge.requirements.map(r => `• ${r}`).join("\n")
        : "N/A";

      //  EMBED COMPLETO
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle(`🔥 ${challenge.title}`)
        .setDescription(description)

        .addFields(
          {
            name: "🏆 Puntos",
            value: `${challenge.points}`,
            inline: true
          },
          {
            name: "🎯 Dificultad",
            value: difficulty,
            inline: true
          },
          {
            name: "📂 Categoría",
            value: category,
            inline: true
          },
          {
            name: "🏷 Tecnologías",
            value: tags
          },
          {
            name: "📋 Requisitos",
            value: requirements
          },
          {
            name: "👥 Equipos asignados",
            value: `${result.teamsAssigned}`,
            inline: true
          }
        )

        .setFooter({
          text: "¡Es hora de construir! 💻🔥"
        })
        .setTimestamp();

      //  Imagen 
      if (challenge.image && challenge.image.startsWith("http")) {
        embed.setImage(challenge.image);
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
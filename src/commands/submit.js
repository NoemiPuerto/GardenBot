const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");

const submissionService = require("../services/challenges/submissionService");
const poolChallengeService = require("../services/challenges/poolChallengeService");
const mentorChallengeService = require("../services/challenges/mentorChallengeService");
const userService = require("../services/users/userService");
const teamService = require("../services/teams/teamService");
const { deleteTeam } = require("../services/teams/teamService"); 
const { getRandomGif } = require("../utils/gifService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Envía tu proyecto")
    .addStringOption(option =>
      option
        .setName("repo")
        .setDescription("Link del repositorio")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const repo = interaction.options.getString("repo");

      const user = userService.getUser(userId);
      const team = teamService.findUserTeam(userId);

      const hasTeam = Boolean(team && team.activeChallenge);
      const hasIndividual = Boolean(
        user.activeChallenges &&
        user.activeChallenges.individual
      );

      // =========================
      // CORE FLOW
      // =========================

      const runFlow = async (tipo) => {
        let challenge = null;
        let embed;

        // =========================
        // TEAM FLOW
        // =========================

        if (tipo === "team") {
          if (!hasTeam) throw new Error("No tienes reto de equipo activo");

          challenge = mentorChallengeService.getTeamActiveChallenge(team.id);
          if (!challenge) throw new Error("Reto de equipo no encontrado");

          const points = challenge.points;

          // dar puntos a todos
          for (const memberId of team.members) {
            userService.addPoints(memberId, points);
          }

          // guardar historial antes de eliminar
          team.challengeHistory.push({
            challengeId: challenge.id,
            completedAt: Date.now(),
            repo
          });

          teamService.saveTeam(team); // guardamos progreso

          await deleteTeam(interaction.client, team.id);

          embed = new EmbedBuilder()
            .setColor("#FEE75C")
            .setTitle("🚀 Reto de equipo completado")
            .setDescription(`El equipo **${team.name}** ha completado su reto`)
            .addFields(
              {
                name: "👥 Miembros",
                value: team.members.map(id => `<@${id}>`).join(", ")
              },
              {
                name: "🏆 Puntos",
                value: `+${points} para cada miembro`
              },
              {
                name: "🔗 Repo",
                value: repo
              }
            );
        }

        // =========================
        // INDIVIDUAL FLOW
        // =========================

        else {
          const active = user.activeChallenges?.individual;

          if (!active) throw new Error("No tienes reto individual activo");

          challenge = poolChallengeService
            .getAllChallenges()
            .find(c => c.id === active.challengeId);

          if (!challenge) throw new Error("Reto no encontrado");

          submissionService.submitChallenge(userId, repo);

          const updatedUser = userService.getUser(userId);

          embed = new EmbedBuilder()
            .setColor("#57F287")
            .setTitle("🎉 Reto completado")
            .setDescription(
              `Buen trabajo <@${userId}> 🚀\n\n` +
              `Completaste **${challenge.title}**`
            )
            .addFields(
              {
                name: "🏆 Puntos ganados",
                value: `+${challenge.points}`,
                inline: true
              },
              {
                name: "📊 Total",
                value: `${updatedUser.points}`,
                inline: true
              },
              {
                name: "🔗 Repositorio",
                value: repo
              }
            );
        }

        const gif = await getRandomGif();
        if (gif) embed.setImage(gif);
        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      };

      // =========================
      // DECISIÓN
      // =========================

      if (!hasTeam && !hasIndividual) {
        return interaction.reply({
          content: "❌ No tienes ningún reto activo",
          flags: 64
        });
      }

      // 🔘 BOTONES
      if (hasTeam && hasIndividual) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("submit_individual")
            .setLabel("🟢 Individual")
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId("submit_team")
            .setLabel("🔵 Equipo")
            .setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.reply({
          content: "Tienes varios retos activos. ¿Cuál quieres enviar?",
          components: [row],
          flags: 64,
          fetchReply: true
        });

        const buttonInteraction = await message.awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 15000,
          filter: i => i.user.id === userId
        });

        const tipo =
          buttonInteraction.customId === "submit_team"
            ? "team"
            : "individual";

        await buttonInteraction.deferUpdate();

        await interaction.deferReply();
        await runFlow(tipo);
        return;
      }

      // 🟢 DIRECTO
      await interaction.deferReply();

      if (hasTeam) {
        await runFlow("team");
      } else {
        await runFlow("individual");
      }

    } catch (error) {
      console.error("💥 ERROR:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: `❌ ${error.message}`
          });
        } else {
          await interaction.reply({
            content: `❌ ${error.message}`,
            flags: 64
          });
        }
      } catch (err) {
        console.error("Error manejando interacción:", err);
      }
    }
  }
};
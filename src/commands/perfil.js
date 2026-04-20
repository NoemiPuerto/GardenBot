const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const userService = require("../services/users/userService");
const teamService = require("../services/teams/teamService");
const poolChallengeService = require("../services/challenges/poolChallengeService");
const mentorChallengeService = require("../services/challenges/mentorChallengeService");
const submissionService = require("../services/challenges/submissionService");

// ------------------ Utils ------------------

function getLevel(points) {
  return Math.floor(points / 100) + 1;
}

function getProgressBar(points) {
  const currentLevelPoints = points % 100;
  const percentage = currentLevelPoints / 100;

  const totalBars = 10;
  const filled = Math.round(percentage * totalBars);

  return "█".repeat(filled) + "░".repeat(totalBars - filled);
}

function calculateRank(userId) {
  const users = userService.getAllUsers();

  const list = Object.entries(users).map(([id, data]) => ({
    id,
    points: data.points || 0
  }));

  list.sort((a, b) => b.points - a.points);

  return list.findIndex(u => u.id === userId) + 1;
}

function calculateStreak(userId) {
  const submissions = submissionService.getSubmissions()
    .filter(s => s.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (submissions.length === 0) return 0;

  let streak = 1;

  for (let i = 1; i < submissions.length; i++) {
    const prev = new Date(submissions[i - 1].createdAt);
    const curr = new Date(submissions[i].createdAt);

    const diff = (prev - curr) / (1000 * 60 * 60 * 24);

    if (diff <= 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ------------------ Achievements ------------------

const achievements = [
  {
    name: "🥇 Primer Reto",
    check: (user) => user.stats.totalCompleted >= 1
  },
  {
    name: "🔥 5 Retos",
    check: (user) => user.stats.totalCompleted >= 5
  },
  {
    name: "💀 Modo Difícil",
    check: (user) => user.stats.byDifficulty.hard >= 3
  },
  {
    name: "🚀 10 Retos",
    check: (user) => user.stats.totalCompleted >= 10
  }
];

// ------------------ Command ------------------

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perfil")
    .setDescription("Muestra tu perfil avanzado"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const discordUser = interaction.user;

      const user = userService.getUser(userId);

      // =========================
      // STATS
      // =========================
      const points = user.points || 0;
      const level = getLevel(points);
      const progressBar = getProgressBar(points);

      const rank = calculateRank(userId);
      const streak = calculateStreak(userId);

      const individualCount = user.completedChallenges.filter(
        c => c.type === "individual"
      ).length;

      let teamCompleted = 0;
      const teams = teamService.getTeams();

      teams.forEach(team => {
        if (team.members.includes(userId)) {
          teamCompleted += (team.challengeHistory || []).length;
        }
      });

      // =========================
      // ACTIVO
      // =========================
      let activeText = "Ninguno";

      if (user.activeChallenge) {
        const ch = poolChallengeService
          .getAllChallenges()
          .find(c => c.id === user.activeChallenge.challengeId);

        if (ch) activeText = `💻 ${ch.title}`;
      }

      const team = teamService.findUserTeam(userId);
      if (team && team.activeChallenge) {
        const ch = mentorChallengeService.getTeamActiveChallenge(team.id);
        if (ch) activeText = `👥 ${ch.title}`;
      }

      // =========================
      // LOGROS
      // =========================
      const unlocked = achievements
        .filter(a => a.check(user))
        .map(a => `✅ ${a.name}`);

      const locked = achievements
        .filter(a => !a.check(user))
        .map(a => `🔒 ${a.name}`);

      const achievementsText =
        [...unlocked, ...locked].slice(0, 6).join("\n");

      // =========================
      // EMBED
      // =========================
      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setAuthor({
          name: discordUser.username,
          iconURL: discordUser.displayAvatarURL()
        })
        .setTitle(`🧩 Nivel ${level}`)

        .setDescription(
          `📊 **Progreso:**\n${progressBar} (${points % 100}/100 XP)`
        )

        .addFields(
          {
            name: "🏆 Puntos",
            value: `\`${points}\``,
            inline: true
          },
          {
            name: "🥇 Ranking",
            value: `#${rank}`,
            inline: true
          },
          {
            name: "🔥 Streak",
            value: `${streak} días`,
            inline: true
          },
          {
            name: "💻 Individuales",
            value: `\`${individualCount}\``,
            inline: true
          },
          {
            name: "👥 Equipo",
            value: `\`${teamCompleted}\``,
            inline: true
          },
          {
            name: "🎯 Activo",
            value: activeText
          },
          {
            name: "🎖 Logros",
            value: achievementsText || "Sin logros aún"
          }
        )

        .setThumbnail(discordUser.displayAvatarURL({ size: 256 }))
        .setFooter({
          text: "Sigue avanzando 🚀"
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      await interaction.reply({
        content: "❌ Error al cargar el perfil",
        ephemeral: true
      });
    }
  }
};
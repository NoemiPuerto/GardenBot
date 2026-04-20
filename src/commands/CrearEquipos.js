const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { buildTeams, createTeams } = require("../services/teams/teamService");
const { getRandomTeamName } = require("../utils/teamNames");
const { PARTICIPANT_ROLE, LEADER_ROLE, TEAM_SIZE } = require("../config/constants");
const { canCreateTeams, updateLastCreated } = require("../services/teams/teamConfigService");
const { getRandomItem } = require("../utils/shuffle");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crear-equipos")
    .setDescription("Crea equipos automáticamente"),

  async execute(interaction) {
    const guild = interaction.guild;

    try {
      await interaction.deferReply();

      //  bloqueo por tiempo
      if (!canCreateTeams()) {
        return interaction.editReply("⚠️ Ya se crearon equipos recientemente. Espera 30 días.");
      }

      //  limpiar roles anteriores (usuarios)
      for (const member of guild.members.cache.values()) {
        for (const role of member.roles.cache.values()) {
          if (role.name.startsWith("TEAM_")) {
            await member.roles.remove(role).catch(() => {});
          }
        }
      }

      //  eliminar roles del servidor
      for (const role of guild.roles.cache.values()) {
        if (role.name.startsWith("TEAM_")) {
          await role.delete().catch(() => {});
        }
      }

      //  rol participante
      const role = guild.roles.cache.find(r => r.name === PARTICIPANT_ROLE);

      if (!role) {
        return interaction.editReply("❌ No existe el rol Participante");
      }

      const members = role.members.map(m => m.id);

      if (members.length === 0) {
        return interaction.editReply("❌ No hay participantes");
      }

      //  construir equipos
      const equipos = buildTeams(members, TEAM_SIZE);

      //  rol líder
      let leaderRole = guild.roles.cache.find(r => r.name === LEADER_ROLE);
      if (!leaderRole) {
        leaderRole = await guild.roles.create({ name: LEADER_ROLE });
      }

      const teamsForDB = [];

      for (let i = 0; i < equipos.length; i++) {
        const teamMembers = equipos[i].members;

        const rawName = getRandomTeamName();
        const teamName = `TEAM_${rawName}`;

        //  rol
        const teamRole = await guild.roles.create({
          name: teamName,
          reason: "Nuevo equipo creado"
        });

        //  canal
        const channel = await guild.channels.create({
          name: rawName.toLowerCase().replace(/\s+/g, "-"),
          type: 0,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: ["ViewChannel"]
            },
            {
              id: teamRole.id,
              allow: ["ViewChannel", "SendMessages"]
            },
            {
              id: interaction.client.user.id,
              allow: ["ViewChannel", "SendMessages", "ManageChannels"]
            }
          ]
        });

        await channel.send(
          "⚠️ Este canal será eliminado en 30 días.\nGuarden información importante."
        );

        // líder
        const leaderId = getRandomItem(teamMembers);

        // 👥 asignar roles
        for (const userId of teamMembers) {
          const member = await guild.members.fetch(userId);

          await member.roles.add(teamRole).catch(() => {});
          if (userId === leaderId) {
            await member.roles.add(leaderRole).catch(() => {});
          }
        }

        // guardar 
        teamsForDB.push({
          roleId: teamRole.id,
          name: rawName,
          members: teamMembers,
          leader: leaderId,
          channelId: channel.id 
        });
      }

      const savedTeams = createTeams(teamsForDB);

      updateLastCreated();

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("🚀 Equipos creados")
        .setTimestamp();

      savedTeams.forEach(team => {
        const members = team.members
          .map(id => id === team.leader ? `👑 <@${id}>` : `<@${id}>`)
          .join(", ");

        embed.addFields({
          name: `💥 ${team.name}`,
          value: `👑 Líder: <@${team.leader}>\n👥 ${members}`
        });
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("Error en crear-equipos:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply("❌ Error al crear equipos");
      } else {
        await interaction.reply({
          content: "❌ Error al crear equipos",
          flags: 64
        });
      }
    }
  }
};
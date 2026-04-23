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

      if (!canCreateTeams()) {
        return interaction.editReply("⚠️ Ya se crearon equipos recientemente. Espera 30 días.");
      }

      //  rol participante
      const role = guild.roles.cache.find(r => r.name === PARTICIPANT_ROLE);

      if (!role) {
        return interaction.editReply("❌ No existe el rol Participante");
      }

      console.log("⏳ Cargando miembros del servidor...");

      // FETCH UNA SOLA VEZ (CLAVE)
      const fetchedMembers = await guild.members.fetch({ withPresences: false });

      console.log("✅ Miembros cargados:", fetchedMembers.size);

      // FILTRAR PARTICIPANTES
      const members = [];

      for (const member of fetchedMembers.values()) {
        if (member.roles.cache.has(role.id)) {
          members.push(member.id);
        }
      }

      console.log("👥 PARTICIPANTES DETECTADOS:", members);

      if (members.length === 0) {
        return interaction.editReply("❌ No hay participantes");
      }

      // =========================
      // LIMPIAR SOLO PARTICIPANTES
      // =========================
      console.log("🧹 Limpiando roles anteriores...");

      for (const userId of members) {
        const member = fetchedMembers.get(userId);

        if (!member) continue;

        for (const r of member.roles.cache.values()) {
          if (r.name.startsWith("TEAM_")) {
            await member.roles.remove(r).catch(() => {});
          }
        }
      }

      // eliminar roles del servidor
      for (const r of guild.roles.cache.values()) {
        if (r.name.startsWith("TEAM_")) {
          await r.delete().catch(() => {});
        }
      }

      console.log("🎯 Creando equipos...");

      // =========================
      // CREAR EQUIPOS
      // =========================
      const equipos = buildTeams(members, TEAM_SIZE);

      let leaderRole = guild.roles.cache.find(r => r.name === LEADER_ROLE);
      if (!leaderRole) {
        leaderRole = await guild.roles.create({ name: LEADER_ROLE });
      }

      const teamsForDB = [];

      for (let i = 0; i < equipos.length; i++) {
        const teamMembers = equipos[i].members;

        const rawName = getRandomTeamName();
        const teamName = `TEAM_${rawName}`;

        const teamRole = await guild.roles.create({
          name: teamName,
          reason: "Nuevo equipo creado"
        });

        const channel = await guild.channels.create({
          name: rawName.toLowerCase().replace(/\s+/g, "-"),
          type: 0,
          permissionOverwrites: [
            { id: guild.id, deny: ["ViewChannel"] },
            { id: teamRole.id, allow: ["ViewChannel", "SendMessages"] },
            {
              id: interaction.client.user.id,
              allow: ["ViewChannel", "SendMessages", "ManageChannels"]
            }
          ]
        });

        await channel.send("⚠️ Este canal será eliminado en 30 días.");

        const leaderId = getRandomItem(teamMembers);

        for (const userId of teamMembers) {
          const member = fetchedMembers.get(userId);

          if (!member) continue;

          await member.roles.add(teamRole).catch(() => {});
          if (userId === leaderId) {
            await member.roles.add(leaderRole).catch(() => {});
          }
        }

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

      // =========================
      //  RESPUESTA
      // =========================
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
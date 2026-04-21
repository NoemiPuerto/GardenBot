require("dotenv").config();

console.log("🚀 Iniciando bot...");

const { fetchGifs } = require("./utils/gifService");
const { startScheduler } = require("./services/schedulerService");

const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

// SERVIDOR WEB (para Render / uptime)
const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot activo 🚀");
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web activo en puerto ${PORT}`);
});

// CLIENTE DISCORD 
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages 
  ]
});

console.log("🔐 TOKEN cargado:", process.env.TOKEN ? "OK" : "FALTANTE");

//  CARGAR COMANDOS
client.commands = new Map();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);

  console.log(`📦 Comando cargado: ${command.data.name}`);
}

//  READY
client.once("ready", async () => {
  console.log(`✅ Bot listo como ${client.user.tag}`);

  try {
    await fetchGifs();
    console.log("🎞️ GIFs cargados correctamente");
  } catch (err) {
    console.error("❌ Error cargando GIFs:", err);
  }

  //  iniciar scheduler
  startScheduler(client);

  console.log("📡 Servidores conectados:");
  client.guilds.cache.forEach(guild => {
    console.log(`- ${guild.name} (${guild.id})`);
  });
});

//  MANEJO DE COMANDOS
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.warn(`⚠️ Comando no encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    console.log(`⚡ Ejecutando: ${interaction.commandName}`);

    await command.execute(interaction);

  } catch (error) {
    console.error("❌ Error ejecutando comando:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ Hubo un error ejecutando el comando",
        flags: 64
      });
    } else {
      await interaction.reply({
        content: "❌ Hubo un error ejecutando el comando",
        flags: 64
      });
    }
  }
});

//  LOGIN
client.login(process.env.TOKEN);
require("dotenv").config();
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  try {
    console.log("Cargando:", file);

    const command = require(`./commands/${file}`);

    if (!command.data) {
      console.log(`❌ ERROR: ${file} no tiene 'data'`);
      continue;
    }

    commands.push(command.data.toJSON());
    console.log(`✅ OK: ${file}`);

  } catch (error) {
    console.log(`💥 ERROR cargando ${file}`);
    console.error(error);
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Registrando comandos...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Comandos registrados correctamente");
  } catch (error) {
    console.error(error);
  }
})();
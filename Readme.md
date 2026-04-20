# 🤖 Discord Challenges Bot

> Organiza retos de programación en comunidad, gestiona equipos automáticamente y mantén un ranking competitivo — todo desde Discord.

---

## ¿Qué es y qué problema resuelve?

Muchas comunidades de desarrollo quieren hacer retos colectivos, pero coordinarlos a mano es un caos: asignar equipos, comunicar el reto, llevar el puntaje, mantener el ranking... todo termina en un canal desorganizado y participación que decae con el tiempo.

**Garden bot** automatiza todo ese flujo. Con un solo comando, el bot toma a todos los usuarios con un rol determinado, los divide en equipos equilibrados, les asigna roles dinámicos dentro del servidor, elige un líder por equipo y publica el reto. A partir de ahí, el sistema gestiona puntuación, ranking y comunicación entre equipos de forma estructurada.

El resultado: una experiencia de reto profesional, dentro del servidor que ya usan todos.

---

## ✨ Features

### 🧩 Formación automática de equipos
El bot detecta todos los miembros con un rol específico (por ejemplo, `Participante`) y los distribuye en equipos de tamaño configurable. No hace falta coordinar nada a mano.

### 🏷️ Roles dinámicos por equipo
Cada equipo recibe un rol propio dentro del servidor (`Equipo 1`, `Equipo 2`, etc.), lo que permite mención directa, canales privados y una identidad clara para cada grupo.

### 👑 Selección automática de líder
Por cada equipo, el bot designa un líder aleatoriamente (o el primero en registrarse, según configuración). El líder es el punto de contacto oficial del equipo.

### 📋 Asignación de retos
Los administradores pueden publicar retos semanales o mensuales directamente desde Discord. El reto incluye título, descripción, fecha límite y criterios de evaluación visibles para todos.

### 🏆 Sistema de puntuación flexible
Los puntos se pueden asignar de dos formas:
- **Manual por admin**: un administrador otorga puntos al equipo tras revisar la entrega.
- **Por votación**: la comunidad vota el mejor proyecto y el bot calcula el resultado automáticamente.

Ambos métodos pueden combinarse según las reglas de cada reto.

### 📊 Ranking global
El bot mantiene un ranking actualizado de todos los equipos, visible para cualquier miembro del servidor. Se actualiza en tiempo real cada vez que se asignan puntos.

### 🔒 Canales privados por equipo
Cada equipo puede tener su propio canal de texto privado, accesible solo por sus miembros y los administradores. Ideal para coordinación interna sin ruido externo.

### 💾 Persistencia de datos
Toda la información (equipos, puntos, historial de retos) se almacena de forma persistente y sobrevive reinicios del bot.

---

## 🔄 Cómo funciona el sistema

El flujo completo de un ciclo de reto tiene tres fases:

**1. Preparación**
Un administrador ejecuta el comando de inicio. El bot lee los miembros con el rol `Participante`, los divide en equipos, crea los roles correspondientes en el servidor, asigna líderes y (opcionalmente) crea canales privados por equipo.

**2. Ejecución del reto**
El administrador publica el reto con título, descripción y fecha límite. Cada equipo trabaja de forma independiente durante el período establecido. Al finalizar, los equipos envían su entrega (enlace, repositorio, demo, etc.) al canal designado.

**3. Evaluación y resultados**
El administrador (y/o la comunidad) evalúa las entregas y asigna puntos. El bot actualiza el ranking global de forma inmediata y anuncia al equipo ganador del ciclo.

---

## 🏗️ Arquitectura

El proyecto está organizado en capas bien separadas, lo que facilita el mantenimiento y la extensión del sistema:

```
discord-challenges-bot/
├── commands/       # Slash commands de Discord (interfaz de usuario)
├── services/       # Lógica de negocio (equipos, puntuación, retos)
├── data/           # Capa de persistencia (JSON, escalable a base de datos)
├── utils/          # Funciones auxiliares reutilizables
└── config/         # Constantes y configuración global del sistema
```

**`commands/`** — Todo lo que el usuario ve y ejecuta. Cada archivo corresponde a un slash command de Discord. No contiene lógica de negocio.

**`services/`** — El núcleo del bot. Aquí vive la lógica para formar equipos, calcular puntuación, gestionar retos y actualizar rankings. Esta capa no sabe nada de Discord directamente.

**`data/`** — Abstracción de almacenamiento. Actualmente usa archivos JSON, pero la interfaz está diseñada para reemplazarse por una base de datos sin tocar el resto del código.

**`utils/`** — Helpers reutilizables: formateo de mensajes, validaciones, generadores de embeds, etc.

**`config/`** — Centraliza todas las constantes del sistema: nombres de roles, tamaño de equipos, emojis, colores de embeds, etc.

---

## 💻 Uso del bot

Todos los comandos son slash commands nativos de Discord (`/`).

### Comandos de administración

| Comando | Descripción |
|---|---|
| `/setup-teams` | Forma equipos automáticamente a partir del rol configurado |
| `/create-challenge` | Publica un nuevo reto con título, descripción y fecha límite |
| `/add-points [equipo] [puntos]` | Asigna puntos manualmente a un equipo |
| `/reset-teams` | Disuelve los equipos actuales y limpia los roles |
| `/end-challenge` | Cierra el reto activo y anuncia resultados |

### Comandos públicos

| Comando | Descripción |
|---|---|
| `/ranking` | Muestra el ranking global actualizado de equipos |
| `/my-team` | Muestra la información del equipo del usuario |
| `/challenge` | Muestra el reto activo con todos sus detalles |
| `/vote [equipo]` | Emite un voto para un equipo (si el modo votación está activo) |

---

## 👥 Sistema de equipos

### Formación
Al ejecutar `/setup-teams`, el bot:
1. Obtiene todos los miembros con el rol `Participante` (o el configurado).
2. Los mezcla aleatoriamente para evitar sesgos.
3. Los divide en grupos del tamaño definido en la configuración (por defecto: 4 miembros).
4. Crea un rol por equipo (`Equipo 1`, `Equipo 2`...) y lo asigna.
5. Selecciona un líder por equipo y lo notifica por DM.
6. Opcionalmente, crea canales de texto privados por equipo.

### Gestión durante el reto
- Los líderes son mencionados automáticamente en las comunicaciones del reto.
- Los canales privados permiten coordinación interna sin interferencia.
- El bot puede enviar recordatorios automáticos antes de la fecha límite.

### Cierre de ciclo
Al terminar el reto, los roles y canales pueden eliminarse automáticamente o conservarse según la configuración, dejando el servidor listo para el siguiente ciclo.

---

## 🏆 Sistema de ranking

### Cálculo de puntos
Cada equipo parte desde cero en cada ciclo. Los puntos se acumulan de la siguiente forma:

- **Entrega completa**: el administrador asigna puntos base según calidad y cumplimiento.
- **Votos de la comunidad**: si el modo votación está activo, los votos se convierten en puntos adicionales con un multiplicador configurable.
- **Bonus opcionales**: el administrador puede otorgar puntos extra por creatividad, presentación, documentación, etc.

### Ranking global
El ranking acumula puntos a lo largo de todos los ciclos. Un equipo puede ganar un reto y aun así estar por debajo de otro en el ranking general si ese equipo ha participado en más ciclos.

El comando `/ranking` muestra:
- Posición de cada equipo
- Puntos totales acumulados
- Número de retos completados
- Mejor posición histórica

---

## ⚙️ Configuración

### Requisitos del servidor de Discord
- El bot necesita los siguientes permisos: `Manage Roles`, `Manage Channels`, `Send Messages`, `Read Message History`, `Use Slash Commands`.
- Debe existir un rol designado como "participante" (el nombre es configurable).
- Se recomienda un canal exclusivo para anuncios del bot.

### Variables de entorno

```env
DISCORD_TOKEN=tu_token_aqui
CLIENT_ID=id_de_tu_aplicacion
GUILD_ID=id_de_tu_servidor
PARTICIPANT_ROLE=Participante
TEAM_SIZE=4
PRIVATE_CHANNELS=true
```

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/discord-challenges-bot.git
cd discord-challenges-bot

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Registrar slash commands
node deploy-commands.js

# Iniciar el bot
node index.js
```

---

## 📈 Escalabilidad

El bot está construido con separación de capas desde el primer día. La capa de datos utiliza una interfaz abstracta, lo que permite migrar de archivos JSON a cualquier base de datos (PostgreSQL, MongoDB, SQLite) cambiando únicamente los adaptadores en `/data`, sin modificar la lógica de negocio ni los comandos.

Del mismo modo, el sistema de puntuación y el motor de equipos están desacoplados, permitiendo implementar reglas personalizadas por servidor o tipo de reto sin afectar el resto del sistema.

---

## 🎯 Conclusión

**Discord Challenges Bot** convierte cualquier servidor de Discord en una plataforma de retos de programación estructurada y competitiva. Elimina la fricción de coordinar equipos manualmente, mantiene el engagement con rankings visibles y da a los administradores herramientas claras para gestionar cada ciclo.

Es una solución lista para comunidades reales que quieren llevar sus retos al siguiente nivel — sin salir de Discord.

---

<div align="center">
  <sub>Construido con ❤️ para comunidades de desarrollo • Discord.js v14</sub>
</div>
# 🤖 GardenBot

> **Plataforma gamificada de retos técnicos para comunidades universitarias de programación.**
> Diseñada para convertir Discord en un entorno estructurado de aprendizaje continuo, competencia técnica y desarrollo colaborativo.

---

## Índice

- [Visión del Proyecto](#visión-del-proyecto)
- [Características Principales](#características-principales)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Comandos Disponibles](#comandos-disponibles)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Ejecución Local](#ejecución-local)
- [Despliegue en Producción](#despliegue-en-producción)
- [Permisos e Intents de Discord](#permisos-e-intents-de-discord)
- [Registro de Slash Commands](#registro-de-slash-commands)
- [Estado del Proyecto](#estado-del-proyecto)
- [Roadmap](#roadmap)
- [Contribución](#contribución)

---

## Visión del Proyecto

GardenBot Bot nace como respuesta a un problema estructural en la formación técnica universitaria: **la brecha entre el aprendizaje formal y la práctica constante**.

La mayoría de los estudiantes de ingeniería en software tienen acceso a contenido educativo, pero carecen de un entorno que los motive a practicar de forma sostenida, los conecte con sus pares y les dé visibilidad de su propio progreso técnico. El resultado es abandono, desmotivación y una curva de aprendizaje discontinua.

GardenBot convierte Discord —plataforma donde los estudiantes ya conviven— en un entorno gamificado de aprendizaje técnico. Funciona como una combinación de:

- **Bootcamp automatizado** con retos semanales y mensuales progresivos
- **Sistema de competencia técnica** con rankings, puntuación y logros
- **Plataforma de colaboración** estructurada en equipos con liderazgo rotativo
- **Motor de mentoría** donde instructores asignan retos personalizados por cohorte
- **Registro de progreso** técnico individual y grupal a lo largo del tiempo

El objetivo a largo plazo es que cualquier comunidad universitaria de programación pueda desplegar GardenBot y tener operativa una plataforma completa de desarrollo técnico en cuestión de minutos.

---

## Características Principales

### Retos Individuales

Los estudiantes pueden solicitar retos de programación en cualquier momento, seleccionando su área de interés y nivel de dificultad. El sistema asigna un reto aleatorio desde un pool curado de problemas, evitando repetición y adaptando el contenido al perfil del usuario.

- Categorías disponibles: `logic`, `web`, `mobile`
- Niveles de dificultad: `easy`, `medium`, `hard`
- El reto queda registrado como activo en el perfil del usuario
- Un usuario solo puede tener un reto individual activo a la vez

### Retos de Equipo (Mensuales)

Los mentores o administradores asignan retos mensuales a equipos completos. Todos los miembros del equipo comparten el mismo objetivo, fomentando la colaboración y la responsabilidad colectiva.

- Asignación directa por nombre de equipo
- El reto queda vinculado al equipo hasta su resolución o vencimiento
- Compatible con el sistema de submission por equipo

### Sistema de Equipos Automáticos

GardenBot puede crear equipos de forma autónoma a partir de los participantes registrados. El sistema genera automáticamente la estructura completa dentro de Discord: roles, canales privados y liderazgo asignado.

- Agrupación automática de usuarios con rol `Participante`
- Creación de rol de equipo y canal privado por cada grupo
- Asignación aleatoria de líder
- Persistencia completa del estado de los equipos

### Sistema de Submissions

El flujo de entrega de soluciones está diseñado para manejar escenarios complejos de forma transparente para el usuario. Si un estudiante tiene retos activos de distintos tipos simultáneamente, el sistema presenta opciones claras antes de procesar la entrega.

- Detección automática del tipo de reto activo (individual / equipo)
- Interfaz de selección cuando existen retos de ambos tipos
- Acreditación de puntos inmediata al confirmar la entrega
- Registro en historial de submissions
- Limpieza automática del estado activo del reto
- Eliminación de canal y rol del equipo al completar un reto grupal

### Perfil y Rankings

Cada usuario dispone de un perfil persistente con su historial completo de actividad, puntuación acumulada y posición en el ranking de la comunidad.

- Estadísticas individuales detalladas
- Historial de retos completados
- Sistema de puntuación por dificultad
- Ranking comunitario en tiempo real

### Administración

Los administradores disponen de herramientas para gestionar el ciclo de vida de los equipos de forma manual cuando sea necesario.

- Eliminación de equipos con limpieza completa (canal, roles)
- Separación entre cierre lógico y borrado total de la estructura

---

## Arquitectura del Sistema

```
GardenBot-bot/
│
├── commands/                    # Manejadores de slash commands
│   ├── retoIndividual.js        # /reto-individual
│   ├── asignarReto.js           # /asignar-reto
│   ├── submit.js                # /submit
│   ├── crearEquipos.js          # /crear-equipos
│   ├── eliminarEquipo.js        # /eliminar-equipo
│   └── perfil.js                # /perfil
│
├── services/                    # Lógica de negocio
│   ├── challenges/
│   │   ├── poolChallengeService.js      # Gestión de retos del pool
│   │   ├── mentorChallengeService.js    # Gestión de retos de mentores
│   │   └── submissionService.js        # Procesamiento de submissions
│   ├── teams/
│   │   └── teamService.js              # Creación y gestión de equipos
│   ├── users/
│   │   └── userService.js              # Perfiles y datos de usuario
│   └── ranking/
│       └── rankingService.js           # Cálculo y consulta de rankings
│
├── data/                        # Persistencia de datos (JSON)
│   ├── challenges/
│   │   ├── mentor/
│   │   │   └── monthlyChallenges.json  # Retos asignados por mentores
│   │   └── pool/
│   │       ├── logic.json              # Pool de retos de lógica
│   │       ├── web.json                # Pool de retos web
│   │       └── mobile.json            # Pool de retos mobile
│   ├── users.json               # Perfiles, progreso y retos activos
│   ├── teams.json               # Estado y configuración de equipos
│   └── submissions.json         # Historial de entregas
│
├── index.js                     # Punto de entrada y cliente de Discord
├── deploy-commands.js           # Script de registro de slash commands
├── .env                         # Variables de entorno (no incluir en VCS)
└── package.json
```

### Modelo de Datos

**Usuario (`users.json`)**
```json
{
  "userId": "...",
  "username": "...",
  "points": 0,
  "activeChallenges": {
    "individual": null,
    "team": null
  },
  "history": []
}
```

**Equipo (`teams.json`)**
```json
{
  "teamId": "...",
  "name": "...",
  "members": [],
  "leaderId": "...",
  "roleId": "...",
  "channelId": "...",
  "activeChallenge": null
}
```

---

## Comandos Disponibles

| Comando | Descripción | Rol requerido |
|---|---|---|
| `/reto-individual` | Solicitar un reto de programación individual | Participante |
| `/submit` | Enviar la solución a un reto activo | Participante |
| `/perfil` | Ver perfil, estadísticas y posición en el ranking | Todos |
| `/asignar-reto` | Asignar un reto mensual a un equipo | Mentor / Admin |
| `/crear-equipos` | Generar equipos automáticamente con los participantes | Admin |
| `/eliminar-equipo` | Eliminar un equipo y limpiar su estructura en Discord | Admin |

---

## Instalación y Configuración

### Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior
- Una aplicación registrada en el [Discord Developer Portal](https://discord.com/developers/applications)
- Un servidor de Discord con los roles y permisos necesarios

### Clonar el repositorio

```bash
git clone https://github.com/NoemiPuerto/GardenBot.git
cd GardenBot-bot
```

### Instalar dependencias

```bash
npm install
```

---

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Token del bot de Discord (Discord Developer Portal > Bot > Token)
DISCORD_TOKEN=tu_token_aqui

# ID de la aplicación (Discord Developer Portal > General Information > Application ID)
CLIENT_ID=tu_client_id_aqui

# ID del servidor de Discord donde se desplegará el bot
GUILD_ID=tu_guild_id_aqui
```

> ⚠️ **Nunca incluyas el archivo `.env` en el repositorio.** Asegúrate de que esté listado en `.gitignore`.

---

## Ejecución Local

### Registrar los slash commands (primera vez o tras cambios)

```bash
node src/deploy-commands.js
```

> Este paso registra los comandos en el servidor especificado en `GUILD_ID`. Los comandos de servidor se propagan en segundos. Los comandos globales pueden tardar hasta 1 hora.

### Iniciar el bot

```bash
npm start
```

---

## Permisos e Intents de Discord

### Intents requeridos

En el [Discord Developer Portal](https://discord.com/developers/applications), navega a **Bot > Privileged Gateway Intents** y activa:

| Intent | Motivo |
|---|---|
| `GUILDS` | Detección de canales y roles |
| `GUILD_MEMBERS` | Acceso a la lista de miembros del servidor |
| `GUILD_MESSAGES` | Procesamiento de mensajes en canales |
| `MESSAGE_CONTENT` | Lectura del contenido de mensajes (si aplica) |

> `GUILD_MEMBERS` es un intent privilegiado. Debes activarlo explícitamente en el portal y también declararlo en el código del bot.

### Permisos del bot en el servidor

Al generar la URL de invitación (OAuth2 > URL Generator), selecciona los siguientes scopes y permisos:

**Scopes:**
- `bot`
- `applications.commands`

**Permisos del bot:**
- Manage Roles
- Manage Channels
- Read Messages / View Channels
- Send Messages
- Use Slash Commands
- Embed Links
- Read Message History

---

## Registro de Slash Commands

Los slash commands se registran mediante el script `deploy-commands.js`. Este script lee todos los archivos de la carpeta `/commands`, extrae las definiciones y los registra a través de la API de Discord.

```bash
node deploy-commands.js
```

**Comandos de servidor vs. globales:**

- Los **comandos de servidor** (`GUILD_ID`) se propagan inmediatamente. Se recomiendan durante el desarrollo.
- Los **comandos globales** (sin `GUILD_ID`) se propagan en hasta 1 hora y aplican a todos los servidores donde esté el bot. Se recomiendan para producción multi-servidor.

Para alternar entre ambos modos, modifica `deploy-commands.js` para usar `rest.put(Routes.applicationCommands(clientId))` (global) o `rest.put(Routes.applicationGuildCommands(clientId, guildId))` (servidor).

---

## Estado del Proyecto

GardenBot Bot se encuentra actualmente en **fase avanzada de desarrollo**. La arquitectura principal está implementada y los flujos críticos son funcionales y estables.

### Completado ✅

- Arquitectura de servicios modular
- Sistema de retos individuales con pool por categoría y dificultad
- Sistema de retos de equipo asignados por mentores
- Creación automática de equipos con roles y canales en Discord
- Flujo de submissions con detección automática de contexto (individual / equipo)
- Sistema de puntuación y perfiles de usuario
- Ranking comunitario
- Administración de equipos (eliminación con limpieza completa)

### Resuelto recientemente 🔧

- Migración de `activeChallenge` a `activeChallenges` (soporte para retos simultáneos)
- Persistencia correcta de retos activos entre sesiones
- Resolución de conflictos en submissions con retos de múltiples tipos activos
- Corrección de eliminación de roles y canales en flujos de equipo
- Configuración correcta de `GuildMembers` intent para detección de participantes
- Manejo de errores de interacción tardía (`Unknown Interaction`) con `deferReply`
- Separación lógica entre cierre de reto de equipo y borrado total de la estructura

### En progreso 🚧

- Estabilización de flujos edge-case en submissions
- Mejora de validaciones en asignación de retos duplicados
- Refactorización de servicios para mayor cohesión
- Mejora del sistema de persistencia ante escrituras concurrentes

---

## Roadmap

El roadmap de GardenBot está organizado en fases de evolución del producto.

### Fase 2 — Calidad y Experiencia

- **Sistema de revisión automática de submissions**: Validación básica de repositorios (estructura, commits, README presente) antes de acreditar puntos.
- **Achievements y logros**: Sistema de medallas desbloqueables por hitos de participación, rachas y desempeño.
- **Sistema de mentor review**: Flujo estructurado para que los mentores aprueben o rechacen una submission con feedback.
- **Onboarding automatizado**: Flujo guiado para nuevos participantes con autoroles, instrucciones y primer reto sugerido.
- **Mejores métricas de ranking**: Puntuación ponderada por dificultad, consistencia y tiempo de resolución.

### Fase 3 — Gestión Avanzada

- **Historial por cohortes**: Registro y consulta del progreso histórico organizado por generación o ciclo escolar.
- **Sistema de temporadas**: Ciclos de competencia con inicio, cierre y premiación. Reset de rankings por temporada.
- **Analytics de participación**: Métricas agregadas por comunidad: tasa de completion, distribución por dificultad, actividad por semana.
- **Economía interna y recompensas**: Sistema de tokens o créditos canjeables por beneficios dentro del servidor.
- **Panel web administrativo**: Interfaz web para que administradores gestionen retos, equipos, cohortes y configuración sin usar comandos de Discord.

### Fase 4 — Integraciones y Escalado

- **Integración con GitHub**: Verificación automática de repositorios, análisis de actividad de commits y visualización de contribuciones.
- **Dashboard de progreso personal**: Página web individual por estudiante con métricas detalladas, historial y logros.
- **Migración a base de datos relacional**: Transición desde persistencia en JSON a PostgreSQL o MongoDB para soporte de mayor escala, consultas complejas e integridad transaccional.
- **Soporte multi-servidor**: Arquitectura preparada para que múltiples comunidades universitarias usen GardenBot de forma independiente en sus propios servidores.
- **API pública**: Endpoints REST para integración con sistemas institucionales (plataformas LMS, portales universitarios).

---

## Contribución

GardenBot Bot es actualmente un proyecto interno de comunidad. Si formas parte de la comunidad y deseas contribuir:

1. Crea un fork del repositorio
2. Crea una rama descriptiva para tu cambio (`feature/nombre-del-feature` o `fix/descripcion-del-bug`)
3. Asegúrate de que tu código sigue la estructura modular existente (servicio → comando)
4. Abre un Pull Request con una descripción clara del cambio y su motivación

Para reportar bugs o proponer mejoras, abre un issue con el contexto completo del problema.


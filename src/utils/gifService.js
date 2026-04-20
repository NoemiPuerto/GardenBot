const axios = require("axios");

let cachedGifs = [];
let lastFetch = 0;

// ⏱ tiempo de cache (10 minutos)
const CACHE_DURATION = 10 * 60 * 1000;

const TENOR_API_KEY = "LIVDSRZULELA"; // clave pública de prueba

async function fetchGifs() {
  try {
    console.log("🔄 Cargando GIFs desde Tenor...");

    const response = await axios.get("https://g.tenor.com/v1/search", {
      params: {
        q: "celebration coding success",
        key: TENOR_API_KEY,
        limit: 20
      }
    });

    cachedGifs = response.data.results.map(
      gif => gif.media[0].gif.url
    );

    lastFetch = Date.now();

    console.log(`✅ GIFs cargados: ${cachedGifs.length}`);
  } catch (error) {
    console.error("❌ Error cargando GIFs:", error.message);
  }
}

async function getRandomGif() {
  const now = Date.now();

  if (
    cachedGifs.length === 0 ||
    now - lastFetch > CACHE_DURATION
  ) {
    await fetchGifs();
  }

  if (cachedGifs.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * cachedGifs.length);
  return cachedGifs[randomIndex];
}

module.exports = {
  getRandomGif,
  fetchGifs
};
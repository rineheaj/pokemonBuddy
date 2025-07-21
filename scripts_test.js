import { getPokemon } from "./api_js_helper.js";

const fetchBtn = document.getElementById("fetchBtn");
const pokeInput = document.getElementById("pokeInput");
const spinner = document.getElementById("spinner");
const pokeDisplay = document.getElementById("pokeDisplay");
const pokeName = document.getElementById("pokeName");
const pokeImage = document.getElementById("pokeImage");
const pokeDetails = document.getElementById("pokeDetails");
const addTeamBtn = document.getElementById("addTeamBtn");
const teamList = document.getElementById("teamList");

localStorage.removeItem("team");
let team = JSON.parse(localStorage.getItem("team")) || [];
let currentFetchController = null;

// In-memory cache of fetched Pokémon data
const pokemonCache = {};

fetchBtn.addEventListener("click", onFetchClick);
addTeamBtn.addEventListener("click", onAddTeamClick);

async function onFetchClick() {
  const query = pokeInput.value.trim().toLowerCase();
  if (!query) {
    alert("Enter a name or ID");
    return;
  }
  await fetchPokemon(query);
}

function onAddTeamClick() {
  const id = pokeDisplay.dataset.pokeId;
  const data = pokemonCache[id];
  if (!data) {
    alert("No Pokémon loaded to add!");
    return;
  }

  if (team.length >= 6) {
    alert("Team is full (6 max)");
    return;
  }
  if (team.some(p => p.id === id)) {
    alert("Already on your team!");
    return;
  }

  // Only store minimal info in localStorage
  team.push({
    id: data.id,
    name: capitalize(data.name),
    img: data.sprites.front_default
  });
  localStorage.setItem("team", JSON.stringify(team));
  renderTeam();
}

async function fetchPokemon(query) {
  if (currentFetchController) {
    currentFetchController.abort();
  }
  currentFetchController = new AbortController();
  const { signal } = currentFetchController;

  const MIN_SPINNER_MS = 500;
  const start = performance.now();

  toggleSpinner(true);
  fetchBtn.disabled = true;

  try {
    const data = await getPokemon(query, signal);
    pokemonCache[data.id] = data;
    displayPokemon(data);
  } catch (err) {
    if (err.name !== "AbortError") {
      alert(err.message);
    }
  } finally {
    const elapsed = performance.now() - start;
    const hide = () => {
      toggleSpinner(false);
      fetchBtn.disabled = false;
    };
    if (elapsed < MIN_SPINNER_MS) {
      setTimeout(hide, MIN_SPINNER_MS - elapsed);
    } else {
      hide();
    }
  }
}

function displayPokemon(pokemon) {
  pokeName.textContent = `#${pokemon.id} ${capitalize(pokemon.name)}`;
  pokeImage.src = pokemon.sprites.front_default;
  pokeImage.alt = pokemon.name;
  pokeDisplay.dataset.pokeId = pokemon.id;

  pokeDetails.innerHTML = "";
  const types = pokemon.types
    .map(t => capitalize(t.type.name))
    .join(", ");
  const abilities = pokemon.abilities
    .map(a => capitalize(a.ability.name))
    .join(", ");
  const stats = [
    `Types: ${types}`,
    `Abilities: ${abilities}`,
    `Height: ${pokemon.height / 10}m`,
    `Weight: ${pokemon.weight / 10}kg`
  ];

  stats.forEach(text => {
    const li = document.createElement("li");
    li.textContent = text;
    pokeDetails.append(li);
  });

  pokeDisplay.classList.remove("hidden");
  pokeDisplay.classList.remove("fade-in");
  void pokeDisplay.offsetWidth;
  pokeDisplay.classList.add("fade-in");
}

function toggleSpinner(show) {
  spinner.classList.toggle("show", show);
}

function createTeamCard(pokemon) {
  const li = document.createElement("li");
  li.classList.add("team-card");

  const img = document.createElement("img");
  img.src = pokemon.sprites.front_default;
  img.alt = capitalize(pokemon.name);
  img.title = "Click to expand for stats";

  const statsDiv = document.createElement("div");
  statsDiv.classList.add("poke-stats", "hidden");
  statsDiv.innerHTML = formatStatsHTML(pokemon);

  img.addEventListener("click", () => {
    li.classList.toggle("expanded");
    statsDiv.classList.toggle("hidden");
    if (li.classList.contains("expanded")) {
      li.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  li.append(img, statsDiv);
  return li;
}

function formatStatsHTML(pokemon) {
  const types = pokemon.types
    .map(t => capitalize(t.type.name))
    .join(", ");
  return `
    <p><strong>Type:</strong> ${types}</p>
    <p><strong>HP:</strong> ${pokemon.stats[0].base_stat}</p>
    <p><strong>Attack:</strong> ${pokemon.stats[1].base_stat}</p>
    <p><strong>Defense:</strong> ${pokemon.stats[2].base_stat}</p>
    <p><strong>Speed:</strong> ${pokemon.stats[5].base_stat}</p>
  `;
}

async function renderTeam() {
  teamList.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("team")) || [];
  if (!saved.length) return;

  // Preload every teammate's data in parallel
  const allData = await Promise.all(
    saved.map(async member => {
      if (pokemonCache[member.id]) {
        return pokemonCache[member.id];
      }
      const data = await getPokemon(member.id);
      pokemonCache[data.id] = data;
      return data;
    })
  );

  allData.forEach(pokemon => {
    const card = createTeamCard(pokemon);
    teamList.appendChild(card);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initial render
renderTeam();

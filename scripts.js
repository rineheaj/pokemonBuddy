const fetchBtn = document.getElementById("fetchBtn")
const pokeInput = document.getElementById("pokeInput")
const spinner = document.getElementById("spinner")
const pokeDisplay = document.getElementById("pokeDisplay")
const pokeName = document.getElementById("pokeName")
const pokeImage = document.getElementById("pokeImage")
const pokeDetails = document.getElementById("pokeDetails")
const addTeamBtn = document.getElementById("addTeamBtn")
const teamList = document.getElementById("teamList")

localStorage.removeItem("team")
let team = JSON.parse(localStorage.getItem("team")) || [];


fetchBtn.addEventListener("click", () => {
    const query = pokeInput.value.trim().toLowerCase();
    if (!query) {
        alert("Enter a name or ID");
        return;
    }
    fetchPokemon(query);
});


addTeamBtn.addEventListener("click", () => {
    const id = pokeDisplay.dataset.pokeId;
    const name = pokeName.textContent.split(" ")[1];
    const img = pokeImage.src;
    if (team.length >= 6) {
        alert("Team is full (6 max)");
        return;
    }
    if (team.some(p => p.id === id)) {
        alert("Already on your team!");
        return;
    }
    team.push({ id, name, img });
    localStorage.setItem("team", JSON.stringify(team));
    renderTeam();
});


function fetchPokemon(query) {
    const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`;
    const MIN_SPINNER_MS = 500;
    const start = performance.now();

    toggleSpinner(true);
    fetchBtn.disabled = true;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("not found");
            return res.json();
        })
        .then(displayPokemon)
        .catch(err => alert(err.message))
        .finally(() => {
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
        });
}


function displayPokemon(pokemon) {
    pokeName.textContent = `#${pokemon.id} ${capitalize(pokemon.name)}`;
    pokeImage.src = pokemon.sprites.front_default
    pokeImage.alt = pokemon.name
    pokeDisplay.dataset.pokeId = pokemon.id

    pokeDetails.innerHTML = "";
    const types = pokemon.types.map(t => capitalize(t.type.name)).join(", ")
    const abilities = pokemon.abilities.map(a => capitalize(a.ability.name)).join(", ");
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
    pokeDisplay.classList.add("fade-in")
}


function toggleSpinner(show) {
    spinner.classList.toggle("show", show)
}


function createTeamCard(pokemon) {
    const li = document.createElement("li")
    li.classList.add("team-card")

    const img = document.createElement("img");
    img.src = pokemon.img;
    img.alt = pokemon.name;
    img.title = "Click to expand for stats";
    img.addEventListener("click", () => toggleStats(li, pokemon.id));

    const statsDiv = document.createElement("div")
    statsDiv.classList.add("poke-stats", "hidden");
    statsDiv.innerHTML = `<p>Loading stats...</p>`;

    li.appendChild(img);
    li.appendChild(statsDiv);
    return li;
}

function toggleStats(cardElement, pokeId) {
    const statsDiv = cardElement.querySelector(".poke-stats");

    if (cardElement.classList.contains("expanded")) {
        cardElement.classList.remove("expanded");
        statsDiv.classList.add("hidden");
        return;
    }

    fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`)
    .then(res => res.json())
    .then(pokemon => {
        statsDiv.innerHTML = formatStatsHTML(pokemon);
        cardElement.classList.add("expanded");
        statsDiv.classList.remove("hidden");

        cardElement.scrollIntoView({behavior: "smooth", block: "start"});
    })
    .catch(() => {
        statsDiv.innerHTML = `<p>Failed to load stats.</p>`;
    })
}

function formatStatsHTML(pokemon) {
    const types = pokemon.types.map(t => capitalize(t.type.name)).join(", ");
    return `
        <p><strong>Type:</strong> ${types}</p>
        <p><strong>HP:</strong> ${pokemon.stats[0].base_stat}</p>
        <p><strong>Attack:</strong> ${pokemon.stats[1].base_stat}</p>
        <p><strong>Defense:</strong> ${pokemon.stats[2].base_stat}</p>
        <p><strong>Speed:</strong> ${pokemon.stats[5].base_stat}</p>
    `;
}

function renderTeam() {
    teamList.innerHTML = "";
    team.forEach(pokemon => {
        const card = createTeamCard(pokemon);
        teamList.appendChild(card);
    });
}

// function renderTeam() {
//     teamList.innerHTML = "";
//     team.forEach(member => {
//         const li = document.createElement("li");
//         const img = document.createElement("img");
//         const span = document.createElement("span");

//         img.src = member.img;
//         span.textContent = `${member.name} (#${member.id})`;

//         li.append(img, span)
//         teamList.append(li)
//     });
// }

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

renderTeam();
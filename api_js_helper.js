

export async function getPokemon(query, signal) {
    const url = `https://pokeapi.co/api/vs/pokemon/${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal });

    if (!response.ok) throw new Error(`Pokemon ${query} not found`);
    return response.json();
}
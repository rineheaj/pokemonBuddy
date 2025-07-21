

export async function getPokemon(query, signal) {
    const url = `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal });

    if (!response.ok) throw new Error(`Pokemon ${query} not found`);
    const data = await response.json();
    console.log(data);
    return data;
}
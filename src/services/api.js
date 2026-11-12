const memory = new Map();
const pending = new Map();
const TTL = 5 * 60 * 1000;
let catalogPromise = null;

function directPath(path) {
  return path
    .replace(/^\/api\/pokemon(?=\/|\?)/, '/pokemon')
    .replace(/^\/api\/species(?=\/|\?)/, '/pokemon-species')
    .replace(/^\/api\/evolution-chain(?=\/|\?)/, '/evolution-chain')
    .replace(/^\/api\/evolution(?=\/|\?)/, '/evolution-chain')
    .replace(/^\/api\/abilities(?=\/|\?)/, '/ability')
    .replace(/^\/api\/types(?=\/|\?)/, '/type')
    .replace(/^\/api\/moves(?=\/|\?)/, '/move');
}

async function request(path) {
  const cached = memory.get(path);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(path)) return pending.get(path);

  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      let response;
      try { response = await fetch(path, { signal: controller.signal }); }
      catch (error) { if (!path.startsWith('/api/')) throw error; }
      if (path.startsWith('/api/') && (!response || response.status >= 500 || [404, 405].includes(response.status))) {
        const fallbackController = new AbortController();
        const fallbackTimer = setTimeout(() => fallbackController.abort(), 10000);
        try { response = await fetch(`https://pokeapi.co/api/v2${directPath(path).replace(/^\/api/, '')}`, { signal: fallbackController.signal }); }
        finally { clearTimeout(fallbackTimer); }
      }
      if (!response || !response.ok) {
        if (response && response.status === 404) throw new Error('Pokémon ou informação não encontrada.');
        throw new Error('Serviço indisponível no momento. Tente novamente.');
      }
      const data = await response.json();
      if (memory.size >= 250) memory.delete(memory.keys().next().value);
      memory.set(path, { data, expires: Date.now() + TTL });
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('A consulta demorou demais. Verifique sua conexão e tente novamente.');
      throw error;
    } finally {
      clearTimeout(timer);
      pending.delete(path);
    }
  })();
  pending.set(path, task);
  return task;
}

async function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const first = await request('/api/pokemon?limit=100&offset=0');
      const pages = Math.ceil(first.count / 100);
      const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, i) => request('/api/pokemon?limit=100&offset=' + ((i + 1) * 100))));
      return [first, ...rest].flatMap(page => page.results || []).map(item => ({ name: item.name, id: Number(item.url.match(/pokemon\/(\d+)\/?$/)?.[1]) || 0 })).filter(item => item.id);
    })().catch(error => { catalogPromise = null; throw error; });
  }
  return catalogPromise;
}

export const api = {
  catalog: loadCatalog,
  list: (limit = 24, offset = 0) => request(`/api/pokemon?limit=${limit}&offset=${offset}`),
  pokemon: id => request(`/api/pokemon/${encodeURIComponent(id)}`),
  species: id => request(`/api/species/${encodeURIComponent(id)}`),
  evolution: async id => {
    // Primeiro resolve o Pokémon: o ID de uma forma pode ser diferente do ID da espécie.
    const pokemon = await request(`/api/pokemon/${encodeURIComponent(id)}`);
    const speciesName = pokemon.species?.name || pokemon.name;
    const species = await request(`/api/species/${encodeURIComponent(speciesName)}`);
    const chainId = species.evolution_chain?.url?.match(/evolution-chain\/(\d+)\/?$/)?.[1];
    if (!chainId) throw new Error('Cadeia evolutiva não encontrada para este Pokémon.');
    return request(`/api/evolution-chain/${chainId}`);
  },
  ability: id => request(`/api/abilities/${encodeURIComponent(id)}`),
  move: id => request(`/api/moves/${encodeURIComponent(id)}`),
  types: () => request('/api/types'),
  type: id => request(`/api/types/${encodeURIComponent(id)}`)
};

export function clearApiCache() {
  memory.clear();
}

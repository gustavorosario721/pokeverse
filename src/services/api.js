const memory = new Map();
const pending = new Map();
const TTL = 5 * 60 * 1000;

function directPath(path) {
  return path
    .replace(/^\/api\/pokemon(?=\/|\?)/, '/pokemon')
    .replace(/^\/api\/species(?=\/|\?)/, '/pokemon-species')
    .replace(/^\/api\/evolution(?=\/|\?)/, '/evolution-chain')
    .replace(/^\/api\/abilities(?=\/|\?)/, '/ability')
    .replace(/^\/api\/types(?=\/|\?)/, '/type');
}

async function request(path) {
  const cached = memory.get(path);
  if (cached && cached.expires > Date.now()) return cached.data;
  if (pending.has(path)) return pending.get(path);

  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      let response = await fetch(path, { signal: controller.signal });
      if (path.startsWith('/api/') && [404, 405].includes(response.status)) {
        response = await fetch(`https://pokeapi.co/api/v2${directPath(path).replace(/^\/api/, '')}`, { signal: controller.signal });
      }
      if (!response.ok) {
        if (response.status === 404) throw new Error('Pokémon ou informação não encontrada.');
        throw new Error('Serviço indisponível no momento. Tente novamente.');
      }
      const data = await response.json();
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

export const api = {
  list: (limit = 24, offset = 0) => request(`/api/pokemon?limit=${limit}&offset=${offset}`),
  pokemon: id => request(`/api/pokemon/${encodeURIComponent(id)}`),
  species: id => request(`/api/species/${encodeURIComponent(id)}`),
  evolution: id => request(`/api/evolution/${encodeURIComponent(id)}`),
  ability: id => request(`/api/abilities/${encodeURIComponent(id)}`),
  types: () => request('/api/types'),
  type: id => request(`/api/types/${encodeURIComponent(id)}`)
};

export function clearApiCache() {
  memory.clear();
}

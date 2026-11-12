export const cap=s=>String(s||'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const number=n=>new Intl.NumberFormat('pt-BR').format(n);
export const pokemonImage=p=>p?.sprites?.other?.['official-artwork']?.front_default||p?.sprites?.other?.dream_world?.front_default||p?.sprites?.front_default||'';
export const heightText=dm=>`${(dm/10).toLocaleString('pt-BR',{maximumFractionDigits:2})} m (${number(dm*10)} cm)`;
export const weightText=hg=>`${(hg/10).toLocaleString('pt-BR',{maximumFractionDigits:2})} kg (${number(hg*100)} g)`;
export const totalStats=p=>(p?.stats||[]).reduce((s,x)=>s+x.base_stat,0);
export const statMap=p=>Object.fromEntries((p?.stats||[]).map(s=>[s.stat.name,s.base_stat]));
export function flavorText(species){const entries=species?.flavor_text_entries||[];const preferred=entries.find(x=>x.language.name==='pt-br')||entries.find(x=>x.language.name==='pt')||entries.find(x=>x.language.name==='en');return preferred?.flavor_text?.replace(/[\n\f]/g,' ')||'Descrição não disponível em português.'}

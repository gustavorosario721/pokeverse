import {api} from './api.js';
export async function getTypeAnalysis(pokemon){
  const names=pokemon.types.map(t=>t.type.name);
  const entries=await Promise.all(names.map(async name=>{return api.type(name)}));
  const factors={};
  for(const entry of entries){for(const t of entry.damage_relations.double_damage_from)factors[t.name]=(factors[t.name]??1)*2;for(const t of entry.damage_relations.half_damage_from)factors[t.name]=(factors[t.name]??1)*.5;for(const t of entry.damage_relations.no_damage_from)factors[t.name]=0}
  return Object.entries(factors).map(([type,multiplier])=>({type,multiplier})).sort((a,b)=>b.multiplier-a.multiplier);
}

export async function getEffectiveness(attacker, defender){
  const attackTypes=await Promise.all(attacker.types.map(t=>api.type(t.type.name)));
  const values=[];
  for(const attackType of attackTypes){
    let multiplier=1;
    for(const target of defender.types){
      const name=target.type.name;
      if(attackType.damage_relations.double_damage_to.some(x=>x.name===name))multiplier*=2;
      if(attackType.damage_relations.half_damage_to.some(x=>x.name===name))multiplier*=.5;
      if(attackType.damage_relations.no_damage_to.some(x=>x.name===name))multiplier=0;
    }
    values.push(multiplier);
  }
  // A Pokémon can choose moves from either of its types; the best matchup is the maximum, not their product.
  return values.length?Math.max(...values):1;
}

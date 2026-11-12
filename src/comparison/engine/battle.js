import {TYPE_PT} from '../../config/constants.js';
import {statMap} from '../../utils/format.js';

export function buildBattleMoves(pokemon){
  const types=(pokemon.types||[]).map(entry=>entry.type.name);
  const primary=types[0]||'normal';
  const secondary=types[1];
  const primaryLabel=TYPE_PT[primary]||primary;
  const moves=[
    {name:'Investida',type:'normal',power:40,category:'physical'},
    {name:`Golpe ${primaryLabel}`,type:primary,power:60,category:'physical'},
    {name:`Técnica ${primaryLabel}`,type:primary,power:80,category:'special'}
  ];
  if(secondary){
    const label=TYPE_PT[secondary]||secondary;
    moves.push({name:`Ataque ${label}`,type:secondary,power:65,category:'physical'});
  }
  return moves;
}

export function battleHp(pokemon,level=50){
  const baseHp=statMap(pokemon).hp||1;
  return Math.floor(((2*baseHp+31)*level)/100)+level+10;
}

export function calculateDamage(attacker,defender,move,effectiveness,randomFactor=0.85+Math.random()*0.15){
  if(effectiveness===0)return 0;
  const attackerStats=statMap(attacker);
  const defenderStats=statMap(defender);
  const attack=attackerStats[move.category==='special'?'special-attack':'attack']||1;
  const defense=defenderStats[move.category==='special'?'special-defense':'defense']||1;
  const level=50;
  const base=Math.floor((Math.floor((2*level/5+2)*move.power*attack/Math.max(1,defense))/50)+2);
  const sameType=attacker.types?.some(entry=>entry.type.name===move.type);
  const stab=sameType?1.5:1;
  return Math.max(1,Math.floor(base*stab*effectiveness*randomFactor));
}

export function chooseBattleMove(moves,attacker,defender,effectivenessByType){
  return moves.reduce((best,move)=>{
    const effectiveness=effectivenessByType[move.type]??1;
    const stats=statMap(attacker);
    const attack=stats[move.category==='special'?'special-attack':'attack']||1;
    const score=move.power*attack*effectiveness*(attacker.types?.some(entry=>entry.type.name===move.type)?1.5:1);
    return !best||score>best.score?{move,effectiveness,score}:best;
  },null);
}

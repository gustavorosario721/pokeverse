import {statMap,cap} from '../../utils/format.js';

export function maxHp(pokemon, level=50) {
  const base = statMap(pokemon).hp || 1;
  return Math.floor((2 * base * level) / 100) + level + 10;
}

export function simplifiedDamage(attacker, defender, move, effectiveness, random=Math.random) {
  if (effectiveness === 0) return {damage:0, critical:false, missed:false};
  const accuracy = move.accuracy ?? 100;
  if (random() * 100 >= accuracy) return {damage:0, critical:false, missed:true};
  const statsA = statMap(attacker);
  const statsD = statMap(defender);
  const special = move.damage_class?.name === 'special';
  const attack = statsA[special ? 'special-attack' : 'attack'] || 1;
  const defense = statsD[special ? 'special-defense' : 'defense'] || 1;
  const power = move.power || 40;
  const base = Math.floor((((2 * 50 / 5 + 2) * power * attack / Math.max(1, defense)) / 50) + 2);
  const stab = attacker.types?.some(entry => entry.type.name === move.type.name) ? 1.5 : 1;
  const critical = random() < 0.06;
  const variance = 0.9 + random() * 0.1;
  const damage = Math.max(1, Math.floor(base * stab * effectiveness * variance * (critical ? 1.5 : 1)));
  return {damage, critical, missed:false};
}

export function chooseCpuMove(moves, attacker, defender, effectivenessByType) {
  return moves.reduce((best, move) => {
    const multiplier = effectivenessByType[move.type.name] ?? 1;
    const stat = statMap(attacker)[move.damage_class?.name === 'special' ? 'special-attack' : 'attack'] || 1;
    const score = (move.power || 0) * stat * multiplier * (move.accuracy ?? 100) / 100;
    return !best || score > best.score ? {move, score} : best;
  }, null)?.move || moves[0];
}

export function moveLabel(move) {
  return move.names?.find(item => item.language.name === 'pt-br')?.name
    || move.names?.find(item => item.language.name === 'pt')?.name
    || move.names?.find(item => item.language.name === 'en')?.name
    || cap(move.name);
}

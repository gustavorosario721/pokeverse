import test from 'node:test';
import assert from 'node:assert/strict';
import {heightText,weightText,totalStats,statMap} from '../src/utils/format.js';
import {flattenEvolution,evolutionRequirement} from '../src/utils/evolution.js';
import {battleHp,buildBattleMoves,calculateDamage,chooseBattleMove} from '../src/comparison/engine/battle.js';

test('converte altura e peso para unidades brasileiras',()=>{
  assert.match(heightText(17),/1,7 m/);
  assert.match(weightText(60),/6 kg/);
});

test('calcula total e mapa de estatísticas',()=>{
  const pokemon={stats:[{stat:{name:'hp'},base_stat:45},{stat:{name:'attack'},base_stat:49}]};
  assert.equal(totalStats(pokemon),94);
  assert.deepEqual(statMap(pokemon),{hp:45,attack:49});
});

test('percorre cadeia evolutiva recursiva',()=>{
  const chain={species:{name:'bulbasaur'},evolves_to:[{species:{name:'ivysaur'},evolves_to:[{species:{name:'venusaur'},evolves_to:[]}]}]};
  assert.deepEqual(flattenEvolution(chain).map(x=>x.name),['bulbasaur','ivysaur','venusaur']);
});

test('interpreta requisitos de evolução conhecidos',()=>{
  assert.equal(evolutionRequirement([{min_level:16}]),'Nível 16');
  assert.equal(evolutionRequirement([]),'Forma inicial');
});

test('monta movimentos de batalha a partir dos tipos',()=>{
  const pokemon={types:[{type:{name:'fire'}},{type:{name:'flying'}}]};
  assert.deepEqual(buildBattleMoves(pokemon).map(move=>move.name),['Investida','Golpe Fogo','Técnica Fogo','Ataque Voador']);
});

test('escala HP base para o nível de batalha',()=>{
  const pokemon={stats:[{stat:{name:'hp'},base_stat:35}]};
  assert.equal(battleHp(pokemon),110);
});

test('calcula dano com STAB e respeita imunidades',()=>{
  const attacker={types:[{type:{name:'fire'}}],stats:[{stat:{name:'attack'},base_stat:100}]};
  const defender={types:[{type:{name:'grass'}}],stats:[{stat:{name:'defense'},base_stat:80}]};
  const move={type:'fire',power:60,category:'physical'};
  const damage=calculateDamage(attacker,defender,move,2,1);
  assert.ok(damage>calculateDamage(attacker,defender,{...move,type:'normal'},2,1));
  assert.equal(calculateDamage(attacker,defender,move,0,1),0);
});

test('escolhe o movimento de maior efetividade e poder',()=>{
  const attacker={types:[{type:{name:'fire'}}],stats:[{stat:{name:'attack'},base_stat:80}]};
  const moves=[{name:'Investida',type:'normal',power:40,category:'physical'},{name:'Chama',type:'fire',power:60,category:'physical'}];
  assert.equal(chooseBattleMove(moves,attacker,{}, {normal:1,fire:2}).move.name,'Chama');
});

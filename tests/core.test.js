import test from 'node:test';
import assert from 'node:assert/strict';
import {heightText,weightText,totalStats,statMap} from '../src/utils/format.js';
import {flattenEvolution,evolutionRequirement} from '../src/utils/evolution.js';

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

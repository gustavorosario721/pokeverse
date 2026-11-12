import test from 'node:test';
import assert from 'node:assert/strict';
import {heightText,weightText,totalStats,statMap} from '../src/utils/format.js';
import {flattenEvolution,evolutionRequirement} from '../src/utils/evolution.js';
import {getId,upstream,send,handlerError} from '../server/pokeapi.js';

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

test('valida identificadores aceitos pelo gateway',()=>{
  assert.equal(getId({query:{id:'25'}}),'25');
  assert.equal(getId({query:{id:'Mr-Mime'}}),'mr-mime');
  assert.equal(getId({query:{id:'../secret'}}),null);
  assert.equal(getId({query:{id:'x'.repeat(81)}}),null);
  assert.equal(getId({query:{}}),null);
});

test('rejeita caminhos inválidos antes de realizar uma chamada externa',async()=>{
  await assert.rejects(()=>upstream('../pokemon/25'),{status:400});
  await assert.rejects(()=>upstream('pokemon/25%2f..'),{status:400});
});

test('retorna cabeçalhos de cache apropriados conforme status',()=>{
  const headers={};
  const response={status(code){this.code=code;return this},setHeader(k,v){headers[k]=v},json(data){this.data=data;return this}};
  send(response,200,{ok:true});
  assert.equal(headers['Cache-Control'],'public, s-maxage=300, stale-while-revalidate=600');
  assert.equal(headers['Content-Type'],'application/json; charset=utf-8');
  send(response,400,{error:true});
  assert.equal(headers['Cache-Control'],'no-store');
});

test('normaliza falhas do gateway sem expor detalhes internos',()=>{
  const headers={};
  const response={status(code){this.code=code;return this},setHeader(k,v){headers[k]=v},json(data){this.data=data;return this}};
  handlerError(response,new Error('internal secret'));
  assert.equal(response.code,502);
  assert.equal(response.data.error.message,'Não foi possível consultar os dados no momento.');
  assert.equal(JSON.stringify(response.data).includes('internal secret'),false);
});

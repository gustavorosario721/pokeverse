import './styles/main.css';
import {api} from './services/api.js';
import {store} from './state/store.js';
import {favoritesService} from './services/favorites.js';
import {TYPE_COLORS,TYPE_PT,STAT_PT,TYPE_NAMES} from './config/constants.js';
import {pokemonImage,cap,number,heightText,weightText,totalStats,statMap,flavorText} from './utils/format.js';
import {flattenEvolution,evolutionRequirement} from './utils/evolution.js';
import {getTypeAnalysis,getEffectiveness,getMoveEffectiveness} from './services/type-chart.js';
import {maxHp,simplifiedDamage,chooseCpuMove,moveLabel} from './battle/engine/simple-battle.js';

const app=document.querySelector('#app');
const nav=[['home','⌂','Início'],['pokedex','◉','Pokédex'],['types','◈','Tipos'],['evolution','⇢','Evoluções'],['compare','⇄','Comparar'],['favorites','♡','Favoritos'],['random','✦','Descoberta'],['battle','⚔','Batalhas'],['arena','◉','Comparar 3D']];
let battleEpoch=0,activeBattle=null;
let currentPage='home',currentPokemon=null,currentTab='overview',page=0,pageSize=store.settings().pageSize||24,activeTypes=[],searchTimer=null,searchText='',arenaInstance=null,compareA=25,compareB=6;
const icon=(x)=>`<span class="nav-icon">${x}</span>`;
function shell(){app.innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">◉</span><span class="brand-name">PokéVerse</span></div><div class="nav-label">EXPLORAR</div>${nav.map(([id,ic,label])=>`<a href="#/${id}" class="nav-link" data-route="${id}">${icon(ic)}<span>${label}</span></a>`).join('')}<div class="sidebar-bottom"><a href="#/settings" class="nav-link" data-route="settings">${icon('⚙')}<span>Configurações</span></a><a href="#/about" class="nav-link" data-route="about">${icon('ⓘ')}<span>Sobre o projeto</span></a></div></aside><main class="main-area"><header class="topbar"><div style="display:flex;align-items:center;gap:12px"><button class="icon-btn mobile-menu" id="mobileMenu">☰</button><span class="topbar-title" id="topTitle">Seu universo Pokémon</span></div><div class="top-actions"><button class="icon-btn" id="quickSearch" title="Ir para a Pokédex">⌕</button><button class="icon-btn" id="themeToggle" title="Alternar tema">☼</button></div></header><section class="content" id="pageContent"></section></main></div><div id="toastRoot"></div>`;}
function toast(msg){const root=document.querySelector('#toastRoot');root.innerHTML=`<div class="toast">${msg}</div>`;setTimeout(()=>root.innerHTML='',2600)}
function setPageTitle(title){document.querySelector('#topTitle').textContent=title;document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.dataset.route===currentPage))}
function go(route){location.hash=`/${route}`}
function render(){const route=decodeURIComponent(location.hash.replace(/^#\/?/,''))||'home';const [pageName,arg]=route.split('/');currentPage=pageName||'home';if(currentPage!=='battle'&&activeBattle){battleEpoch++;activeBattle=null}if(currentPage==='detail'&&arg){loadDetail(arg);return}if(arenaInstance){arenaInstance.dispose();arenaInstance=null}setPageTitle(({home:'Seu universo Pokémon',pokedex:'Pokédex Nacional',types:'Explore os tipos',evolution:'Explorador de evoluções',compare:'Comparação Pokémon',favorites:'Sua coleção',random:'Descoberta surpresa',battle:'Centro de batalhas',arena:'Comparação visual 3D',settings:'Configurações',about:'Sobre o PokéVerse'})[currentPage]||'PokéVerse');const root=document.querySelector('#pageContent');root.innerHTML='<div class="skeleton" style="height:180px"></div>';({home:homePage,pokedex:pokedexPage,types:typesPage,evolution:evolutionPage,compare:comparePage,favorites:favoritesPage,random:randomPage,battle:battlePage,arena:arenaPage,settings:settingsPage,about:aboutPage}[currentPage]||homePage)(root)}
function card(p){const image=pokemonImage(p);return `<article class="pokemon-card" data-open="${p.id}"><button class="favorite-btn ${favoritesService.has(p.id)?'is-fav':''}" data-fav="${p.id}" aria-label="Favoritar">${favoritesService.has(p.id)?'♥':'♡'}</button><div class="poke-number">Nº ${String(p.id).padStart(4,'0')}</div><img class="poke-art" src="${image}" alt="${p.name}" loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'"><div class="poke-name">${p.name}</div><div class="type-row">${p.types.map(t=>typePill(t.type.name)).join('')}</div></article>`}
function typePill(name){return `<span class="type-pill" style="background:${TYPE_COLORS[name]||'#899'}">${TYPE_PT[name]||cap(name)}</span>`}
async function fetchMany(results){return Promise.all(results.map(x=>api.pokemon(x.name).catch(()=>null))).then(a=>a.filter(Boolean))}
function heading(eyebrow,title,subtitle){return `<div><div class="eyebrow">${eyebrow}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>`}
async function homePage(root){root.innerHTML=`<section class="hero"><div class="hero-copy"><div class="eyebrow" style="color:#ffdf70">BEM-VINDO AO POKÉVERSE</div><h1>Seu universo Pokémon começa aqui.</h1><p>Explore criaturas, descubra habilidades, acompanhe evoluções e compare seus Pokémon favoritos em uma experiência feita para treinadores.</p><button class="btn btn-primary" id="heroDex">Explorar Pokédex <span>→</span></button></div><img class="hero-art" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" alt="Pikachu"></section><div class="three-col" style="margin-top:18px"><div class="panel"><div class="eyebrow">COLEÇÃO</div><div class="stat-total">${favoritesService.list().length}</div><div class="muted" style="font-size:12px">Pokémon favoritos</div></div><div class="panel"><div class="eyebrow">DESCOBERTAS</div><div class="stat-total">${store.history().length}</div><div class="muted" style="font-size:12px">Vistos recentemente</div></div><div class="panel"><div class="eyebrow">POKÉDEX</div><div class="stat-total">1.025+</div><div class="muted" style="font-size:12px">Espécies disponíveis</div></div></div><div class="section-head"><div><h2>Pokémon em destaque</h2><p>Alguns companheiros para começar sua jornada.</p></div><button class="btn btn-outline" id="homeSeeAll">Ver Pokédex →</button></div><div class="grid-cards" id="featured"><div class="skeleton" style="height:190px"></div><div class="skeleton" style="height:190px"></div><div class="skeleton" style="height:190px"></div><div class="skeleton" style="height:190px"></div></div><div class="section-head"><div><h2>Vistos recentemente</h2><p>Retome de onde sua jornada parou.</p></div></div><div class="grid-cards" id="recentGrid"></div><div class="section-head"><div><h2>Continue explorando</h2><p>Acesse rapidamente as ferramentas do PokéVerse.</p></div></div><div class="three-col"><button class="panel" data-go="compare" style="text-align:left"><div style="font-size:25px">⇄</div><b>Comparar Pokémon</b><p class="muted" style="font-size:12px">Analise atributos lado a lado.</p></button><button class="panel" data-go="arena" style="text-align:left"><div style="font-size:25px">◉</div><b>Arena 3D</b><p class="muted" style="font-size:12px">Veja dois Pokémon frente a frente.</p></button><button class="panel" data-go="random" style="text-align:left"><div style="font-size:25px">✦</div><b>Descoberta surpresa</b><p class="muted" style="font-size:12px">Encontre um Pokémon aleatório.</p></button></div>`;document.querySelector('#heroDex').onclick=()=>go('pokedex');document.querySelector('#homeSeeAll').onclick=()=>go('pokedex');const ps=await fetchMany([{name:'pikachu'},{name:'charizard'},{name:'bulbasaur'},{name:'eevee'}]);document.querySelector('#featured').innerHTML=ps.map(card).join('');const recent=store.history().slice(0,4);if(recent.length){const rp=await Promise.all(recent.map(x=>api.pokemon(x.id).catch(()=>null)));document.querySelector('#recentGrid').innerHTML=rp.filter(Boolean).map(card).join('')}else document.querySelector('#recentGrid').innerHTML='<div class="muted" style="font-size:12px">Os Pokémon que você consultar aparecerão aqui.</div>'}
async function pokedexPage(root){root.innerHTML=`${heading('ENCICLOPÉDIA','Pokédex Nacional','Encontre seu próximo parceiro. Pesquise por nome ou número e filtre por tipo.') }<div class="toolbar"><div class="searchbox"><span>⌕</span><input id="dexSearch" placeholder="Buscar Pokémon por nome ou número..." value="${searchText}" list="searchSuggestions"><datalist id="searchSuggestions">${store.searches().map(x=>`<option value="${x}">`).join('')}</datalist><button id="clearSearch" class="icon-btn" style="width:28px;height:28px">×</button></div><select class="select" id="pageSize"><option value="12" ${pageSize===12?'selected':''}>12 por página</option><option value="24" ${pageSize===24?'selected':''}>24 por página</option><option value="48" ${pageSize===48?'selected':''}>48 por página</option></select></div><div class="type-row" id="typeFilters" style="margin-bottom:16px">${TYPE_NAMES.map(t=>`<button class="type-pill" data-type="${t}" style="border:2px solid ${activeTypes.includes(t)?'#172d55':'transparent'};background:${TYPE_COLORS[t]}">${TYPE_PT[t]}</button>`).join('')}</div><div class="muted" id="dexMeta" style="font-size:12px;margin-bottom:12px">Carregando Pokédex...</div><div class="grid-cards" id="dexGrid"></div><div class="pagination" id="pagination"></div>`;document.querySelector('#dexSearch').addEventListener('input',e=>{clearTimeout(searchTimer);searchText=e.target.value;searchTimer=setTimeout(()=>{store.addSearch(searchText);page=0;loadDex()},350)});document.querySelector('#clearSearch').onclick=()=>{searchText='';document.querySelector('#dexSearch').value='';page=0;loadDex()};document.querySelector('#pageSize').onchange=e=>{pageSize=Number(e.target.value);page=0;loadDex()};document.querySelector('#typeFilters').onclick=e=>{const t=e.target.dataset.type;if(!t)return;activeTypes=activeTypes.includes(t)?activeTypes.filter(x=>x!==t):[...activeTypes,t];page=0;document.querySelectorAll('[data-type]').forEach(b=>b.style.borderColor=activeTypes.includes(b.dataset.type)?'#172d55':'transparent');loadDex()};loadDex()}
async function loadDex(){const grid=document.querySelector('#dexGrid');if(!grid)return;grid.innerHTML=Array.from({length:8},()=>'<div class="skeleton" style="height:190px"></div>').join('');try{let list=[],total=0;if(searchText.trim()){try{const p=await api.pokemon(searchText.trim().toLowerCase());list=[p];total=1}catch{list=[]}}else if(activeTypes.length){const sets=await Promise.all(activeTypes.map(async t=>{const d=await api.type(t);return d.pokemon.map(x=>x.pokemon.name)}));let names=sets[0].filter(n=>sets.every(set=>set.includes(n)));total=names.length;const pageNames=names.slice(page*pageSize,(page+1)*pageSize);list=await fetchMany(pageNames.map(name=>({name})));}else{const data=await api.list(pageSize,page*pageSize);total=data.count;list=await fetchMany(data.results)}if(searchText.trim()&&activeTypes.length)list=list.filter(p=>activeTypes.every(t=>p.types.some(x=>x.type.name===t)));grid.innerHTML=list.length?list.map(card).join():'<div class="empty-state" style="grid-column:1/-1"><div class="emoji">🔎</div><b>Nenhum Pokémon encontrado</b><p>Tente outro nome, número ou combinação de tipos.</p></div>';document.querySelector('#dexMeta').textContent=searchText?`${list.length} resultado(s) para “${searchText}”`:`Página ${page+1} · ${number(total)} Pokémon no catálogo`;document.querySelector('#pagination').innerHTML=searchText?'':`<button class="btn btn-outline" id="prevPage" ${page===0?'disabled':''}>← Anterior</button><span class="muted" style="font-size:12px">Página ${page+1} de ${Math.max(1,Math.ceil(total/pageSize))}</span><button class="btn btn-outline" id="nextPage" ${((page+1)*pageSize>=total)?'disabled':''}>Próxima →</button>`;const prev=document.querySelector('#prevPage'),next=document.querySelector('#nextPage');if(prev)prev.onclick=()=>{page=Math.max(0,page-1);loadDex()};if(next)next.onclick=()=>{page++;loadDex()}}catch(e){grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1">${e.message}</div>`}}
async function loadDetail(id){const root=document.querySelector('#pageContent');setPageTitle('Detalhes do Pokémon');root.innerHTML='<div class="skeleton" style="height:340px"></div>';try{const p=await api.pokemon(id);currentPokemon=p;store.addHistory(p);const species=await api.species(p.id).catch(()=>null);root.innerHTML=detailMarkup(p,species);bindDetailTabs(p,species)}catch(e){root.innerHTML=`<div class="empty-state"><div class="emoji">🧭</div><b>Não encontramos esse Pokémon</b><p>${e.message}</p><button class="btn btn-blue" onclick="location.hash='#/pokedex'">Voltar à Pokédex</button></div>`}}
function detailMarkup(p,species){const abilities=p.abilities.map(a=>`<span class="type-pill" style="background:#526c91">${cap(a.ability.name)}${a.is_hidden?' · Oculta':''}</span>`).join('');return `<div style="margin-bottom:20px"><button class="btn btn-outline" onclick="location.hash='#/pokedex'">← Voltar à Pokédex</button></div><div class="detail-layout"><div><div class="detail-art"><img src="${pokemonImage(p)}" alt="${p.name}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'"></div><div class="panel" style="margin-top:13px"><div class="eyebrow">Nº ${String(p.id).padStart(4,'0')}</div><h2 style="margin:4px 0 12px;color:var(--navy);text-transform:capitalize">${p.name}</h2><div class="type-row">${p.types.map(t=>typePill(t.type.name)).join('')}</div><div class="two-col" style="margin-top:18px"><div><div class="muted" style="font-size:10px">ALTURA</div><b>${heightText(p.height)}</b></div><div><div class="muted" style="font-size:10px">PESO</div><b>${weightText(p.weight)}</b></div></div><div style="margin-top:15px"><div class="muted" style="font-size:10px">EXPERIÊNCIA BASE</div><b>${number(p.base_experience||0)} XP</b></div><div style="margin-top:16px">${abilities}</div><button class="btn btn-outline" style="width:100%;margin-top:16px" data-fav="${p.id}">${favoritesService.has(p.id)?'♥ Remover dos favoritos':'♡ Adicionar aos favoritos'}</button></div></div><div><div class="eyebrow">PERFIL DO POKÉMON</div><h1 class="page-title" style="text-transform:capitalize">${p.name}</h1><p class="page-subtitle">${flavorText(species)}</p><div class="tabs"><button class="tab active" data-tab="overview">Visão geral</button><button class="tab" data-tab="stats">Estatísticas</button><button class="tab" data-tab="species">Espécie</button><button class="tab" data-tab="evolution">Evoluções</button></div><div id="detailTab">${overviewMarkup(p)}</div></div></div>`}
function overviewMarkup(p){return `<div class="panel"><h3 style="margin-top:0;color:var(--navy)">Habilidades</h3><div class="type-row">${p.abilities.map(a=>`<span class="type-pill" style="background:#526c91">${cap(a.ability.name)}${a.is_hidden?' · Oculta':''}</span>`).join('')}</div><p class="muted" style="font-size:12px;line-height:1.7">As habilidades podem oferecer efeitos passivos durante as aventuras. Consulte os detalhes de cada habilidade na Pokédex.</p><h3 style="color:var(--navy)">Informações básicas</h3><div class="two-col"><div><span class="muted">Altura</span><br><b>${heightText(p.height)}</b></div><div><span class="muted">Peso</span><br><b>${weightText(p.weight)}</b></div><div><span class="muted">Experiência base</span><br><b>${p.base_experience??'—'}</b></div><div><span class="muted">Ordem na Pokédex</span><br><b>${p.order}</b></div></div></div>`}
function statsMarkup(p){const total=totalStats(p);return `<div class="panel"><div class="eyebrow">PONTUAÇÃO TOTAL</div><div class="stat-total">${total}</div>${p.stats.map(s=>`<div class="stat-row"><b>${STAT_PT[s.stat.name]||cap(s.stat.name)}</b><div class="stat-track"><div class="stat-fill" style="width:${Math.min(100,s.base_stat/255*100)}%;background:${s.base_stat>100?'#56ae83':'#4286d8'}"></div></div><b>${s.base_stat}</b></div>`).join('')}</div>`}
async function bindDetailTabs(p,species){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=async()=>{document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));const tab=b.dataset.tab,slot=document.querySelector('#detailTab');if(tab==='overview'){slot.innerHTML=overviewMarkup(p);const details=await Promise.all(p.abilities.map(async item=>{try{return await api.ability(item.ability.name)}catch{return null}}));const cards=details.filter(Boolean).map((a,i)=>{const entry=a.effect_entries?.find(x=>x.language.name==='pt-br')||a.effect_entries?.find(x=>x.language.name==='pt')||a.effect_entries?.find(x=>x.language.name==='en');return `<div style="padding:12px 0;border-top:1px solid var(--line)"><b>${cap(a.name)}${p.abilities[i]?.is_hidden?' · Habilidade oculta':''}</b><p class="muted" style="font-size:12px;line-height:1.6">${entry?.effect||entry?.short_effect||'Descrição indisponível.'}</p></div>`}).join('');slot.innerHTML+=`<div class="panel" style="margin-top:14px"><h3 style="margin-top:0;color:var(--navy)">Efeitos das habilidades</h3>${cards||'<p class="muted">Detalhes indisponíveis.</p>'}</div>`}if(tab==='stats')slot.innerHTML=statsMarkup(p);if(tab==='species')slot.innerHTML=species?speciesMarkup(species):'<div class="notice">Dados da espécie indisponíveis.</div>';if(tab==='evolution'){slot.innerHTML='<p class="muted">Carregando evoluções...</p>';try{const chain=await api.evolution(p.id);slot.innerHTML=await evolutionMarkup(chain)}catch(e){slot.innerHTML=`<div class="notice">${e.message}</div>`}}})}
function speciesMarkup(s){const g=s.gender_rate===-1?'Sem gênero':`${(s.gender_rate/8*100).toLocaleString('pt-BR')}% fêmeas`;return `<div class="panel"><p>${flavorText(s)}</p><div class="two-col">${[['Geração',cap(s.generation?.name)],['Habitat',cap(s.habitat?.name||'Desconhecido')],['Cor',cap(s.color?.name)],['Formato',cap(s.shape?.name)],['Captura',s.capture_rate],['Proporção de gênero',g],['Crescimento',cap(s.growth_rate?.name)],['Grupo de ovos',(s.egg_groups||[]).map(x=>cap(x.name)).join(', ')||'—']].map(([a,b])=>`<div><span class="muted" style="font-size:11px">${a}</span><br><b>${b||'—'}</b></div>`).join('')}</div><p class="muted" style="font-size:11px">${s.is_legendary?'Pokémon lendário · ':''}${s.is_mythical?'Pokémon mítico':''}</p></div>`}
async function evolutionMarkup(chain){const items=flattenEvolution(chain.chain);const ps=await Promise.all(items.map(x=>api.pokemon(x.name).catch(()=>null)));return `<div class="panel"><h3 style="margin-top:0">Linha evolutiva</h3><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">${items.map((x,i)=>`<div style="text-align:center;min-width:105px;flex:1"><img src="${pokemonImage(ps[i])}" style="width:90px;height:90px;object-fit:contain;cursor:pointer" data-open="${ps[i]?.id||x.name}" onerror="this.style.opacity=.2"><b style="display:block;text-transform:capitalize">${x.name}</b><small class="muted">${evolutionRequirement(x.details)}</small></div>${i<items.length-1?'<span style="color:var(--blue);font-size:22px">→</span>':''}`).join('')}</div></div>`}
async function typesPage(root){root.innerHTML=`${heading('ELEMENTOS','Explore os tipos','Conheça os 18 tipos Pokémon e descubra criaturas de cada categoria.')}<div class="grid-cards" style="margin-top:24px">${TYPE_NAMES.map(t=>`<button class="pokemon-card" data-explore-type="${t}" style="text-align:left;border:0"><div style="height:55px;border-radius:12px;background:${TYPE_COLORS[t]};display:grid;place-items:center;color:white;font-size:23px">✦</div><div class="poke-name" style="margin-top:12px">${TYPE_PT[t]}</div><div class="muted" style="font-size:11px">Ver Pokémon do tipo →</div></button>`).join('')}</div><div id="typeResults" style="margin-top:22px"></div>`}
async function evolutionPage(root){root.innerHTML=`${heading('CAMINHOS','Explorador de evoluções','Digite um Pokémon para visualizar sua linha evolutiva completa.')}<div class="toolbar"><div class="searchbox"><span>⌕</span><input id="evoSearch" placeholder="Ex.: eevee, pikachu, charmander"></div><button class="btn btn-blue" id="evoGo">Explorar evolução</button></div><div id="evoResult"></div>`;const run=async()=>{const v=document.querySelector('#evoSearch').value.trim();if(!v)return;const slot=document.querySelector('#evoResult');slot.innerHTML='<div class="skeleton" style="height:150px"></div>';try{const c=await api.evolution(v);slot.innerHTML=await evolutionMarkup(c)}catch(e){slot.innerHTML=`<div class="notice">${e.message}</div>`}};document.querySelector('#evoGo').onclick=run;document.querySelector('#evoSearch').onkeydown=e=>{if(e.key==='Enter')run()}}
async function comparePage(root){root.innerHTML=`${heading('ANÁLISE LADO A LADO','Comparar Pokémon','Escolha dois Pokémon e descubra como seus atributos se relacionam.')}<div class="comparison-select" style="margin:22px 0"><div class="panel"><div class="eyebrow">POKÉMON A</div><div class="field"><label>Nome ou número</label><input id="compareA" value="${compareA}" placeholder="Ex.: pikachu"></div></div><div class="panel"><div class="eyebrow">POKÉMON B</div><div class="field"><label>Nome ou número</label><input id="compareB" value="${compareB}" placeholder="Ex.: charizard"></div></div></div><button class="btn btn-blue" id="compareRun">Comparar Pokémon</button><div id="compareResult" style="margin-top:20px"></div>`;document.querySelector('#compareRun').onclick=runComparison;runComparison()}
async function runComparison(){const slot=document.querySelector('#compareResult');if(!slot)return;const a=document.querySelector('#compareA').value.trim(),b=document.querySelector('#compareB').value.trim();slot.innerHTML='<div class="skeleton" style="height:280px"></div>';try{const [p1,p2]=await Promise.all([api.pokemon(a),api.pokemon(b)]);compareA=p1.id;compareB=p2.id;slot.innerHTML=comparisonMarkup(p1,p2);try{const [wa,wb,ab,ba]=await Promise.all([getTypeAnalysis(p1),getTypeAnalysis(p2),getEffectiveness(p1,p2),getEffectiveness(p2,p1)]);const typePanel=document.createElement('div');typePanel.className='panel';typePanel.style.marginTop='15px';const format=x=>x.filter(v=>v.multiplier!==1).map(v=>`${TYPE_PT[v.type]||cap(v.type)} ${v.multiplier===0?'(imune)':`(×${v.multiplier})`}`).join(' · ')||'Sem relações especiais identificadas';typePanel.innerHTML=`<h3 style="margin-top:0;color:var(--navy)">Relações de tipo</h3><div class="two-col"><div><b style="text-transform:capitalize">${p1.name}</b><p class="muted" style="font-size:12px">Fraquezas e resistências: ${format(wa)}</p><p class="muted" style="font-size:12px">Efetividade contra ${p2.name}: <b>${ab}×</b></p></div><div><b style="text-transform:capitalize">${p2.name}</b><p class="muted" style="font-size:12px">Fraquezas e resistências: ${format(wb)}</p><p class="muted" style="font-size:12px">Efetividade contra ${p1.name}: <b>${ba}×</b></p></div></div>`;slot.append(typePanel)}catch{}}catch(e){slot.innerHTML=`<div class="notice">${e.message}</div>`}}
function comparisonMarkup(a,b){const sa=statMap(a),sb=statMap(b);return `<div class="two-col"><div class="panel" style="text-align:center"><img src="${pokemonImage(a)}" style="width:140px;height:130px;object-fit:contain"><h2 style="text-transform:capitalize;color:var(--navy)">${a.name}</h2>${a.types.map(t=>typePill(t.type.name)).join('')}</div><div class="panel" style="text-align:center"><img src="${pokemonImage(b)}" style="width:140px;height:130px;object-fit:contain"><h2 style="text-transform:capitalize;color:var(--navy)">${b.name}</h2>${b.types.map(t=>typePill(t.type.name)).join('')}</div></div><div class="panel" style="margin-top:15px"><div class="section-head" style="margin-top:0"><div><h2>Comparação de atributos</h2><p>O destaque indica o maior valor em cada atributo.</p></div><div><b>Total: ${totalStats(a)} × ${totalStats(b)}</b></div></div>${Object.entries(STAT_PT).map(([key,label])=>`<div style="margin:17px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><b>${label}</b><b>${sa[key]} <span class="muted">×</span> ${sb[key]}</b></div><div style="display:flex;gap:5px;margin-top:7px"><div class="stat-track" style="flex:1"><div class="stat-fill" style="margin-left:auto;width:${sa[key]/255*100}%;background:${sa[key]>=sb[key]?'#4cae82':'#8da5c6'}"></div></div><div class="stat-track" style="flex:1"><div class="stat-fill" style="width:${sb[key]/255*100}%;background:${sb[key]>=sa[key]?'#4cae82':'#8da5c6'}"></div></div></div></div>`).join('')}<div class="two-col" style="margin-top:20px"><div><span class="muted">Altura</span><br><b>${heightText(a.height)}</b></div><div><span class="muted">Altura</span><br><b>${heightText(b.height)}</b></div><div><span class="muted">Peso</span><br><b>${weightText(a.weight)}</b></div><div><span class="muted">Peso</span><br><b>${weightText(b.weight)}</b></div></div><button class="btn btn-primary" style="margin-top:20px" id="openArena">Abrir comparação na Arena 3D →</button></div>`}
async function favoritesPage(root){const items=favoritesService.list();root.innerHTML=`${heading('SUA COLEÇÃO','Pokémon favoritos','Todos os Pokémon que você guardou em sua coleção.')}<div class="section-head"><div><h2>${items.length} Pokémon salvos</h2></div><button class="btn btn-outline" id="favToDex">Adicionar mais</button></div><div class="grid-cards" id="favGrid">${items.length?'<div class="skeleton" style="height:170px"></div>':'<div class="empty-state" style="grid-column:1/-1"><div class="emoji">♡</div><b>Sua coleção está esperando!</b><p>Explore a Pokédex e salve seus Pokémon favoritos.</p><button class="btn btn-blue" onclick="location.hash=\'#/pokedex\'">Explorar Pokédex</button></div>'}</div>`;document.querySelector('#favToDex').onclick=()=>go('pokedex');if(items.length){const ps=await Promise.all(items.map(x=>api.pokemon(x.id).catch(()=>null)));document.querySelector('#favGrid').innerHTML=ps.filter(Boolean).map(card).join('')}}
async function randomPage(root){root.innerHTML=`${heading('SURPRESA','Descoberta aleatória','Deixe o acaso escolher seu próximo Pokémon favorito.')}<div class="panel" style="max-width:650px;margin:25px auto;text-align:center;padding:30px" id="randomCard"><div class="muted">Preparando sua descoberta...</div></div>`;await discoverRandom()}
async function discoverRandom(){const slot=document.querySelector('#randomCard');if(!slot)return;slot.innerHTML='<div class="skeleton" style="height:220px"></div>';try{const id=Math.floor(Math.random()*1025)+1;const p=await api.pokemon(id);slot.innerHTML=`<div class="eyebrow">SUA DESCOBERTA</div><div class="muted" style="font-size:12px">Nº ${String(p.id).padStart(4,'0')}</div><img src="${pokemonImage(p)}" style="width:230px;height:220px;object-fit:contain;animation:slidein .4s ease" alt="${p.name}"><h2 style="text-transform:capitalize;color:var(--navy);font-size:26px">${p.name}</h2><div class="type-row" style="justify-content:center">${p.types.map(t=>typePill(t.type.name)).join('')}</div><p class="muted" style="font-size:12px">${heightText(p.height)} · ${weightText(p.weight)}</p><div style="display:flex;justify-content:center;gap:9px;margin-top:18px"><button class="btn btn-outline" data-open="${p.id}">Ver detalhes</button><button class="btn btn-primary" id="anotherRandom">Descobrir outro ✦</button></div>`;document.querySelector('#anotherRandom').onclick=discoverRandom}catch(e){slot.innerHTML=`<div class="notice">${e.message}</div>`}}
async function arenaPage(root){
  setPageTitle('Comparação visual 3D');
  root.innerHTML=`${heading('OBSERVAÇÃO','Arena de comparação 3D','Observe dois Pokémon lado a lado em uma apresentação tridimensional. Esta área não executa batalhas nem calcula dano.') }
    <div class="panel" style="margin-top:20px">
      <div class="battle-selectors">
        <label class="battle-select"><span>PRIMEIRO POKÉMON</span><input id="arenaA" value="${compareA}" aria-label="Primeiro Pokémon, nome ou número"></label>
        <span class="battle-versus">VS</span>
        <label class="battle-select"><span>SEGUNDO POKÉMON</span><input id="arenaB" value="${compareB}" aria-label="Segundo Pokémon, nome ou número"></label>
        <button class="btn btn-primary battle-start" id="arenaLoad">Comparar</button>
      </div>
      <div class="arena battle-arena" id="arenaCanvas" style="margin-top:18px;min-height:360px">
        <div class="battle-stage-message" id="battleStageMessage">Escolha dois Pokémon para iniciar a comparação visual.</div>
      </div>
      <div class="battle-message" id="battleMessage" role="status" aria-live="polite">A arena apresenta sprites 2D em uma cena 3D; não representa uma batalha oficial.</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-outline" id="arenaReset">Centralizar câmera</button>
        <button class="btn btn-outline" id="arenaConventional">Ver comparação estatística</button>
      </div>
    </div>`;
  document.querySelector('#arenaLoad').onclick=loadArena;
  document.querySelector('#arenaReset').onclick=()=>arenaInstance?.reset();
  document.querySelector('#arenaConventional').onclick=()=>go('compare');
  await loadArena();
}

async function loadArena(){
  const canvas=document.querySelector('#arenaCanvas');
  if(!canvas)return;
  const epoch=++battleEpoch;
  if(arenaInstance){arenaInstance.dispose();arenaInstance=null}
  const message=document.querySelector('#battleMessage');
  if(message)message.textContent='Carregando dados dos Pokémon…';
  try{
    const [a,b]=await Promise.all([
      api.pokemon(document.querySelector('#arenaA').value.trim()),
      api.pokemon(document.querySelector('#arenaB').value.trim())
    ]);
    if(epoch!==battleEpoch)return;
    compareA=a.id;compareB=b.id;
    const {mountArena}=await import('./comparison/engine/arena.js');
    if(epoch!==battleEpoch)return;
    arenaInstance=await mountArena(canvas,a,b);
    if(epoch!==battleEpoch){arenaInstance.dispose();arenaInstance=null;return}
    if(message)message.textContent=`Comparação visual: ${cap(a.name)} × ${cap(b.name)}. Nenhum combate ou cálculo de dano é executado.`;
    const stageMessage=document.querySelector('#battleStageMessage');
    if(stageMessage)stageMessage.textContent='Use o mouse ou o toque para girar e aproximar a câmera.';
  }catch(error){
    if(epoch!==battleEpoch)return;
    if(message)message.textContent=error.message;
    const stageMessage=document.querySelector('#battleStageMessage');
    if(stageMessage)stageMessage.textContent='Não foi possível carregar os dois Pokémon. Confira os nomes ou números.';
  }
}

async function battlePage(root){
  root.innerHTML=`${heading('CENTRO DE BATALHAS','Duelo Pokémon','Monte um duelo local contra um treinador controlado pelo computador. Os turnos usam uma simulação simplificada, não regras oficiais competitivas.')}
    <div class="battle-page">
      <div class="panel" style="margin:20px 0">
        <div class="battle-selectors">
          <label class="battle-select"><span>SEU POKÉMON</span><input id="battlePlayer" value="25" aria-label="Seu Pokémon, nome ou número"></label>
          <span class="battle-versus">VS</span>
          <label class="battle-select"><span>OPONENTE (CPU)</span><input id="battleCpu" value="6" aria-label="Pokémon oponente, nome ou número"></label>
          <button class="btn btn-primary battle-start" id="battleStart">Iniciar duelo</button>
        </div>
        <p class="muted" style="font-size:11px;margin:8px 0 0">Escolha qualquer Pokémon da PokéAPI pelo nome ou número. Cada duelo é independente e acontece neste navegador.</p>
      </div>
      <div class="battle-layout">
        <main class="battle-paper">
          <div class="battle-topline"><span>◉ POKÉVERSE · ARENA CLÁSSICA</span><span id="battleRound">AGUARDANDO DUELO</span></div>
          <div class="battle-ribbon"><span>ARENA DE COMBATE</span><span class="battle-ribbon-type">TURNOS · GOLPES · TIPOS</span></div>
          <div class="battle-arena pixel-battle-arena" id="battleStage">
            <div class="pixel-fighter enemy" id="battleEnemySprite"></div>
            <div class="pixel-fighter player" id="battlePlayerSprite"></div>
            <div class="battle-hud">
              <div class="battle-hp-card"><strong id="battleEnemyName">Oponente</strong><span id="battleEnemyHpText">HP —</span><div class="battle-hp-track"><div id="battleEnemyHp" class="battle-hp-fill"></div></div></div>
              <div class="battle-hud-center"><b>VS</b><span id="battleTurn">Pronto?</span></div>
              <div class="battle-hp-card battle-hp-right"><strong id="battlePlayerName">Você</strong><span id="battlePlayerHpText">HP —</span><div class="battle-hp-track"><div id="battlePlayerHp" class="battle-hp-fill"></div></div></div>
            </div>
            <div class="battle-stage-message" id="battleNarration">Escolha os Pokémon e inicie o duelo.</div>
          </div>
          <section class="battle-command">
            <div class="battle-command-head"><div><span class="eyebrow">SEU TURNO</span><h2>Escolha um golpe</h2></div><button class="btn btn-outline" id="battleRestart" disabled>Novo duelo</button></div>
            <div class="battle-moves" id="battleMoves"><div class="battle-message">Os golpes aparecerão aqui após iniciar o duelo.</div></div>
            <div class="battle-message" id="battleMessage" role="status" aria-live="polite">O combate é local e não possui multiplayer.</div>
            <ol class="battle-log" id="battleLog" aria-label="Registro do combate"></ol>
          </section>
        </main>
        <aside class="battle-sidebar">
          <div class="battle-side-heading"><span>⚔</span><div><small>POKÉVERSE</small><h2>Combatentes</h2></div></div>
          <div class="battle-side-tabs"><span class="is-selected">DUELO LOCAL</span><span>STATUS</span></div>
          <div class="battle-roster" id="battleRoster"><div class="battle-roster-empty">Os combatentes serão exibidos aqui.</div></div>
          <div class="battle-side-note"><span>ⓘ</span><p>Modelo simplificado: atributos base, poder do golpe, tipo, STAB, precisão e chance de crítico. Não reproduz todos os sistemas dos jogos oficiais.</p></div>
          <button class="btn btn-outline battle-compare-link" id="battleCompare">Comparar atributos</button>
        </aside>
      </div>
      <p class="battle-footnote">Sprites pixelados e informações fornecidos pela PokéAPI. A simulação é recreativa e não equivale ao Pokémon Showdown nem a um simulador competitivo oficial.</p>
    </div>`;
  document.querySelector('#battleStart').onclick=startBattle;
  document.querySelector('#battleRestart').onclick=startBattle;
  document.querySelector('#battleCompare').onclick=()=>go('compare');
  document.querySelector('#battleMoves').onclick=event=>{
    const button=event.target.closest('[data-battle-move]');
    if(button)playSimpleBattleTurn(Number(button.dataset.battleMove));
  };
}

async function loadBattleMoves(pokemon){
  const candidates=pokemon.moves.slice(0,24);
  const details=await Promise.all(candidates.map(entry=>api.move(entry.move.name).catch(()=>null)));
  return details.filter(move=>move&&move.power>0&&move.damage_class?.name!=='status').slice(0,4);
}

async function startBattle(){
  const epoch=++battleEpoch;
  activeBattle=null;
  const message=document.querySelector('#battleMessage');
  const moves=document.querySelector('#battleMoves');
  const narration=document.querySelector('#battleNarration');
  if(message)message.textContent='Preparando os combatentes e consultando os golpes…';
  if(moves)moves.innerHTML='<div class="battle-message">Carregando golpes reais da PokéAPI…</div>';
  if(narration)narration.textContent='Os treinadores estão escolhendo seus Pokémon.';
  try{
    const [player,cpu]=await Promise.all([
      api.pokemon(document.querySelector('#battlePlayer').value.trim()),
      api.pokemon(document.querySelector('#battleCpu').value.trim())
    ]);
    if(epoch!==battleEpoch)return;
    const [playerMoves,cpuMoves]=await Promise.all([loadBattleMoves(player),loadBattleMoves(cpu)]);
    if(epoch!==battleEpoch)return;
    if(!playerMoves.length||!cpuMoves.length)throw new Error('Não encontramos golpes de dano para um dos Pokémon. Escolha outra espécie.');
    const hpPlayer=maxHp(player),hpCpu=maxHp(cpu);
    activeBattle={player,cpu,playerMoves,cpuMoves,hpPlayer,maxPlayer:hpPlayer,hpCpu,maxCpu:hpCpu,turn:1,busy:false,finished:false,log:[`O duelo começou: ${cap(player.name)} contra ${cap(cpu.name)}.`],message:'Escolha um golpe para começar.'};
    compareA=player.id;compareB=cpu.id;
    renderSimpleBattle();
  }catch(error){
    if(epoch!==battleEpoch)return;
    if(message)message.textContent=error.message;
    if(narration)narration.textContent='Não foi possível preparar o duelo.';
    if(moves)moves.innerHTML='<div class="battle-message">Confira os nomes ou números e tente novamente.</div>';
  }
}

function renderSimpleBattle(){
  const state=activeBattle;
  if(!state)return;
  const updateHp=(side,current,max,name)=>{
    const title=document.querySelector(`#battle${side}Name`);
    const text=document.querySelector(`#battle${side}HpText`);
    const bar=document.querySelector(`#battle${side}Hp`);
    if(title)title.textContent=cap(name);
    if(text)text.textContent=`HP ${Math.max(0,current)} / ${max}`;
    if(bar){bar.style.width=`${Math.max(0,current)/max*100}%`;bar.classList.toggle('is-low',current/max<=.25)}
  };
  updateHp('Player',state.hpPlayer,state.maxPlayer,state.player.name);
  updateHp('Enemy',state.hpCpu,state.maxCpu,state.cpu.name);
  const sprite=(id,pokemon,side)=>{
    const slot=document.querySelector(id);
    if(!slot)return;
    const src=side==='player'?(pokemon.sprites.back_default||pokemon.sprites.front_default):pokemon.sprites.front_default;
    slot.innerHTML=`<img src="${src||pokemonImage(pokemon)}" alt="${cap(pokemon.name)}" style="image-rendering:pixelated" onerror="this.onerror=null;this.src='${pokemonImage(pokemon)}'">`;
  };
  sprite('#battlePlayerSprite',state.player,'player');
  sprite('#battleEnemySprite',state.cpu,'enemy');
  const round=document.querySelector('#battleRound');
  const turn=document.querySelector('#battleTurn');
  const message=document.querySelector('#battleMessage');
  const narration=document.querySelector('#battleNarration');
  if(round)round.textContent=state.finished?'DUELO FINALIZADO':`TURNO ${state.turn}`;
  if(turn)turn.textContent=state.finished?'Fim':state.busy?'Executando…':'Sua vez';
  if(message)message.textContent=state.message;
  if(narration)narration.textContent=state.finished?state.message:state.busy?'Os golpes estão sendo executados…':'Escolha um dos golpes abaixo.';
  const moves=document.querySelector('#battleMoves');
  if(moves)moves.innerHTML=state.playerMoves.map((move,index)=>`<button class="battle-move" data-battle-move="${index}" style="--move-color:${TYPE_COLORS[move.type.name]||'#718096'}" ${state.busy||state.finished?'disabled':''}><span class="battle-move-name">${moveLabel(move)}</span><span class="battle-move-meta">${TYPE_PT[move.type.name]||cap(move.type.name)} · ${cap(move.damage_class.name)} · PODER ${move.power} · PRECISÃO ${move.accuracy??'—'}</span></button>`).join('');
  const log=document.querySelector('#battleLog');
  if(log)log.innerHTML=state.log.slice(-8).map(entry=>`<li>${entry}</li>`).join('');
  const roster=document.querySelector('#battleRoster');
  if(roster)roster.innerHTML=[[state.player,state.hpPlayer,state.maxPlayer,'SEU POKÉMON'],[state.cpu,state.hpCpu,state.maxCpu,'CPU']].map(([pokemon,current,max,label])=>`<article class="battle-roster-card ${label==='SEU POKÉMON'?'is-player':''}"><img src="${pokemon.sprites.front_default||pokemonImage(pokemon)}" alt="${cap(pokemon.name)}" style="image-rendering:pixelated"><div class="battle-roster-copy"><span>${label} · Nº ${String(pokemon.id).padStart(3,'0')}</span><strong>${cap(pokemon.name)}</strong><div class="type-row">${pokemon.types.map(entry=>typePill(entry.type.name)).join('')}</div><small>HP ${Math.max(0,current)} / ${max}</small><div class="battle-roster-track"><div style="width:${Math.max(0,current)/max*100}%"></div></div></div></article>`).join('');
  const restart=document.querySelector('#battleRestart');
  if(restart)restart.disabled=!state.finished;
}

async function executeSimpleMove(attacker,defender,move,attackerSide){
  const effectiveness=await getMoveEffectiveness(move.type.name,defender);
  const result=simplifiedDamage(attacker,defender,move,effectiveness);
  const state=activeBattle;
  if(result.missed){state.log.push(`${cap(attacker.name)} tentou ${moveLabel(move)}, mas o golpe errou.`);return result}
  const defenderLabel=attackerSide==='player'?'oponente':'seu Pokémon';
  const prefix=attackerSide==='player'?`${cap(attacker.name)}`:`${cap(attacker.name)} (CPU)`;
  state.log.push(`${prefix} usou ${moveLabel(move)} e causou ${result.damage} de dano${effectiveness>1?' — super eficaz!':effectiveness===0?' — não afetou o alvo.':''}${result.critical?' Golpe crítico!':''}`);
  if(attackerSide==='player')state.hpCpu=Math.max(0,state.hpCpu-result.damage);
  else state.hpPlayer=Math.max(0,state.hpPlayer-result.damage);
  return result;
}

async function playSimpleBattleTurn(index){
  const state=activeBattle;
  if(!state||state.busy||state.finished||!state.playerMoves[index])return;
  state.busy=true;renderSimpleBattle();
  const epoch=battleEpoch;
  const stillActive=()=>activeBattle===state&&battleEpoch===epoch;
  try{
    const chosen=state.playerMoves[index];
    const cpuTypes=[...new Set(state.cpuMoves.map(move=>move.type.name))];
    const multipliers=await Promise.all(cpuTypes.map(async type=>[type,await getMoveEffectiveness(type,state.player)]));
    if(!stillActive())return;
    const cpuMove=chooseCpuMove(state.cpuMoves,state.cpu,state.player,Object.fromEntries(multipliers));
    const playerSpeed=statMap(state.player).speed||1;
    const cpuSpeed=statMap(state.cpu).speed||1;
    const playerFirst=playerSpeed===cpuSpeed?Math.random()<.5:playerSpeed>cpuSpeed;
    const actions=playerFirst?[[state.player,state.cpu,chosen,'player'],[state.cpu,state.player,cpuMove,'cpu']]:[[state.cpu,state.player,cpuMove,'cpu'],[state.player,state.cpu,chosen,'player']];
    for(const [attacker,defender,move,side] of actions){
      if(!stillActive())return;
      if((side==='player'&&state.hpCpu<=0)||(side==='cpu'&&state.hpPlayer<=0))break;
      await executeSimpleMove(attacker,defender,move,side);
      if(!stillActive())return;
      renderSimpleBattle();
      await new Promise(resolve=>setTimeout(resolve,450));
    }
    if(state.hpCpu<=0||state.hpPlayer<=0){
      state.finished=true;
      state.message=state.hpCpu<=0?`${cap(state.player.name)} venceu o duelo!`:`${cap(state.cpu.name)} venceu o duelo.`;
      state.log.push(state.message);
    }else{
      state.turn++;
      state.message='Turno concluído. Escolha seu próximo golpe.';
    }
  }catch(error){if(stillActive())state.message=`Falha ao executar o turno: ${error.message}`}
  finally{if(stillActive()){state.busy=false;renderSimpleBattle()}}
}

function settingsPage(root){const s=store.settings();document.body.classList.toggle('dark-preview',s.theme==='dark');root.innerHTML=`${heading('PREFERÊNCIAS','Configurações','Ajuste a experiência do PokéVerse.')}<div class="panel" style="max-width:700px;margin-top:22px"><div class="section-head" style="margin-top:0"><div><h2>Aparência</h2><p>Personalize a apresentação da aplicação.</p></div></div><div class="field"><label>TEMA</label><select class="select" id="themeSetting"><option value="light" ${s.theme==='light'?'selected':''}>Claro</option><option value="dark" ${s.theme==='dark'?'selected':''}>Escuro (experimental)</option></select></div><div class="field" style="margin-top:18px"><label>POKÉMON POR PÁGINA</label><select class="select" id="sizeSetting"><option value="12" ${pageSize===12?'selected':''}>12</option><option value="24" ${pageSize===24?'selected':''}>24</option><option value="48" ${pageSize===48?'selected':''}>48</option></select></div><button class="btn btn-blue" id="saveSettings" style="margin-top:20px">Salvar preferências</button></div><div class="panel" style="max-width:700px;margin-top:15px"><h2 style="font-size:16px">Dados locais</h2><p class="muted" style="font-size:12px">Favoritos, histórico e preferências ficam salvos neste navegador.</p><button class="btn btn-danger" id="clearHistory">Limpar histórico</button></div>`;document.querySelector('#saveSettings').onclick=()=>{const theme=document.querySelector('#themeSetting').value;store.saveSettings({theme,pageSize:Number(document.querySelector('#sizeSetting').value)});document.body.classList.toggle('dark-preview',theme==='dark');pageSize=Number(document.querySelector('#sizeSetting').value);toast('Preferências salvas!')};document.querySelector('#clearHistory').onclick=()=>{localStorage.removeItem('pokeverse:history');toast('Histórico removido.')}}
function aboutPage(root){root.innerHTML=`${heading('SOBRE','Conheça o PokéVerse','Um espaço para explorar, descobrir e comparar o universo Pokémon.')}<div class="panel" style="max-width:780px;margin-top:22px"><h2 style="color:var(--navy)">Uma Pokédex feita para treinadores</h2><p class="muted" style="line-height:1.8">O PokéVerse reúne consulta de Pokémon, exploração de tipos, cadeias evolutivas, favoritos e ferramentas de comparação em uma interface responsiva. Os dados são obtidos da PokéAPI.</p><div class="two-col"><div><b>Tecnologias</b><p class="muted" style="font-size:12px">Vite · JavaScript · Tailwind CSS · Three.js · Vercel Functions</p></div><div><b>Fonte de dados</b><p class="muted" style="font-size:12px">PokéAPI — pokeapi.co</p></div></div><div class="notice">Pokémon e seus nomes são marcas de seus respectivos titulares. PokéVerse é um projeto independente, sem afiliação oficial com Nintendo, The Pokémon Company ou Game Freak.</div></div>`}

// Event delegation for cards, favorites, routes, and actions.
document.addEventListener('click',async e=>{const fav=e.target.closest('[data-fav]');if(fav){e.stopPropagation();const id=Number(fav.dataset.fav);try{const p=await api.pokemon(id);const added=favoritesService.toggle(p);fav.classList.toggle('is-fav',added);fav.textContent=added?'♥':'♡';toast(added?'Adicionado aos favoritos':'Removido dos favoritos');if(currentPage==='favorites')favoritesPage(document.querySelector('#pageContent'))}catch(err){toast(err.message)}return}const open=e.target.closest('[data-open]');if(open){go(`detail/${open.dataset.open}`);return}const route=e.target.closest('[data-go]');if(route){go(route.dataset.go);return}const type=e.target.closest('[data-explore-type]');if(type){const t=type.dataset.exploreType;const slot=document.querySelector('#typeResults');slot.innerHTML=`<div class="section-head"><div><h2>Pokémon do tipo ${TYPE_PT[t]}</h2></div></div><div class="grid-cards" id="typeGrid"></div>`;const data=await api.type(t);const pokemon=data.pokemon.slice(0,24).map(x=>({name:x.pokemon.name}));const ps=await fetchMany(pokemon);document.querySelector('#typeGrid').innerHTML=ps.map(card).join('');slot.scrollIntoView({behavior:'smooth'});return}if(e.target.id==='openArena')go('arena')});
window.addEventListener('hashchange',()=>{battleEpoch++;render()});
document.addEventListener('click',e=>{if(e.target.id==='quickSearch')go('pokedex');if(e.target.id==='themeToggle'){const enabled=document.body.classList.toggle('dark-preview');const s=store.settings();store.saveSettings({...s,theme:enabled?'dark':'light'});toast('Tema atualizado.')}if(e.target.id==='mobileMenu'){document.querySelector('.sidebar')?.classList.toggle('mobile-open')}});
shell();render();

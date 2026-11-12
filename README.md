# PokéVerse

PokéVerse é uma aplicação SPA em português brasileiro para explorar Pokémon, consultar informações da PokéAPI, comparar atributos e disputar duelos locais em turnos.

## Tecnologias

- Vite e JavaScript ES Modules (sem React/Vue/Angular)
- Tailwind CSS
- Three.js para comparação visual 3D opcional
- Vercel Functions como gateway da PokéAPI
- PokéAPI como fonte de dados de espécies, atributos, tipos e golpes

## Requisitos e execução

- Node.js 20+ (recomendado Node.js 22 LTS)
- npm

```bash
npm ci
npm run dev
```

Para gerar a versão de produção:

```bash
npm run build
npm run preview
```

## Funcionalidades

- SPA com navegação por hash.
- Pokédex paginada, busca por nome/número e filtros por tipo.
- Página detalhada, atributos, habilidades, espécie e evolução.
- Explorador de tipos.
- Favoritos, histórico, pesquisas recentes e preferências em LocalStorage.
- Comparação estatística e análise de efetividade de tipos.
- Comparação visual 3D opcional com Three.js.
- Duelos locais por turnos contra CPU, com golpes reais consultados na PokéAPI, atributos base, tipos, STAB, precisão, chance de crítico, HP, velocidade e registro do combate.
- Arena de batalha com sprites pixelados.

## Sistema de batalha: escolha técnica

O projeto usa um **motor próprio simplificado em JavaScript**, em vez de Pokémon Showdown. Para o escopo atual — duelo local contra CPU, sem multiplayer e sem exigência de compatibilidade competitiva — isso reduz dependências e complexidade de infraestrutura, mantendo o controle sobre a interface e a execução no navegador.

O motor lê os golpes e atributos da PokéAPI. O cálculo de dano considera poder, ataque/defesa física ou especial, efetividade de tipo, STAB, precisão, variação aleatória e chance de crítico. A CPU escolhe um golpe com base no dano estimado e na efetividade contra o jogador. A velocidade base define a ordem das ações.

**Limitações importantes:** esta é uma simulação recreativa e aproximada. Não implementa todos os sistemas dos jogos oficiais: habilidades em combate, itens, status, clima, terreno, prioridade, PP, troca de Pokémon, IVs/EVs, naturezas, regras de formatos, doubles ou todos os modificadores. Não é Pokémon Showdown, não deve ser anunciada como simulador competitivo e não garante resultados idênticos aos jogos oficiais.

Não há multiplayer, matchmaking, salas, autenticação ou persistência remota de batalhas. Cada duelo ocorre no navegador do jogador.

## API Gateway

- `GET /api/pokemon?limit=24&offset=0`
- `GET /api/pokemon/:id`
- `GET /api/species/:id`
- `GET /api/evolution-chain/:id`
- `GET /api/evolution/:id` (resolve espécie para cadeia)
- `GET /api/abilities/:id`
- `GET /api/moves/:id`
- `GET /api/types`
- `GET /api/types/:id`

As funções validam métodos e parâmetros, aplicam timeout e cache HTTP. O cache em memória é uma otimização por instância serverless, não persistência compartilhada.

## Vercel

Configure o projeto com:

- Root Directory: raiz do repositório.
- Framework Preset: Vite.
- Install Command: `npm ci`.
- Build Command: `npm run build`.
- Output Directory: `dist`.

As funções em `api/` são detectadas pela Vercel. O projeto não exige credenciais privadas para consultar a PokéAPI. Não coloque segredos no frontend.

## Dados locais

Favoritos, histórico, buscas e preferências são armazenados no LocalStorage e não sincronizam entre dispositivos.

## Licenças e créditos

- Dados e endpoints: [PokéAPI](https://pokeapi.co/).
- Three.js: [MIT](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
- Tailwind CSS: [MIT](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE).
- Vite: [MIT](https://github.com/vitejs/vite/blob/main/LICENSE).

Pokémon e elementos relacionados pertencem aos respectivos titulares. PokéVerse é um projeto independente, sem afiliação oficial com Nintendo, The Pokémon Company ou Game Freak. Confira as licenças das imagens e sprites antes de redistribuir os arquivos.

## Antes de publicar

1. Execute `npm ci` e `npm run build`.
2. Faça deploy na Vercel com as configurações acima.
3. Verifique Pokédex, detalhes, evoluções, tipos, comparação 3D e pelo menos um duelo completo em desktop e celular.
4. Monitore erros de funções e limites da PokéAPI.
5. Não divulgue o duelo simplificado como batalha oficial ou competitiva.

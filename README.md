# PokéVerse

PokéVerse é uma aplicação SPA responsiva para explorar Pokémon, consultar informações da PokéAPI, visualizar evoluções, salvar favoritos, comparar atributos e disputar batalhas por turnos.

## Tecnologias

- Vite e JavaScript ES Modules (sem React, Vue ou Angular)
- HTML5 e CSS3 com Tailwind CSS v4
- Three.js e WebGL para a arena 3D
- Vercel Functions (Node.js) como API Gateway
- PokéAPI como fonte de dados
- LocalStorage para favoritos, histórico e preferências

## Requisitos

- Node.js 20 ou superior recomendado
- npm
- Navegador moderno. A arena 3D depende de WebGL; se não estiver disponível, use a comparação convencional.

## Instalação e execução local

```bash
npm install
npm run dev
```

Abra o endereço informado pelo Vite (normalmente http://localhost:5173).

Para validar a versão de produção:

```bash
npm run build
npm run preview
```

O cliente usa `/api` como caminho principal. Durante o desenvolvimento, o Vite encaminha as chamadas para a PokéAPI. Em produção, as funções de `api/` na Vercel funcionam como gateway e consultam `https://pokeapi.co/api/v2`.

## Estrutura

```text
api/                 Funções serverless e gateway da PokéAPI
public/              Recursos estáticos e espaço para modelos licenciados
src/components/      Componentes compartilhados (extensões futuras)
src/pages/           Espaço para separar páginas em módulos
src/services/        Cliente da API e regras de consulta
src/state/           Persistência local
src/utils/           Formatação e interpretação de evoluções
src/comparison/      Motor e cenas Three.js
src/config/          Paleta de tipos e rótulos em português
src/styles/          Estilos globais e responsivos
```

## Funcionalidades

- Início com destaques, acesso rápido e histórico/favoritos.
- Pokédex paginada, busca por nome ou número e filtros combináveis por tipo.
- Detalhes de Pokémon: tipos, altura, peso, habilidades, experiência, estatísticas e pontuação total.
- Dados de espécie: descrição localizada quando disponível, geração, habitat, cor, formato, classificação, taxa de captura, gênero, grupos de ovos e crescimento.
- Cadeias evolutivas com requisitos interpretados (nível, item, amizade, troca, período e local, quando informados pela API).
- Coleção de favoritos, descoberta aleatória, histórico e preferências locais.
- Comparação de dois Pokémon por atributos, medidas e tipos.
- Simulador de batalhas por turnos com animações de ataque, HP, movimentos derivados dos tipos, efetividade de tipos, STAB, dano por atributos e escolha automática do movimento do rival.
- Arena Three.js com câmera orbital, zoom, iluminação, plataformas e sprites oficiais animados como combatentes. A tela usa uma apresentação em papel e painel lateral inspirada na referência visual.

## API Gateway

- `GET /api/pokemon?limit=24&offset=0`
- `GET /api/pokemon/:id`
- `GET /api/species/:id`
- `GET /api/evolution/:id` (recebe o identificador de Pokémon e resolve a cadeia da espécie)
- `GET /api/abilities/:id`
- `GET /api/types`

As funções validam identificadores, aplicam timeout, cache em memória por instância e respostas JSON padronizadas. Como a Vercel pode encerrar e recriar instâncias serverless, o cache em memória é apenas uma otimização temporária, não armazenamento persistente.

## Favoritos e histórico

Os dados ficam no LocalStorage do navegador. Eles não são sincronizados entre dispositivos e podem ser apagados ao limpar os dados do navegador. Nenhum login ou banco de dados é necessário.

## Arena e batalhas

A cena é importada dinamicamente apenas ao entrar na arena. A implementação usa ilustrações oficiais da PokéAPI em sprites posicionados no espaço 3D, plataformas e controles orbitais; os sprites avançam e recuam nos ataques. O simulador calcula dano com base nos atributos, no poder do movimento, no STAB e na efetividade de tipo. Os movimentos são criados a partir dos tipos do Pokémon; o oponente escolhe automaticamente a melhor opção disponível. A PokéAPI não disponibiliza modelos 3D oficiais nem dados de movimentos aprendidos e poder, então esta experiência não representa a lista oficial de golpes. Modelos GLB licenciados podem ser adicionados em `public/models/` e integrados ao carregador.

## Vercel

1. Envie o repositório para o GitHub.
2. Importe o repositório na Vercel.
3. Use a raiz do projeto como Root Directory.
4. Framework Preset: Vite.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Install Command: `npm install`.
8. Faça o deploy. Não são necessárias variáveis de ambiente na versão inicial.

O `vercel.json` mantém as rotas `/api` direcionadas às funções e encaminha as demais rotas SPA para `index.html`.

## Limitações conhecidas

- A PokéAPI não fornece modelos 3D oficiais; a arena usa sprites/ilustrações como objetos 2D dentro de uma cena 3D. A qualidade visual é inferior a modelos 3D nativos.
- Algumas descrições da API podem não possuir tradução pt-BR; há fallback para português europeu e mensagem neutra.
- A PokéAPI é um serviço externo. Indisponibilidade ou lentidão externa pode afetar consultas novas.
- A persistência é local ao navegador; não há sincronização entre contas/dispositivos.
- O cache serverless em memória não é compartilhado entre instâncias.
- O catálogo randômico considera o intervalo de IDs até 1025; futuras espécies podem exigir atualização desse limite.
- A aplicação é um projeto independente e não é afiliada à Nintendo, The Pokémon Company ou Game Freak.

## Créditos

Dados fornecidos pela [PokéAPI](https://pokeapi.co/). Pokémon e elementos relacionados pertencem aos respectivos titulares.

## Nota de validação do pacote

O ambiente em que este arquivo foi montado não conseguiu resolver o domínio do registro npm. Por isso, foi possível executar os testes unitários nativos do Node.js e validar a sintaxe JavaScript e o ZIP, mas não foi possível baixar dependências nem executar `vite build` aqui. O `package-lock.json` contém o manifesto raiz e será completado pelo `npm install` no primeiro ambiente com acesso ao registro npm. Antes do deploy, execute `npm install`, `npm test` e `npm run build` localmente.

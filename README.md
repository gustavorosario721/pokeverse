# PokéVerse

PokéVerse é uma aplicação SPA em português brasileiro para consultar e explorar dados Pokémon. O projeto usa Vite, JavaScript ES Modules, Tailwind CSS, Three.js e funções serverless da Vercel.

> **Estado real da implementação:** a Pokédex e as consultas à PokéAPI estão implementadas; favoritos, histórico e preferências são locais ao navegador; a arena atual é uma comparação visual animada. O combate existente anteriormente era uma simulação simplificada própria e **não** reproduzia as regras oficiais. Ele não deve ser apresentado como batalha competitiva ou como integração Pokémon Showdown. Multiplayer, matchmaking, autenticação, persistência compartilhada e motor oficial de batalha ainda não estão implementados. Não anuncie esses recursos como disponíveis.

## Requisitos

- Node.js 20 ou superior (recomendado Node.js 22 LTS)
- npm
- Navegador moderno

## Instalação e execução

```bash
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite.

## Verificação local

```bash
npm test
npm run build
npm run preview
```

O build deve ser executado com dependências instaladas e acesso ao registry npm. A conclusão desta auditoria não equivale a uma execução de build no ambiente de produção.

## Funcionalidades presentes

- SPA com navegação por hash.
- Pokédex paginada, pesquisa por nome ou número e filtros por tipo.
- Consulta de detalhes, atributos, habilidades e dados de espécie.
- Cadeias evolutivas consultadas pelo gateway da aplicação.
- Exploração dos tipos.
- Favoritos, histórico, pesquisas recentes e preferências em LocalStorage.
- Comparação estatística de Pokémon.
- Arena Three.js com sprites 2D, plataformas, câmera orbital e animações de apresentação.
- Gateway serverless para PokéAPI em `api/`.

## Funcionalidades ainda necessárias para corresponder ao escopo completo

1. Integrar o motor de simulação Pokémon Showdown (`@pkmn/sim` ou integração oficialmente compatível), validar sua compatibilidade de runtime e licença e criar testes de conformidade.
2. Substituir integralmente qualquer fórmula própria de dano por processamento autoritativo no motor.
3. Implementar construtor de equipes com golpes, habilidades, itens, formatos e validação real.
4. Implementar endpoints e serviços de batalha com validação server-side, controle de turno, idempotência e autorização.
5. Implementar persistência compartilhada e matchmaking. Vercel Functions não fornecem, por si só, um processo WebSocket persistente nem estado compartilhado entre instâncias.
6. Definir e provisionar uma integração compatível com Vercel para coordenação/persistência e testar com duas sessões independentes. Sem essa infraestrutura, não há multiplayer real.
7. Implementar histórico remoto de partidas e reconexão.
8. Implementar a interface pixel-art de batalha. A arena Three.js existente é comparação visual e não é a arena de batalha Game Boy descrita no escopo.
9. Implementar testes de integração e end-to-end para os fluxos críticos.

## API Gateway

- `GET /api/pokemon?limit=24&offset=0`
- `GET /api/pokemon/:id`
- `GET /api/species/:id`
- `GET /api/evolution/:id`
- `GET /api/abilities/:id`
- `GET /api/types`
- `GET /api/types/:id`

As funções validam métodos e parâmetros, aplicam timeout, limitam a paginação e retornam erros JSON sem expor detalhes internos da PokéAPI. O cache em memória é apenas uma otimização por instância serverless; não é persistência compartilhada.

## Configuração Vercel

- Root Directory: raiz do repositório.
- Framework: Vite.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Install Command: `npm ci`.

As funções sob `api/` são detectadas pela Vercel. Não são necessárias variáveis de ambiente para o gateway público da PokéAPI. Nenhum segredo deve ser colocado no frontend.

## Dados locais

Favoritos, histórico, buscas e preferências ficam no LocalStorage. Eles não são sincronizados entre dispositivos e podem ser removidos pelo usuário ao limpar os dados do navegador.

## Licenças e créditos

- Dados: [PokéAPI](https://pokeapi.co/).
- Three.js: [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE).
- Tailwind CSS: [MIT License](https://github.com/tailwindlabs/tailwindcss/blob/main/LICENSE).
- Vite: [MIT License](https://github.com/vitejs/vite/blob/main/LICENSE).

Pokémon e elementos relacionados são propriedade de seus respectivos titulares. PokéVerse é um projeto independente, sem afiliação oficial com Nintendo, The Pokémon Company ou Game Freak. Verifique os termos das fontes de arte antes de redistribuir assets. As imagens atualmente utilizadas são servidas pela infraestrutura pública da PokéAPI/PokeAPI sprites repository; sua disponibilidade não concede licença de redistribuição irrestrita.

## Checklist antes de produção

- [ ] Executar `npm ci`, `npm test` e `npm run build` em Node suportado.
- [ ] Testar todos os endpoints no deployment Vercel.
- [ ] Testar navegação direta e refresh em rotas SPA.
- [ ] Testar acessibilidade, teclado, leitor de tela e responsividade.
- [ ] Adicionar testes de navegador e monitoramento de erros.
- [ ] Implementar e testar o motor oficial e o multiplayer antes de anunciar batalhas online.
- [ ] Revisar licenças de todos os assets efetivamente distribuídos.

**Não considerar o projeto em conformidade integral com o prompt enquanto os itens de batalha e multiplayer acima permanecerem pendentes.**

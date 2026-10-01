# DevStacksHub: do Base44 para um repositório no padrão da família

Data: 2026-10-01 · Repositório: `hugobastoss/devstackshub`

## Objetivo

Tirar o DevStacksHub do Base44 (`devstackshub.base44.app`, app React gerado
pela plataforma) e reescrevê-lo como site estático no padrão do
[DevSkillsHub](https://github.com/hugobastoss/devskillshub) e do
[DevIAHub](https://github.com/hugobastoss/deviahub): HTML, CSS e JS sem build,
dados em JSON no repositório, validador no CI, sugestões por issue e publicação
no GitHub Pages.

**Sucesso significa:**
- O site novo, em `https://hugobastoss.github.io/devstackshub/`, tem catálogo,
  detalhe da stack, roadmaps, comparações e glossário, com os dados atuais do
  Base44.
- Quem abrir os três hubs reconhece a mesma família visual.
- O repositório tem a mesma organização dos irmãos e não depende do Base44.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Abordagem | Reescrever no padrão da família (sem React, sem build) |
| Páginas | Catálogo (com início), detalhe da stack, roadmaps (lista e detalhe), comparações, glossário |
| Fora | Gerador de arquitetura e a tabela de afinidades; login do Base44 |
| Popularidade | A nota manual 0–100 continua; stacks com repositório ganham estrelas do GitHub, atualizadas todo dia |
| Estrutura | Várias páginas HTML com um `comum.js` e um script por página |
| Destaque | Índigo: `#818CF8` (escuro) / `#4F46E5` (claro) |
| Categorias | Nomes em português; ids em inglês como hoje |
| Hospedagem | GitHub Pages, repositório público `hugobastoss/devstackshub` |
| Publicação | Autorizada direto, assim que os testes locais passarem |

## 1. Estrutura e dados

### Arquivos

```
index.html            # hero + categorias + catálogo
stack.html            # detalhe (?id=next-js)
roadmaps.html         # lista
roadmap.html          # detalhe (?id=criar-saas)
comparacoes.html
glossario.html
favicon.svg
.nojekyll
sitemap.xml
assets/
  styles.css
  icones.svg          # sprite com os ícones Lucide usados (licença ISC)
  comum.js            # topo, leitura dos JSON, card de stack, logo, favoritos, estrelas
  catalogo.js
  stack.js
  roadmaps.js
  roadmap.js
  comparacoes.js
  glossario.js
data/
  stacks.json         # categorias + stacks
  roadmaps.json
  comparacoes.json
  glossario.json      # categorias + termos
  estrelas.json       # gerado pela Action
scripts/
  validar-dados.mjs
  atualizar-estrelas.mjs
.github/
  ISSUE_TEMPLATE/sugerir-stack.yml
  pull_request_template.md
  workflows/validar-dados.yml
  workflows/atualizar-estrelas.yml
README.md
CONTRIBUTING.md
```

Cada página carrega `comum.js` e o seu próprio script, os dois com `defer`.
Nenhum script externo: só as fontes do Google Fonts e os logos do logo.dev.

### `data/stacks.json`

```json
{
  "categorias": {
    "frontend": { "nome": "Frontend", "descricao": "Frameworks e bibliotecas para interfaces", "icone": "monitor" }
  },
  "itens": [
    {
      "id": "next-js",
      "nome": "Next.js",
      "categoria": "frontend",
      "empresa": "Vercel",
      "descricao": "Framework React full-stack com SSR, SSG, ISR, API routes e App Router.",
      "site": "https://nextjs.org",
      "repositorio": "vercel/next.js",
      "docs": "https://nextjs.org/docs",
      "codigo_aberto": true,
      "plano_gratuito": true,
      "self_hosted": false,
      "preco_inicial": "$0",
      "linguagem": "TypeScript",
      "popularidade": 99,
      "tags": ["React", "SSR"],
      "recursos": ["SSR", "SSG"],
      "casos_de_uso": ["SaaS", "Blog"],
      "cor": "#FAFAFA",
      "adicionado": "2026-07-18"
    }
  ]
}
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `id` | sim | kebab-case, único; na migração, gerado do nome |
| `nome`, `descricao` | sim | texto; `descricao` até 220 caracteres |
| `categoria` | sim | chave de `categorias` |
| `empresa` | não | texto |
| `site` | sim | URL `https` |
| `repositorio` | não | `dono/repo` no GitHub |
| `docs`, `discord` | não | URL `https` |
| `codigo_aberto`, `plano_gratuito`, `self_hosted` | sim | booleano |
| `preco_inicial`, `linguagem` | não | texto |
| `popularidade` | sim | inteiro de 0 a 100 |
| `tags`, `recursos`, `casos_de_uso` | não | lista de textos |
| `cor` | não | hex `#RRGGBB`, fundo da inicial quando o logo falha |
| `porque` | não | até 320 caracteres; aparece como "Por que recomendamos" |
| `adicionado` | sim | `AAAA-MM-DD` |

**Categorias.** A ordem das chaves é a ordem na página. Os ids, os ícones e as
descrições são os do Base44; os nomes passam para português:

| id | nome | ícone |
|---|---|---|
| frontend | Frontend | monitor |
| backend | Backend | server |
| database | Banco de dados | database |
| authentication | Autenticação | lock |
| storage | Armazenamento | hard-drive |
| hosting | Hospedagem | cloud |
| deploy | Deploy | rocket |
| email | E-mail | mail |
| queue | Filas | list-ordered |
| cache | Cache | zap |
| analytics | Analytics | bar-chart-3 |
| monitoring | Monitoramento | activity |
| payments | Pagamentos | credit-card |
| ai | IA | sparkles |
| testing | Testes | flask-conical |
| documentation | Documentação | book-open |
| search | Busca | search |
| maps | Mapas | map |
| forms | Formulários | clipboard-list |
| security | Segurança | shield-check |
| devops | DevOps | git-branch |
| notifications | Notificações | bell |

### `data/roadmaps.json`

```json
{
  "roadmaps": [
    {
      "id": "criar-saas",
      "titulo": "Criar SaaS",
      "descricao": "…",
      "icone": "rocket",
      "categoria": "saas",
      "etapas": [
        { "categoria": "Frontend", "ferramenta": "Next.js", "descricao": "…", "stack": "next-js" }
      ]
    }
  ]
}
```

`stack` é opcional e, quando existe, precisa ser o `id` de uma stack. Na
migração ele é preenchido quando `ferramenta` bate com o nome de uma stack
(ignorando maiúsculas). O ícone usa o mesmo sprite; ícones que o Base44
guardava com nome de componente (`FileText`) viram o nome Lucide (`file-text`).

### `data/comparacoes.json`

```json
{
  "comparacoes": [
    {
      "id": "supabase-vs-firebase",
      "stack_a": "supabase",
      "stack_b": "firebase",
      "vencedor": "a",
      "linhas": [
        { "rotulo": "Banco de Dados", "a": "PostgreSQL", "b": "Firestore (NoSQL)", "vence": "a" },
        { "rotulo": "Auth", "a": true, "b": true }
      ]
    }
  ]
}
```

`vencedor` e `vence` valem `"a"`, `"b"` ou não aparecem. `a` e `b` são
booleano ou texto. As 6 comparações vêm do código do Base44.

### `data/glossario.json`

```json
{
  "categorias": { "frontend": "Frontend", "backend": "Backend & API" },
  "termos": [
    { "termo": "SSR", "expansao": "Server-Side Rendering", "categoria": "frontend", "descricao": "…", "relacionados": ["SSG", "ISR"] }
  ]
}
```

Os 79 termos e as 6 categorias vêm de `src/lib/glossaryTerms.js`. Um
relacionado que não existe como termo continua aparecendo, só que sem link.

### Validador (`scripts/validar-dados.mjs`)

Mesmo estilo e saída do validador dos irmãos ("OK: …" ou a lista de problemas
com o arquivo e o índice, saindo com código 1). Aceita uma pasta opcional para
testar contra cópias com erros. Ele confere:

- os campos de cada arquivo conforme as tabelas acima, e qualquer campo
  desconhecido é erro;
- ids únicos em stacks, roadmaps, comparações e termos;
- as referências entre arquivos: a `categoria` de cada stack e de cada termo
  existe; `etapas[].stack`, `stack_a` e `stack_b` são stacks existentes;
  `stack_a` ≠ `stack_b`;
- links `https` e `site` sem repetição (ignorando protocolo, `www.` e barra final);
- o `repositorio` no formato `dono/repo`.

O CI (`validar-dados.yml`) roda em PRs e pushes na `main` que mexem em `data/**`
ou no script.

### Estrelas

`scripts/atualizar-estrelas.mjs` e `atualizar-estrelas.yml` são os do
devskillshub, lendo `repositorio` de `data/stacks.json`. A Action roda todo dia
às 06:00 UTC, quando `data/stacks.json` muda na `main` e manualmente.

## 2. Visual e páginas

### Tokens

Iguais aos da família; muda só o destaque.

| Token | Escuro | Claro |
|---|---|---|
| `--bg` | `#0B0C0F` | `#F6F7F9` |
| `--surface` | `#13151A` | `#FFFFFF` |
| `--surface-2` | `#1A1D23` | `#F0F2F5` |
| `--line` | `#262A31` | `#E1E4EA` |
| `--ink` | `#ECEDEF` | `#14161A` |
| `--muted` | `#9BA1AB` | `#5B616B` |
| `--accent` | `#818CF8` | `#4F46E5` |
| `--accent-ink` | `#1E1B4B` | `#FFFFFF` |
| `--accent-soft` | `rgba(129,140,248,.1)` | `rgba(79,70,229,.08)` |
| `--gratuito` | `#34D399` | `#047857` |
| `--estrela` | `#FBBF24` | `#B45309` |

Fontes: Space Grotesk, Inter e JetBrains Mono. Os temas claro e escuro seguem
`prefers-color-scheme`.

**Ícone:** quadrado `rx=8` em `#818CF8` com o glifo "layers" do Lucide em
`#1E1B4B`. O mesmo SVG serve de favicon e de ícone do topo.

**Popularidade x estrelas:** a popularidade usa o ícone `trending-up`
(`↗ 99`, com o título "Popularidade de 0 a 100"). A estrela fica só para as
estrelas do GitHub, como no DevSkillsHub (`★ 135 mil`, com link para os
stargazers).

### Topo e rodapé (todas as páginas)

- **Topo fixo** com o ícone, "DevStacksHub" e os links Catálogo, Roadmaps,
  Comparações, Glossário e GitHub. A página atual tem `aria-current="page"`.
  Abaixo de 48rem, os links passam para uma segunda linha com rolagem lateral.
- **Rodapé:** "DevStacksHub · um projeto da HVCB App&Games" e "Cada
  ferramenta pertence aos seus criadores."

### `index.html`

1. **Hero:** grade de fundo e selo "Curadoria aberta".
   - Título: "Encontre a stack certa para o seu próximo **projeto.**"
   - Texto de apoio: "Mais de 200 serviços de frontend, backend, banco de
     dados, IA, deploy, e-mail, cache e muito mais, com links, preços e
     alternativas."
   - Botões: "Explorar o catálogo" e "Ver roadmaps".
2. **Categorias:** a grade de categorias foi removida depois da primeira
   versão (pedido do dono em 2026-10-01). Os chips do catálogo mostram o total
   de stacks de cada categoria.
3. **Catálogo** (`#catalogo`):
   - Título e a contagem "N de 201 stacks" (`aria-live`).
   - Busca sem acento em nome, empresa, descrição, tags, recursos e nome da
     categoria.
   - Pílulas de categoria ("Todas" + 22), cada uma com o total de stacks
     ("Frontend 16"; leitor de tela: "Frontend (16 stacks)").
   - Toggles: "Plano gratuito", "Open source" e "Self-hosted".
   - Ordenação (`<select>`): Popularidade (padrão), Nome (A–Z), Estrelas no
     GitHub (sem estrelas vão para o fim).
   - Toggle "Só favoritos (n)".
   - URL: `?categoria=database&q=postgres&gratuito=1&aberto=1&self=1&ordem=nome`.
     Valores inválidos são ignorados.
   - Paginação de 30 em 30 com "Mostrar mais (N restantes)".
   - Vazio: "Nenhuma stack encontrada." com "Limpar filtros".
4. **Card de stack** (`comum.js`, reutilizado em todas as páginas):
   - Cabeça: logo de 2.75rem (logo.dev pelo domínio de `site`; se falhar, a
     inicial em branco sobre `cor`), nome, nome da categoria e coração.
   - Descrição com 2 linhas no máximo.
   - Selos: "Gratuito", "Open source" e até 2 tags.
   - Pé: `↗ popularidade`, `★ estrelas` (se houver) e o link "Ver detalhes →"
     para `stack.html?id=`.
5. **Sugerir:** a caixa da família ("Conhece uma stack que merece estar aqui?",
   3 passos, "Sugerir pelo formulário" e o link para o CONTRIBUTING).

### `stack.html?id=`

- "← Catálogo".
- **Cabeçalho:** logo grande, nome (`h1`), "Categoria · Empresa", coração,
  descrição e os botões Site, GitHub (de `repositorio`), Docs e Discord.
- **Números:** Plano gratuito, Código aberto, Self-hosted, Preço inicial,
  Popularidade e Estrelas no GitHub (este só se houver).
- "Por que recomendamos", se houver `porque`.
- Tags, Recursos (lista com ✓) e Casos de uso.
- **Aparece nos roadmaps:** links para os roadmaps com uma etapa ligada a esta
  stack; a seção some se não houver nenhum.
- **Comparar com…:** link para `comparacoes.html?a={id}`.
- **Alternativas:** as 3 stacks mais populares da mesma categoria, em cards.
- O título da aba vira "{nome} — DevStacksHub". Com id ausente ou inexistente:
  "Stack não encontrada." e o link para o catálogo.

### `roadmaps.html`

Título "Roadmaps de arquitetura" e o texto atual. Grade com os roadmaps: ícone,
"N etapas", título, descrição e "Ver roadmap →".

### `roadmap.html?id=`

- "← Roadmaps", o selo "N etapas", o título e a descrição.
- **Linha do tempo:** etapas numeradas, com o ícone escolhido pela categoria da
  etapa (mesma regra do Base44: front → monitor, back/api → server, dados →
  database etc.). A ferramenta é link para `stack.html?id=` quando a etapa tem
  `stack`.
- **Enviar para IA:**
  - O prompt (mesmo texto de `roadmapPrompt.js`) dentro de um `<details>`
    "Ver prompt".
  - O botão "Copiar prompt".
  - Os botões Claude, ChatGPT, Gemini, Copilot e Cursor: cada um copia o
    prompt e abre a ferramenta em nova aba.
- Id inválido: "Roadmap não encontrado.".

### `comparacoes.html`

- **Monte sua comparação:** três `<select>` (Categoria → Stack A → Stack B; a
  mesma stack não pode ser escolhida dos dois lados).
  - A tabela mostra Empresa, Preço inicial, Plano gratuito, Código aberto,
    Self-hosted, Linguagem, Popularidade, Estrelas e a união dos recursos das
    duas (✓ / —).
  - Os links "Ver {A}" e "Ver {B}".
  - URL: `?a=next-js&b=remix`. Com só `?a=`, a categoria e a Stack A já vêm
    escolhidas.
- **Comparações prontas:** as 6, cada uma num `<details>`, com logos, "vs" e o
  selo do vencedor. A célula vencedora tem fundo `--accent-soft`.

### `glossario.html`

- Título "Glossário de termos", busca sem acento e pílulas ("Todos" + 6).
- Os termos aparecem agrupados por categoria, em cards com `id="termo-{slug}"`.
- Os relacionados que existem no glossário viram links `#termo-{slug}`.
- Vazio: "Nenhum termo encontrado.".

### Comum

- **Favoritos:** `localStorage['devstackshub:favoritos']` com ids, protegido
  por `try/catch`. O coração aparece em todos os cards e no detalhe.
- Todo texto entra com `textContent`, e só links `https` viram `href`.
- **CSP na `<meta>`** de cada página: `default-src 'self'; script-src 'self';
  style-src 'self' https://fonts.googleapis.com; font-src
  https://fonts.gstatic.com; img-src 'self' https://img.logo.dev data:;
  connect-src 'self'; base-uri 'self'; form-action 'self'`.
- Sem animações de entrada e sem skeletons.
- `canonical` e `og:url` de cada página apontam para
  `https://hugobastoss.github.io/devstackshub/…`.

### Formulário de issue (`sugerir-stack.yml`)

- Campos:
  - nome;
  - site (https);
  - categoria (dropdown com as 22);
  - empresa;
  - o que faz;
  - repositório no GitHub;
  - plano gratuito / open source / self-hosted (checkboxes);
  - preço inicial;
  - por que você recomenda (obrigatório).
- Confirmação: "Usei ou testei esta stack."
- Label: `sugestão`.

## 3. Migração e publicação

### Migração (script avulso no scratchpad)

- **Stacks e roadmaps:** lidos da API pública do app
  (`https://base44.app/api/apps/6a5b47401b6201e54cfc409e/entities/{Stack|Roadmap}`).
- **Conversões:**
  - `id` pelo nome (sem acentos, kebab-case);
  - `github` → `repositorio` (`dono/repo`, só quando a URL é de um repositório;
    URL de organização é descartada e registrada no log);
  - `website` → `site`, `logo_color` → `cor`, `features` → `recursos`,
    `use_cases` → `casos_de_uso`, `is_self_hosted` → `self_hosted`;
  - `created_date` → `adicionado`.
- **Saem:** `null`s, strings vazias e campos internos do Base44.
- **Glossário e comparações:** convertidos a partir do código já lido
  (`glossaryTerms.js` e `Comparisons.jsx`). As comparações referenciam as
  stacks pelo novo `id`.
- **Problemas** (ids repetidos, links `http`, `site` repetido, etapa sem stack
  correspondente): o script lista. O que der para corrigir de forma inequívoca
  é corrigido e anotado no commit; o resto fica sem a referência opcional.

### Publicação

1. Implementar e testar localmente.
2. **Sem nova confirmação** (autorizado):
   - `gh repo create hugobastoss/devstackshub --public`;
   - push da `main`;
   - ativar o Pages (`main`, `/`);
   - criar o label `sugestão`;
   - preencher a descrição e o site do repositório;
   - disparar a Action de estrelas.
3. Rodar o teste do navegador contra o site publicado.

O `devstackshub.base44.app` continua no ar; despublicar fica com o dono. Depois
da migração, o repositório é a fonte dos dados: editar no Base44 não muda o
site novo.

## Verificação

- `node scripts/validar-dados.mjs` passa nos dados migrados.
- O validador reprova uma cópia com:
  - id repetido;
  - categoria inexistente;
  - `stack` de etapa inexistente;
  - `stack_a` igual a `stack_b`;
  - popularidade fora de 0–100;
  - link `http`;
  - `site` repetido;
  - campo desconhecido.
- **No Edge headless** (puppeteer), com o site servido localmente:
  - **Catálogo:**
    - contagem;
    - clique numa categoria (filtra e rola);
    - pílulas e toggles;
    - ordenação por nome e por estrelas;
    - URL restaurada ao recarregar;
    - "Mostrar mais";
    - favoritos persistentes e "Só favoritos".
  - **Detalhe:** id válido (números, alternativas da mesma categoria, roadmaps,
    "Comparar com…") e id inválido.
  - **Roadmap:** etapas com link para a stack, "Copiar prompt" (área de
    transferência) e id inválido.
  - **Comparações:**
    - montar pela URL `?a=&b=` e pelos selects;
    - `?a=` sozinho;
    - abrir uma comparação pronta.
  - **Glossário:** busca, filtro por categoria e link de relacionado.
  - **Todas as páginas:** desktop (1366px) e celular (390px), temas claro e
    escuro, sem rolagem horizontal e sem erro no console (inclusive CSP).
- **No site publicado:** o mesmo teste, o workflow de validação verde e a
  Action de estrelas gerando `data/estrelas.json`.

## Fora do escopo

- Gerador de arquitetura.
- Na página inicial: a seção "Stacks populares" (o catálogo já abre ordenado
  por popularidade), a busca dentro do hero e a chamada "Gerar minha stack".
- Despublicar o app no Base44 ou redirecionar `devstackshub.base44.app`.
- Domínio próprio.
- Escrever `porque` para as stacks migradas.

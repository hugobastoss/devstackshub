# DevStacksHub

Curadoria aberta de mais de 200 serviços para desenvolvedores, de frontend e
backend a banco de dados, IA, deploy, e-mail e cache, com links, preços,
alternativas, roadmaps de arquitetura, comparações e um glossário.

🌐 https://hugobastoss.github.io/devstackshub/

## Sugerir uma stack

Use o [formulário de sugestão](https://github.com/hugobastoss/devstackshub/issues/new?template=sugerir-stack.yml)
ou veja o [guia de contribuição](CONTRIBUTING.md) para abrir um pull request.

## Estrutura

```
index.html              # categorias e catálogo
stack.html              # detalhe de uma stack (?id=)
roadmaps.html           # lista de roadmaps
roadmap.html            # detalhe de um roadmap (?id=)
comparacoes.html        # comparação lado a lado
glossario.html          # glossário de termos
favicon.svg
assets/
  styles.css
  icones.svg            # ícones Lucide (ISC) e a marca do GitHub
  comum.js              # leitura dos dados, card de stack, logos, favoritos e estrelas
  catalogo.js, stack.js, roadmaps.js, roadmap.js, comparacoes.js, glossario.js
data/
  stacks.json           # categorias e todas as stacks
  roadmaps.json
  comparacoes.json
  glossario.json
  estrelas.json         # estrelas de cada repositório no GitHub (gerado automaticamente)
scripts/
  validar-dados.mjs     # valida os arquivos de data/ e as referências entre eles
  atualizar-estrelas.mjs  # busca as estrelas na API do GitHub
  versionar-assets.mjs  # carimba ?v=<hash> nas referências de CSS e JS das páginas
.github/
  ISSUE_TEMPLATE/       # formulário de sugestão
  workflows/            # validação em pull requests e atualização diária das estrelas
```

HTML, CSS e JavaScript estáticos, sem build. Publicado pelo GitHub Pages a
partir da branch `main`.

## Rodar localmente

Os dados são carregados com `fetch`, então abra a pasta por um servidor:

```bash
python -m http.server 8000
```

Depois acesse http://localhost:8000.

## Depois de mudar algo em assets/

O GitHub Pages guarda cada arquivo em cache por 10 minutos. Para uma página
nova nunca usar um script antigo do cache, as referências levam `?v=<hash>`:

```bash
node scripts/versionar-assets.mjs
```

O CI confere isso em cada pull request.

## Validar os dados

```bash
node scripts/validar-dados.mjs
```

---

Um projeto da [HVCB App&Games](https://hugobastoss.github.io/hvcb-appgames/).

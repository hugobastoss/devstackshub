# Como contribuir

O DevStacksHub é uma curadoria. Cada stack sugerida precisa ter sido usada ou
testada por quem sugere, e a sugestão deve explicar por que ela vale a pena.

## Duas formas de sugerir

### 1. Pelo formulário (mais simples)

Abra uma [sugestão](https://github.com/hugobastoss/devstackshub/issues/new?template=sugerir-stack.yml).
Se ela for aprovada, a curadoria adiciona a stack ao catálogo.

### 2. Por pull request

1. Faça um fork do repositório.
2. Adicione a stack à lista `itens` em `data/stacks.json`.
3. Rode `node scripts/validar-dados.mjs` para conferir o formato.
4. Abra o pull request. A mesma validação roda automaticamente nele.

Não edite `data/estrelas.json`: ele é atualizado automaticamente todos os dias.

## Campos de cada stack

| Campo | Obrigatório | Descrição |
|---|---|---|
| `id` | sim | Identificador único em kebab-case, ex.: `next-js` |
| `nome` | sim | Nome exibido |
| `categoria` | sim | Uma das chaves de `categorias`, ex.: `frontend`, `database`, `payments` |
| `empresa` | não | Quem mantém a stack |
| `descricao` | sim | O que faz, em até 220 caracteres |
| `site` | sim | URL `https` do site oficial. Não pode repetir o site de outra stack |
| `repositorio` | não | `dono/repo` no GitHub, usado para as estrelas |
| `docs`, `discord` | não | URLs `https` |
| `codigo_aberto`, `plano_gratuito`, `self_hosted` | sim | `true` ou `false` |
| `preco_inicial` | não | Ex.: `$0`, `$20/mês` |
| `linguagem` | não | Ex.: TypeScript, Go |
| `popularidade` | sim | Nota da curadoria, de 0 a 100 |
| `tags`, `recursos`, `casos_de_uso` | não | Listas de textos curtos |
| `cor` | não | Cor da marca em `#RRGGBB`, usada quando o logo não carrega |
| `porque` | não | Por que você recomenda, em até 320 caracteres |
| `adicionado` | sim | Data no formato AAAA-MM-DD |

Exemplo:

```json
{
  "id": "minha-stack",
  "nome": "Minha Stack",
  "categoria": "database",
  "empresa": "Minha Empresa",
  "descricao": "O que a stack faz, em uma ou duas frases.",
  "site": "https://minhastack.dev",
  "repositorio": "dono/minha-stack",
  "codigo_aberto": true,
  "plano_gratuito": true,
  "self_hosted": true,
  "preco_inicial": "$0",
  "popularidade": 70,
  "tags": ["PostgreSQL", "Serverless"],
  "recursos": ["Branching", "Backups"],
  "casos_de_uso": ["SaaS", "API"],
  "porque": "Em que projeto você usa e o que ganhou com isso.",
  "adicionado": "2026-10-01"
}
```

Roadmaps (`data/roadmaps.json`), comparações (`data/comparacoes.json`) e o
glossário (`data/glossario.json`) também aceitam pull requests. Nas etapas dos
roadmaps e nas comparações, use o `id` da stack. O validador confere se ela existe.

## O que a curadoria avalia

- **Uso real:** o campo `porque` conta uma experiência concreta, e não só repete a descrição.
- **Link oficial:** o site é o da própria stack.
- **Dados corretos:** plano gratuito, código aberto e preço conferem com o site.
- **Ativa:** a stack está no ar e é mantida.
- **Sem duplicatas:** a stack ainda não está no catálogo.

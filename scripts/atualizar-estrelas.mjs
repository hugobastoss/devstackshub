// Fetches the GitHub star count of every repository in data/stacks.json and
// saves it to data/estrelas.json. Runs daily in CI. The file is only rewritten
// when a count changes, so the "atualizadas em" date on the site stays honest.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const stacksUrl = new URL('../data/stacks.json', import.meta.url);
const estrelasUrl = new URL('../data/estrelas.json', import.meta.url);

const { itens } = JSON.parse(readFileSync(stacksUrl, 'utf8'));
const repos = [...new Set(itens.map((i) => i.repositorio?.toLowerCase()).filter(Boolean))].sort();

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'devstackshub' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const anterior = existsSync(estrelasUrl) ? JSON.parse(readFileSync(estrelasUrl, 'utf8')) : { repositorios: {} };
const repositorios = {};
let falhas = 0;

for (const repo of repos) {
  const resposta = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!resposta.ok) {
    console.warn(`${repo}: HTTP ${resposta.status}, mantendo o valor anterior`);
    if (typeof anterior.repositorios?.[repo] === 'number') repositorios[repo] = anterior.repositorios[repo];
    falhas++;
    continue;
  }
  repositorios[repo] = (await resposta.json()).stargazers_count;
}

if (JSON.stringify(repositorios) === JSON.stringify(anterior.repositorios)) {
  console.log('Nenhuma contagem de estrelas mudou.');
} else {
  writeFileSync(estrelasUrl, `${JSON.stringify({ atualizado: new Date().toISOString(), repositorios }, null, 2)}\n`);
  console.log(`Estrelas salvas para ${Object.keys(repositorios).length} repositórios.`);
}

if (repos.length > 0 && falhas === repos.length) process.exit(1);

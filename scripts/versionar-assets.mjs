// Stamps every CSS/JS reference in the HTML pages with ?v=<content hash>.
// GitHub Pages caches each file for 10 minutes and allows no custom headers,
// so without this a deploy that changes a page and its script together can
// pair the new page with the old script still in the visitor's cache.
//
// Run after changing anything in assets/:  node scripts/versionar-assets.mjs
// CI runs it with --verificar and fails when a page points to an old version.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const raiz = new URL('../', import.meta.url);
const verificar = process.argv.includes('--verificar');
const REFERENCIA = /(href|src)="(assets\/[\w.-]+\.(?:css|js))(?:\?v=\w+)?"/g;

// Line endings are normalised so Windows checkouts and CI agree on the hash.
const versao = (arquivo) => createHash('sha256')
  .update(readFileSync(new URL(arquivo, raiz), 'utf8').replace(/\r\n/g, '\n'))
  .digest('hex').slice(0, 10);

const desatualizadas = [];
for (const pagina of readdirSync(raiz).filter((f) => f.endsWith('.html')).sort()) {
  const url = new URL(pagina, raiz);
  const atual = readFileSync(url, 'utf8');
  const versionada = atual.replace(REFERENCIA, (_, atributo, arquivo) => `${atributo}="${arquivo}?v=${versao(arquivo)}"`);
  if (versionada === atual) continue;
  desatualizadas.push(pagina);
  if (!verificar) writeFileSync(url, versionada);
}

if (verificar && desatualizadas.length) {
  console.error(`Versões de assets desatualizadas em: ${desatualizadas.join(', ')}.\nRode: node scripts/versionar-assets.mjs`);
  process.exit(1);
}
console.log(desatualizadas.length ? `Versões atualizadas em: ${desatualizadas.join(', ')}.` : 'OK: todas as páginas apontam para a versão atual dos assets.');

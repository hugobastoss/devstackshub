// Validates data/*.json and the references between the files. Runs in CI on
// every pull request that touches the data, and locally with:
// node scripts/validar-dados.mjs [pasta]
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../data/', import.meta.url));
const erros = [];

function ler(arquivo) {
  try {
    return JSON.parse(readFileSync(join(pasta, arquivo), 'utf8'));
  } catch (e) {
    erros.push(`${arquivo} não é um JSON válido: ${e.message}`);
    return null;
  }
}

const texto = (v) => typeof v === 'string' && v.trim().length > 0;
const listaDeTextos = (v) => Array.isArray(v) && v.length > 0 && v.every(texto);
const objeto = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const https = (v) => typeof v === 'string' && /^https:\/\/\S+$/.test(v);
const kebab = (v) => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v);
// Two links count as the same page regardless of protocol, "www." or a trailing slash.
const normalizarLink = (url) => url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

function camposDesconhecidos(obj, permitidos, erro) {
  Object.keys(obj).filter((k) => !permitidos.has(k)).forEach((k) => erro(`campo desconhecido "${k}"`));
}

function idsUnicos(lista, onde, campo = 'id') {
  const vistos = new Set();
  lista.forEach((item, i) => {
    const valor = item?.[campo];
    if (!kebab(valor)) erros.push(`${onde}[${i}]: "${campo}" deve estar em kebab-case`);
    else if (vistos.has(valor)) erros.push(`${onde}[${i}] (${valor}): "${campo}" repetido`);
    else vistos.add(valor);
  });
  return vistos;
}

// stacks.json
const CAMPOS_STACK = new Set(['id', 'nome', 'categoria', 'empresa', 'descricao', 'site', 'repositorio', 'docs', 'discord',
  'codigo_aberto', 'plano_gratuito', 'self_hosted', 'preco_inicial', 'linguagem', 'popularidade', 'tags', 'recursos',
  'casos_de_uso', 'cor', 'porque', 'adicionado']);
const stacks = ler('stacks.json');
let idsStacks = new Set();
if (stacks) {
  const categorias = stacks.categorias;
  if (!objeto(categorias) || !Object.keys(categorias).length) erros.push('stacks.json: "categorias" precisa ser um objeto com categorias');
  else {
    for (const [chave, cat] of Object.entries(categorias)) {
      if (!kebab(chave)) erros.push(`stacks.json: categoria "${chave}" deve estar em kebab-case`);
      for (const campo of ['nome', 'descricao', 'icone']) {
        if (!texto(cat?.[campo])) erros.push(`stacks.json: categorias.${chave}.${campo} é obrigatório`);
      }
    }
  }
  if (!Array.isArray(stacks.itens)) erros.push('stacks.json precisa ter a lista "itens"');
  else {
    idsStacks = idsUnicos(stacks.itens, 'stacks.json: itens');
    const sites = new Map();
    stacks.itens.forEach((s, i) => {
      const onde = `stacks.json: itens[${i}]${texto(s.id) ? ` (${s.id})` : ''}`;
      const erro = (msg) => erros.push(`${onde}: ${msg}`);
      for (const campo of ['nome', 'descricao']) if (!texto(s[campo])) erro(`"${campo}" é obrigatório`);
      if (!objeto(categorias) || !Object.hasOwn(categorias, s.categoria ?? '')) erro('"categoria" não existe em "categorias"');
      if (!https(s.site)) erro('"site" deve ser uma URL https');
      else {
        const chave = normalizarLink(s.site);
        if (sites.has(chave)) erro(`"site" repetido (já usado por ${sites.get(chave)})`);
        else sites.set(chave, s.id);
      }
      for (const campo of ['docs', 'discord']) if (s[campo] != null && !https(s[campo])) erro(`"${campo}" deve ser uma URL https`);
      if (s.repositorio != null && !/^[\w.-]+\/[\w.-]+$/.test(s.repositorio)) erro('"repositorio" deve ter o formato dono/repo');
      for (const campo of ['codigo_aberto', 'plano_gratuito', 'self_hosted']) {
        if (typeof s[campo] !== 'boolean') erro(`"${campo}" deve ser true ou false`);
      }
      if (!Number.isInteger(s.popularidade) || s.popularidade < 0 || s.popularidade > 100) erro('"popularidade" deve ser um inteiro de 0 a 100');
      for (const campo of ['empresa', 'preco_inicial', 'linguagem', 'porque']) {
        if (s[campo] != null && !texto(s[campo])) erro(`"${campo}" deve ser um texto`);
      }
      for (const campo of ['tags', 'recursos', 'casos_de_uso']) {
        if (s[campo] != null && !listaDeTextos(s[campo])) erro(`"${campo}" deve ser uma lista de textos`);
      }
      if (s.cor != null && !/^#[0-9A-Fa-f]{6}$/.test(s.cor)) erro('"cor" deve ser um hex #RRGGBB');
      if (texto(s.descricao) && s.descricao.length > 220) erro('"descricao" deve ter no máximo 220 caracteres');
      if (texto(s.porque) && s.porque.length > 320) erro('"porque" deve ter no máximo 320 caracteres');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s.adicionado ?? '')) erro('"adicionado" deve ser uma data AAAA-MM-DD');
      camposDesconhecidos(s, CAMPOS_STACK, erro);
    });
  }
}

const stackExiste = (id) => idsStacks.has(id);

// roadmaps.json
const CAMPOS_ROADMAP = new Set(['id', 'titulo', 'descricao', 'icone', 'categoria', 'etapas']);
const CAMPOS_ETAPA = new Set(['categoria', 'ferramenta', 'descricao', 'stack']);
const roadmaps = ler('roadmaps.json');
if (roadmaps) {
  if (!Array.isArray(roadmaps.roadmaps)) erros.push('roadmaps.json precisa ter a lista "roadmaps"');
  else {
    idsUnicos(roadmaps.roadmaps, 'roadmaps.json: roadmaps');
    roadmaps.roadmaps.forEach((r, i) => {
      const onde = `roadmaps.json: roadmaps[${i}]${texto(r.id) ? ` (${r.id})` : ''}`;
      const erro = (msg) => erros.push(`${onde}: ${msg}`);
      for (const campo of ['titulo', 'descricao', 'icone']) if (!texto(r[campo])) erro(`"${campo}" é obrigatório`);
      if (r.categoria != null && !texto(r.categoria)) erro('"categoria" deve ser um texto');
      if (!Array.isArray(r.etapas) || !r.etapas.length) erro('"etapas" precisa ter pelo menos uma etapa');
      else r.etapas.forEach((e, j) => {
        const erroEtapa = (msg) => erro(`etapas[${j}]: ${msg}`);
        for (const campo of ['categoria', 'ferramenta']) if (!texto(e[campo])) erroEtapa(`"${campo}" é obrigatório`);
        if (e.descricao != null && !texto(e.descricao)) erroEtapa('"descricao" deve ser um texto');
        if (e.stack != null && !stackExiste(e.stack)) erroEtapa(`"stack" "${e.stack}" não existe em stacks.json`);
        camposDesconhecidos(e, CAMPOS_ETAPA, erroEtapa);
      });
      camposDesconhecidos(r, CAMPOS_ROADMAP, erro);
    });
  }
}

// comparacoes.json
const CAMPOS_COMPARACAO = new Set(['id', 'stack_a', 'stack_b', 'vencedor', 'linhas']);
const CAMPOS_LINHA = new Set(['rotulo', 'a', 'b', 'vence']);
const lado = (v) => v === 'a' || v === 'b';
const valorCelula = (v) => typeof v === 'boolean' || texto(v);
const comparacoes = ler('comparacoes.json');
if (comparacoes) {
  if (!Array.isArray(comparacoes.comparacoes)) erros.push('comparacoes.json precisa ter a lista "comparacoes"');
  else {
    idsUnicos(comparacoes.comparacoes, 'comparacoes.json: comparacoes');
    comparacoes.comparacoes.forEach((c, i) => {
      const onde = `comparacoes.json: comparacoes[${i}]${texto(c.id) ? ` (${c.id})` : ''}`;
      const erro = (msg) => erros.push(`${onde}: ${msg}`);
      for (const campo of ['stack_a', 'stack_b']) if (!stackExiste(c[campo])) erro(`"${campo}" "${c[campo]}" não existe em stacks.json`);
      if (c.stack_a === c.stack_b) erro('"stack_a" e "stack_b" devem ser stacks diferentes');
      if (c.vencedor != null && !lado(c.vencedor)) erro('"vencedor" deve ser "a" ou "b"');
      if (!Array.isArray(c.linhas) || !c.linhas.length) erro('"linhas" precisa ter pelo menos uma linha');
      else c.linhas.forEach((l, j) => {
        const erroLinha = (msg) => erro(`linhas[${j}]: ${msg}`);
        if (!texto(l.rotulo)) erroLinha('"rotulo" é obrigatório');
        if (!valorCelula(l.a) || !valorCelula(l.b)) erroLinha('"a" e "b" devem ser true, false ou texto');
        if (l.vence != null && !lado(l.vence)) erroLinha('"vence" deve ser "a" ou "b"');
        camposDesconhecidos(l, CAMPOS_LINHA, erroLinha);
      });
      camposDesconhecidos(c, CAMPOS_COMPARACAO, erro);
    });
  }
}

// glossario.json
const CAMPOS_TERMO = new Set(['termo', 'expansao', 'categoria', 'descricao', 'relacionados']);
const glossario = ler('glossario.json');
if (glossario) {
  const cats = glossario.categorias;
  if (!objeto(cats) || !Object.values(cats).every(texto)) erros.push('glossario.json: "categorias" precisa ser um objeto de nomes');
  if (!Array.isArray(glossario.termos)) erros.push('glossario.json precisa ter a lista "termos"');
  else {
    const vistos = new Set();
    glossario.termos.forEach((t, i) => {
      const onde = `glossario.json: termos[${i}]${texto(t.termo) ? ` (${t.termo})` : ''}`;
      const erro = (msg) => erros.push(`${onde}: ${msg}`);
      for (const campo of ['termo', 'expansao', 'descricao']) if (!texto(t[campo])) erro(`"${campo}" é obrigatório`);
      if (texto(t.termo)) {
        const chave = t.termo.toLowerCase();
        if (vistos.has(chave)) erro('"termo" repetido');
        vistos.add(chave);
      }
      if (!objeto(cats) || !Object.hasOwn(cats, t.categoria ?? '')) erro('"categoria" não existe em "categorias"');
      if (t.relacionados != null && !listaDeTextos(t.relacionados)) erro('"relacionados" deve ser uma lista de textos');
      camposDesconhecidos(t, CAMPOS_TERMO, erro);
    });
  }
}

if (erros.length) {
  console.error(`Encontrei ${erros.length} problema(s):\n- ${erros.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK: ${stacks.itens.length} stacks, ${roadmaps.roadmaps.length} roadmaps, ${comparacoes.comparacoes.length} comparações e ${glossario.termos.length} termos válidos.`);

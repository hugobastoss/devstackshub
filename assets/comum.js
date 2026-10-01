// Shared helpers for every page: data loading, the stack card, logos,
// favourites and the GitHub star badge. Data arrives through community pull
// requests, so text is always set with textContent and only https links are
// turned into anchors.
window.DSH = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const LOGO_TOKEN = 'pk_RIGUiLQtT2mCBpw6khTtMQ';
  const CHAVE_FAVORITOS = 'devstackshub:favoritos';
  const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
  const completo = new Intl.NumberFormat('pt-BR');

  const $ = (id) => document.getElementById(id);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function icone(nome, className = '') {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', `icone ${className}`.trim());
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', `assets/icones.svg#${nome}`);
    svg.append(use);
    return svg;
  }

  const linkSeguro = (url) => (typeof url === 'string' && /^https:\/\//.test(url) ? url : null);
  const normalizar = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const slug = (s) => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const parametro = (nome) => new URLSearchParams(location.search).get(nome) ?? '';

  async function lerJson(caminho) {
    const resposta = await fetch(caminho, { cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return resposta.json();
  }

  // Stars are optional: without data/estrelas.json the cards simply show no badge.
  async function carregarStacks() {
    const [dados, estrelas] = await Promise.allSettled([lerJson('data/stacks.json'), lerJson('data/estrelas.json')]);
    if (dados.status !== 'fulfilled') throw dados.reason;
    const categorias = dados.value.categorias ?? {};
    const itens = (dados.value.itens ?? []).filter((s) => Object.hasOwn(categorias, s.categoria ?? ''));
    const contagens = estrelas.status === 'fulfilled' ? estrelas.value.repositorios ?? {} : {};
    const atualizado = estrelas.status === 'fulfilled' ? new Date(estrelas.value.atualizado) : null;
    return {
      categorias,
      itens,
      porId: new Map(itens.map((s) => [s.id, s])),
      estrelasDe: (s) => (s.repositorio && typeof contagens[s.repositorio.toLowerCase()] === 'number' ? contagens[s.repositorio.toLowerCase()] : null),
      estrelasAtualizadas: atualizado && !Number.isNaN(atualizado.getTime()) ? atualizado : null,
    };
  }

  function erroDeCarga(destino) {
    destino.replaceChildren(el('p', 'vazio', 'Não foi possível carregar os dados. Tente recarregar a página.'));
  }

  // Favourites live only in this browser. Storage can be missing or blocked
  // (private windows), so they then last for the visit only.
  let favoritos;
  try {
    const salvos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || '[]');
    favoritos = new Set(Array.isArray(salvos) ? salvos.filter((id) => typeof id === 'string') : []);
  } catch {
    favoritos = new Set();
  }

  function alternarFavorito(id) {
    if (favoritos.has(id)) favoritos.delete(id);
    else favoritos.add(id);
    try {
      localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify([...favoritos]));
    } catch {
      // Sem storage: os favoritos valem só nesta visita.
    }
    document.querySelectorAll('.favorito').forEach((b) => {
      if (b.dataset.favorito === id) b.setAttribute('aria-pressed', String(favoritos.has(id)));
    });
    document.dispatchEvent(new CustomEvent('favoritos'));
  }

  // One listener serves every heart on the page, including ones added later.
  document.addEventListener('click', (e) => {
    const botao = e.target.closest?.('.favorito');
    if (botao) alternarFavorito(botao.dataset.favorito);
  });

  function botaoFavorito(stack, className = '') {
    const botao = el('button', `favorito ${className}`.trim());
    botao.type = 'button';
    botao.dataset.favorito = stack.id;
    botao.setAttribute('aria-label', `Favoritar ${stack.nome}`);
    botao.setAttribute('aria-pressed', String(favoritos.has(stack.id)));
    botao.append(icone('heart'));
    return botao;
  }

  // Readable text on top of the stack's own colour, for the initial fallback.
  function corDoTexto(hex) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#14161A' : '#FFFFFF';
  }

  function inicial(stack, caixa) {
    caixa.replaceChildren(stack.nome.trim()[0]?.toUpperCase() ?? '?');
    caixa.classList.add('logo--inicial');
    const cor = /^#[0-9A-Fa-f]{6}$/.test(stack.cor ?? '') ? stack.cor : '#6366F1';
    caixa.style.background = cor;
    caixa.style.color = corDoTexto(cor);
  }

  // Logos come from logo.dev by the domain of the stack's site.
  function logo(stack, tamanho = '') {
    const caixa = el('div', `logo ${tamanho ? `logo--${tamanho}` : ''}`.trim());
    caixa.setAttribute('aria-hidden', 'true');
    const site = linkSeguro(stack.site);
    if (!site) {
      inicial(stack, caixa);
      return caixa;
    }
    const img = document.createElement('img');
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => inicial(stack, caixa), { once: true });
    img.src = `https://img.logo.dev/${new URL(site).hostname.replace(/^www\./, '')}?token=${LOGO_TOKEN}&size=128&format=png`;
    caixa.append(img);
    return caixa;
  }

  function metricaPopularidade(stack) {
    const m = el('span', 'metrica');
    m.title = 'Popularidade de 0 a 100';
    m.setAttribute('aria-label', `Popularidade ${stack.popularidade} de 100`);
    m.append(icone('trending-up'), String(stack.popularidade));
    return m;
  }

  function seloEstrelas(stack, total) {
    if (typeof total !== 'number') return null;
    const selo = el('a', 'metrica metrica--estrela');
    selo.href = `https://github.com/${stack.repositorio}/stargazers`;
    selo.rel = 'noopener';
    selo.title = `${completo.format(total)} estrelas no GitHub (${stack.repositorio})`;
    selo.setAttribute('aria-label', selo.title);
    selo.append(icone('star'), compacto.format(total));
    return selo;
  }

  const urlStack = (id) => `stack.html?id=${encodeURIComponent(id)}`;

  function card(stack, dados) {
    const art = el('article', 'item');

    const cabeca = el('div', 'item-cabeca');
    const titulo = el('div', 'item-titulo');
    const nome = el('h3', 'item-nome');
    const link = el('a', null, stack.nome);
    link.href = urlStack(stack.id);
    nome.append(link);
    titulo.append(nome, el('p', 'item-cat', dados.categorias[stack.categoria].nome));
    cabeca.append(logo(stack), titulo, botaoFavorito(stack));
    art.append(cabeca, el('p', 'item-desc', stack.descricao));

    const selos = el('div', 'selos');
    if (stack.plano_gratuito) selos.append(el('span', 'selo selo--gratuito', 'Gratuito'));
    if (stack.codigo_aberto) selos.append(el('span', 'selo selo--aberto', 'Open source'));
    (stack.tags ?? []).slice(0, 2).forEach((t) => selos.append(el('span', 'selo', t)));
    if (selos.childElementCount) art.append(selos);

    const pe = el('div', 'item-pe');
    const metricas = el('div', 'metricas');
    metricas.append(metricaPopularidade(stack));
    const estrelas = seloEstrelas(stack, dados.estrelasDe(stack));
    if (estrelas) metricas.append(estrelas);
    const ver = el('a', 'ver-mais', 'Ver detalhes');
    ver.href = urlStack(stack.id);
    ver.setAttribute('aria-label', `Ver detalhes de ${stack.nome}`);
    ver.append(icone('arrow-right'));
    pe.append(metricas, ver);
    art.append(pe);
    return art;
  }

  return {
    $, el, icone, linkSeguro, normalizar, slug, parametro, lerJson, carregarStacks, erroDeCarga,
    favoritos: () => favoritos, botaoFavorito, logo, metricaPopularidade, seloEstrelas, card, urlStack,
    compacto, completo,
  };
})();

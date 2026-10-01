// Comparisons page: build a side-by-side table of two stacks from the same
// category (state in ?a=&b=) and browse the ready-made comparisons.
(() => {
  const { $, el, icone, lerJson, carregarStacks, erroDeCarga, logo, urlStack, completo } = window.DSH;
  let dados;

  const porPopularidade = (a, b) => b.popularidade - a.popularidade || a.nome.localeCompare(b.nome, 'pt-BR');

  function celula(valor) {
    if (typeof valor === 'boolean') {
      const span = el('span', valor ? 'sim' : 'nao');
      span.append(icone(valor ? 'check' : 'minus'), el('span', 'sr-only', valor ? 'Sim' : 'Não'));
      return span;
    }
    return document.createTextNode(String(valor));
  }

  function versus(a, b) {
    const linha = el('div', 'versus');
    const lado = (s) => {
      const d = el('span', 'versus-lado');
      d.append(logo(s, 'mini'), s.nome);
      return d;
    };
    linha.append(lado(a), el('span', 'versus-vs', 'vs'), lado(b));
    return linha;
  }

  // linhas: [{ rotulo, a, b, vence? }]; vencedor: 'a' | 'b' | undefined
  function tabela(a, b, linhas, vencedor) {
    const rolagem = el('div', 'tabela-rolagem');
    const t = el('table', 'tabela');
    const thead = el('thead');
    const cab = el('tr');
    cab.append(el('th', null, 'Recurso'));
    for (const [lado, s] of [['a', a], ['b', b]]) {
      const th = el('th');
      th.scope = 'col';
      if (vencedor === lado) th.append(icone('trophy'), ' ');
      th.append(s.nome);
      cab.append(th);
    }
    thead.append(cab);
    const tbody = el('tbody');
    linhas.forEach((l) => {
      const tr = el('tr');
      const rotulo = el('th', null, l.rotulo);
      rotulo.scope = 'row';
      tr.append(rotulo);
      for (const lado of ['a', 'b']) {
        const td = el('td', l.vence === lado ? 'vence' : null);
        td.append(celula(l[lado]));
        tr.append(td);
      }
      tbody.append(tr);
    });
    t.append(thead, tbody);
    rolagem.append(t);
    return rolagem;
  }

  function linksVer(a, b) {
    const div = el('div', 'comparacao-links');
    for (const s of [a, b]) {
      const link = el('a', 'botao botao--contorno botao--pequeno', `Ver ${s.nome}`);
      link.href = urlStack(s.id);
      link.append(icone('arrow-right'));
      div.append(link);
    }
    return div;
  }

  function linhasDinamicas(a, b) {
    const texto = (v) => v ?? '—';
    const estrelas = (s) => {
      const n = dados.estrelasDe(s);
      return typeof n === 'number' ? completo.format(n) : '—';
    };
    const recursos = [...new Set([...(a.recursos ?? []), ...(b.recursos ?? [])])];
    return [
      { rotulo: 'Empresa', a: texto(a.empresa), b: texto(b.empresa) },
      { rotulo: 'Preço inicial', a: texto(a.preco_inicial), b: texto(b.preco_inicial) },
      { rotulo: 'Plano gratuito', a: a.plano_gratuito, b: b.plano_gratuito },
      { rotulo: 'Código aberto', a: a.codigo_aberto, b: b.codigo_aberto },
      { rotulo: 'Self-hosted', a: a.self_hosted, b: b.self_hosted },
      { rotulo: 'Linguagem', a: texto(a.linguagem), b: texto(b.linguagem) },
      { rotulo: 'Popularidade', a: `${a.popularidade}/100`, b: `${b.popularidade}/100` },
      { rotulo: 'Estrelas no GitHub', a: estrelas(a), b: estrelas(b) },
      ...recursos.map((r) => ({ rotulo: r, a: (a.recursos ?? []).includes(r), b: (b.recursos ?? []).includes(r) })),
    ];
  }

  function opcoes(select, lista, primeira) {
    select.replaceChildren(new Option(primeira, ''), ...lista.map(([valor, texto]) => new Option(texto, valor)));
  }

  function preencherStacks() {
    const categoria = $('categoria').value;
    const stacks = dados.itens.filter((s) => s.categoria === categoria).sort(porPopularidade).map((s) => [s.id, s.nome]);
    for (const id of ['stack-a', 'stack-b']) {
      opcoes($(id), stacks, 'Selecione…');
      $(id).disabled = !categoria;
    }
  }

  function atualizar() {
    const a = dados.porId.get($('stack-a').value);
    const b = dados.porId.get($('stack-b').value);
    // The same stack cannot be chosen on both sides.
    [...$('stack-a').options].forEach((o) => { o.disabled = Boolean(o.value) && o.value === $('stack-b').value; });
    [...$('stack-b').options].forEach((o) => { o.disabled = Boolean(o.value) && o.value === $('stack-a').value; });

    const p = new URLSearchParams();
    if (a) p.set('a', a.id);
    if (b) p.set('b', b.id);
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}`);

    if (!a || !b) {
      $('resultado').replaceChildren();
      return;
    }
    const caixa = el('div', 'painel comparacao');
    caixa.append(versus(a, b), tabela(a, b, linhasDinamicas(a, b)), linksVer(a, b));
    $('resultado').replaceChildren(caixa);
  }

  function renderProntas(comparacoes) {
    $('prontas').replaceChildren(...comparacoes.map((c, i) => {
      const a = dados.porId.get(c.stack_a);
      const b = dados.porId.get(c.stack_b);
      const det = el('details', 'pronta');
      det.id = c.id;
      det.open = i === 0;
      const resumo = el('summary');
      resumo.append(versus(a, b));
      if (c.vencedor) {
        const v = el('span', 'vencedor');
        v.append(icone('trophy'), (c.vencedor === 'a' ? a : b).nome);
        resumo.append(v);
      }
      resumo.append(icone('chevron-down', 'icone-abrir'));
      det.append(resumo, tabela(a, b, c.linhas, c.vencedor), linksVer(a, b));
      return det;
    }));
  }

  async function iniciar() {
    let comparacoes;
    try {
      [dados, { comparacoes }] = await Promise.all([carregarStacks(), lerJson('data/comparacoes.json')]);
    } catch {
      erroDeCarga($('prontas'));
      return;
    }

    const totais = {};
    dados.itens.forEach((s) => { totais[s.categoria] = (totais[s.categoria] ?? 0) + 1; });
    opcoes($('categoria'), Object.entries(dados.categorias).filter(([id]) => totais[id] >= 2).map(([id, c]) => [id, c.nome]), 'Selecione uma categoria…');

    const p = new URLSearchParams(location.search);
    const a = dados.porId.get(p.get('a') ?? '');
    const b = dados.porId.get(p.get('b') ?? '');
    if (a) {
      $('categoria').value = a.categoria;
      preencherStacks();
      $('stack-a').value = a.id;
      if (b && b.categoria === a.categoria && b.id !== a.id) $('stack-b').value = b.id;
    }
    atualizar();
    renderProntas(comparacoes.filter((c) => dados.porId.has(c.stack_a) && dados.porId.has(c.stack_b)));

    $('categoria').addEventListener('change', () => {
      preencherStacks();
      atualizar();
    });
    $('stack-a').addEventListener('change', atualizar);
    $('stack-b').addEventListener('change', atualizar);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

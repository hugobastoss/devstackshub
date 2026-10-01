// Stack detail page (stack.html?id=...): links, numbers, features, use cases,
// the roadmaps that use the stack and three alternatives from its category.
(() => {
  const { $, el, icone, linkSeguro, parametro, lerJson, carregarStacks, erroDeCarga, botaoFavorito, logo, card, completo } = window.DSH;

  function naoEncontrada() {
    document.title = 'Stack não encontrada — DevStacksHub';
    const p = el('p', 'vazio', 'Stack não encontrada. ');
    const voltar = el('a', null, 'Voltar ao catálogo');
    voltar.href = './#catalogo';
    p.append(voltar);
    $('conteudo').replaceChildren(p);
  }

  function botaoLink(rotulo, url, nomeIcone) {
    const a = el('a', 'botao botao--contorno botao--pequeno');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.append(icone(nomeIcone), rotulo, icone('external-link'));
    a.setAttribute('aria-label', `${rotulo} (abre em nova aba)`);
    return a;
  }

  function numero(rotulo, valor) {
    const caixa = el('div', 'numero');
    const v = el('p', 'numero-valor');
    if (typeof valor === 'boolean') {
      v.classList.add(valor ? 'sim' : 'nao');
      v.append(icone(valor ? 'check' : 'x'), valor ? 'Sim' : 'Não');
    } else {
      v.append(valor);
    }
    caixa.append(el('p', 'numero-rotulo', rotulo), v);
    return caixa;
  }

  function bloco(titulo, conteudo) {
    const secao = el('section', 'bloco');
    secao.append(el('h2', null, titulo), conteudo);
    return secao;
  }

  function chips(valores, className = '') {
    const ul = el('ul', `chips ${className}`.trim());
    valores.forEach((v) => ul.append(el('li', null, v)));
    return ul;
  }

  function render(stack, dados, roadmaps) {
    const cat = dados.categorias[stack.categoria];
    document.title = `${stack.nome} — DevStacksHub`;

    const painel = el('article', 'painel');
    const cabeca = el('div', 'detalhe-cabeca');
    const titulo = el('div', 'detalhe-titulo');
    titulo.append(el('h1', null, stack.nome), el('p', 'item-cat', [cat.nome, stack.empresa].filter(Boolean).join(' · ')));
    cabeca.append(logo(stack, 'grande'), titulo, botaoFavorito(stack, 'favorito--borda'));
    painel.append(cabeca, el('p', 'detalhe-desc', stack.descricao));

    const links = el('div', 'links');
    const site = linkSeguro(stack.site);
    if (site) links.append(botaoLink('Site', site, 'globe'));
    if (stack.repositorio) links.append(botaoLink('GitHub', `https://github.com/${stack.repositorio}`, 'github'));
    if (linkSeguro(stack.docs)) links.append(botaoLink('Docs', stack.docs, 'book-open'));
    if (linkSeguro(stack.discord)) links.append(botaoLink('Discord', stack.discord, 'message-circle'));
    painel.append(links);

    const numeros = el('div', 'numeros');
    const pop = el('span', 'mono', `${stack.popularidade}/100`);
    numeros.append(
      numero('Plano gratuito', stack.plano_gratuito),
      numero('Código aberto', stack.codigo_aberto),
      numero('Self-hosted', stack.self_hosted),
      numero('Preço inicial', el('span', 'mono', stack.preco_inicial ?? '—')),
      numero('Popularidade', pop),
    );
    const estrelas = dados.estrelasDe(stack);
    if (typeof estrelas === 'number') {
      const valor = el('a', 'mono', completo.format(estrelas));
      valor.href = `https://github.com/${stack.repositorio}/stargazers`;
      valor.rel = 'noopener';
      numeros.append(numero('Estrelas no GitHub', valor));
    }
    painel.append(numeros);

    if (stack.porque) {
      const porque = el('div', 'porque');
      porque.append(el('p', 'bloco-rotulo', 'Por que recomendamos'), el('p', null, stack.porque));
      painel.append(porque);
    }

    const partes = [painel];
    if (stack.tags?.length) partes.push(bloco('Tags', chips(stack.tags)));
    if (stack.recursos?.length) {
      const ul = el('ul', 'lista-check');
      stack.recursos.forEach((r) => {
        const li = el('li');
        li.append(icone('check'), r);
        ul.append(li);
      });
      partes.push(bloco('Recursos', ul));
    }
    if (stack.casos_de_uso?.length) partes.push(bloco('Usar para', chips(stack.casos_de_uso, 'chips--destaque')));

    const usados = roadmaps.filter((r) => r.etapas.some((e) => e.stack === stack.id));
    if (usados.length) {
      const ul = el('ul', 'chips');
      usados.forEach((r) => {
        const li = el('li');
        const a = el('a');
        a.href = `roadmap.html?id=${encodeURIComponent(r.id)}`;
        a.append(icone(r.icone), r.titulo);
        li.append(a);
        ul.append(li);
      });
      partes.push(bloco('Aparece nos roadmaps', ul));
    }

    const comparar = el('a', 'botao botao--contorno');
    comparar.href = `comparacoes.html?a=${encodeURIComponent(stack.id)}`;
    comparar.append(icone('swords'), `Comparar ${stack.nome} com…`);
    partes.push(bloco('Comparar', comparar));

    const alternativas = dados.itens
      .filter((s) => s.categoria === stack.categoria && s.id !== stack.id)
      .sort((a, b) => b.popularidade - a.popularidade || a.nome.localeCompare(b.nome, 'pt-BR'))
      .slice(0, 3);
    if (alternativas.length) {
      const grade = el('div', 'grade');
      grade.append(...alternativas.map((s) => card(s, dados)));
      partes.push(bloco('Alternativas', grade));
    }
    $('conteudo').replaceChildren(...partes);
  }

  async function iniciar() {
    let dados;
    let roadmaps = [];
    try {
      const [stacks, rm] = await Promise.all([carregarStacks(), lerJson('data/roadmaps.json').catch(() => ({ roadmaps: [] }))]);
      dados = stacks;
      roadmaps = rm.roadmaps ?? [];
    } catch {
      erroDeCarga($('conteudo'));
      return;
    }
    const stack = dados.porId.get(parametro('id'));
    if (!stack) naoEncontrada();
    else render(stack, dados, roadmaps);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

// Glossary page: search, category filter and links between related terms.
(() => {
  const { $, el, normalizar, slug, lerJson, erroDeCarga } = window.DSH;
  const estado = { categoria: '', busca: '' };
  let categorias = {};
  let termos = [];
  let existentes = new Map();

  const ancora = (termo) => `termo-${slug(termo)}`;

  function cartao(t) {
    const art = el('article', 'termo');
    art.id = ancora(t.termo);
    const cabeca = el('div', 'termo-cabeca');
    cabeca.append(el('h3', null, t.termo));
    if (t.expansao !== t.termo) cabeca.append(el('span', 'termo-expansao', t.expansao));
    art.append(cabeca, el('p', null, t.descricao));
    if (t.relacionados?.length) {
      const ul = el('ul', 'chips');
      ul.setAttribute('aria-label', 'Termos relacionados');
      t.relacionados.forEach((r) => {
        const li = el('li');
        const alvo = existentes.get(r.toLowerCase());
        if (alvo) {
          const a = el('a', null, r);
          a.href = `#${ancora(alvo.termo)}`;
          li.append(a);
        } else {
          li.textContent = r;
        }
        ul.append(li);
      });
      art.append(ul);
    }
    return art;
  }

  function render() {
    const termo = normalizar(estado.busca.trim());
    const lista = termos.filter((t) =>
      (!estado.categoria || t.categoria === estado.categoria) &&
      (!termo || normalizar(`${t.termo} ${t.expansao} ${t.descricao}`).includes(termo)));
    const grupos = Object.entries(categorias)
      .map(([id, nome]) => ({ nome, itens: lista.filter((t) => t.categoria === id) }))
      .filter((g) => g.itens.length);
    $('termos').replaceChildren(...grupos.map((g) => {
      const secao = el('section', 'grupo-termos');
      const grade = el('div', 'termos');
      grade.append(...g.itens.map(cartao));
      secao.append(el('h2', null, g.nome), grade);
      return secao;
    }));
    $('vazio').hidden = lista.length > 0;
    $('contagem').textContent = `${lista.length} de ${termos.length} termos`;
    document.querySelectorAll('#filtro-categoria button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.categoria === estado.categoria)));
  }

  async function iniciar() {
    try {
      ({ categorias, termos } = await lerJson('data/glossario.json'));
    } catch {
      erroDeCarga($('termos'));
      return;
    }
    existentes = new Map(termos.map((t) => [t.termo.toLowerCase(), t]));
    $('filtro-categoria').replaceChildren(...['', ...Object.keys(categorias)].map((id) => {
      const botao = el('button', null, id ? categorias[id] : 'Todos');
      botao.type = 'button';
      botao.dataset.categoria = id;
      return botao;
    }));
    render();
    // The cards are built after load, so the browser cannot jump to #termo-x by itself.
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();

    $('filtro-categoria').addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;
      estado.categoria = botao.dataset.categoria;
      render();
    });
    $('busca').addEventListener('input', (e) => {
      estado.busca = e.target.value;
      render();
    });
    // A related term may be hidden by the current filters: clear them first.
    $('termos').addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#termo-"]');
      if (!link || document.getElementById(link.hash.slice(1))) return;
      Object.assign(estado, { categoria: '', busca: '' });
      $('busca').value = '';
      render();
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

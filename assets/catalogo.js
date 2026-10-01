// Home page: the catalog with search, category chips (with counts), filters,
// favourites and paging. The filter state lives in the URL so links can be shared.
(() => {
  const { $, el, normalizar, carregarStacks, erroDeCarga, favoritos, card } = window.DSH;
  const POR_PAGINA = 30;
  const ORDENS = ['popularidade', 'nome', 'estrelas'];
  const TIPOS = { gratuito: 'plano_gratuito', aberto: 'codigo_aberto', self: 'self_hosted' };
  const estado = { categoria: '', busca: '', gratuito: false, aberto: false, self: false, ordem: 'popularidade', soFavoritos: false, visiveis: POR_PAGINA };
  let dados;
  let lista = [];
  let indice = new Map();

  function lerUrl() {
    const p = new URLSearchParams(location.search);
    const categoria = p.get('categoria') ?? '';
    estado.categoria = Object.hasOwn(dados.categorias, categoria) ? categoria : '';
    estado.busca = p.get('q') || '';
    for (const tipo of Object.keys(TIPOS)) estado[tipo] = p.get(tipo) === '1';
    estado.ordem = ORDENS.includes(p.get('ordem')) ? p.get('ordem') : 'popularidade';
  }

  function salvarUrl() {
    const p = new URLSearchParams();
    if (estado.categoria) p.set('categoria', estado.categoria);
    if (estado.busca) p.set('q', estado.busca);
    for (const tipo of Object.keys(TIPOS)) if (estado[tipo]) p.set(tipo, '1');
    if (estado.ordem !== 'popularidade') p.set('ordem', estado.ordem);
    const qs = p.toString();
    history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
  }

  const porPopularidade = (a, b) => b.popularidade - a.popularidade || a.nome.localeCompare(b.nome, 'pt-BR');
  const ORDENAR = {
    popularidade: porPopularidade,
    nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
    // Stacks without a GitHub repository go to the end, in popularity order.
    estrelas: (a, b) => (dados.estrelasDe(b) ?? -1) - (dados.estrelasDe(a) ?? -1) || porPopularidade(a, b),
  };

  function filtrar() {
    const termo = normalizar(estado.busca.trim());
    const fav = favoritos();
    return dados.itens.filter((s) =>
      (!estado.categoria || s.categoria === estado.categoria) &&
      Object.entries(TIPOS).every(([tipo, campo]) => !estado[tipo] || s[campo]) &&
      (!estado.soFavoritos || fav.has(s.id)) &&
      (!termo || indice.get(s).includes(termo)))
      .sort(ORDENAR[estado.ordem]);
  }

  // Each chip shows how many stacks the category has in the whole catalog.
  function renderCategorias() {
    const totais = { '': dados.itens.length };
    dados.itens.forEach((s) => { totais[s.categoria] = (totais[s.categoria] ?? 0) + 1; });
    $('filtro-categoria').replaceChildren(...['', ...Object.keys(dados.categorias)].map((id) => {
      const nome = id ? dados.categorias[id].nome : 'Todas';
      const total = totais[id] ?? 0;
      const botao = el('button', null, nome);
      botao.type = 'button';
      botao.dataset.categoria = id;
      botao.setAttribute('aria-label', `${nome} (${total} ${total === 1 ? 'stack' : 'stacks'})`);
      botao.append(el('span', 'qtd', String(total)));
      return botao;
    }));
  }

  function atualizarMais() {
    const restantes = lista.length - estado.visiveis;
    $('mais-area').hidden = restantes <= 0;
    $('mais').textContent = `Mostrar mais (${restantes} ${restantes === 1 ? 'restante' : 'restantes'})`;
  }

  const totalFavoritos = () => dados.itens.reduce((n, s) => n + (favoritos().has(s.id) ? 1 : 0), 0);

  function render(manterPagina = false) {
    if (!manterPagina) estado.visiveis = POR_PAGINA;
    lista = filtrar();
    $('grade').replaceChildren(...lista.slice(0, estado.visiveis).map((s) => card(s, dados)));
    $('vazio').hidden = lista.length > 0;
    $('vazio-texto').textContent = estado.soFavoritos && totalFavoritos() === 0
      ? 'Você ainda não favoritou nenhuma stack.' : 'Nenhuma stack encontrada.';
    $('contagem').textContent = `${lista.length} de ${dados.itens.length} stacks`;
    $('total-favoritos').textContent = `(${totalFavoritos()})`;
    $('so-favoritos').setAttribute('aria-pressed', String(estado.soFavoritos));
    $('ordem').value = estado.ordem;
    document.querySelectorAll('#filtro-categoria button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.categoria === estado.categoria)));
    document.querySelectorAll('#filtro-tipo button').forEach((b) => b.setAttribute('aria-pressed', String(estado[b.dataset.filtro])));
    atualizarMais();
    salvarUrl();
  }

  function mostrarMais() {
    const inicio = estado.visiveis;
    estado.visiveis += POR_PAGINA;
    $('grade').append(...lista.slice(inicio, estado.visiveis).map((s) => card(s, dados)));
    atualizarMais();
  }

  async function iniciar() {
    try {
      dados = await carregarStacks();
    } catch {
      $('contagem').textContent = 'Não foi possível carregar o catálogo.';
      erroDeCarga($('grade'));
      return;
    }
    indice = new Map(dados.itens.map((s) => [s, normalizar([
      s.nome, s.empresa ?? '', s.descricao, s.porque ?? '', s.linguagem ?? '', dados.categorias[s.categoria].nome,
      ...(s.tags ?? []), ...(s.recursos ?? []), ...(s.casos_de_uso ?? []),
    ].join(' '))]));

    if (dados.estrelasAtualizadas) {
      $('nota-estrelas').textContent = `Estrelas do GitHub atualizadas em ${dados.estrelasAtualizadas.toLocaleDateString('pt-BR')}.`;
      $('nota-estrelas').hidden = false;
    }

    lerUrl();
    $('busca').value = estado.busca;
    renderCategorias();
    render();

    $('filtro-categoria').addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;
      estado.categoria = botao.dataset.categoria;
      render();
    });
    $('filtro-tipo').addEventListener('click', (e) => {
      const botao = e.target.closest('button');
      if (!botao) return;
      estado[botao.dataset.filtro] = !estado[botao.dataset.filtro];
      render();
    });
    $('busca').addEventListener('input', (e) => {
      estado.busca = e.target.value;
      render();
    });
    $('ordem').addEventListener('change', (e) => {
      estado.ordem = e.target.value;
      render();
    });
    $('so-favoritos').addEventListener('click', () => {
      estado.soFavoritos = !estado.soFavoritos;
      render();
    });
    $('limpar').addEventListener('click', () => {
      Object.assign(estado, { categoria: '', busca: '', gratuito: false, aberto: false, self: false, soFavoritos: false });
      $('busca').value = '';
      render();
    });
    $('mais').addEventListener('click', mostrarMais);
    document.addEventListener('favoritos', () => {
      if (estado.soFavoritos) render(true);
      else $('total-favoritos').textContent = `(${totalFavoritos()})`;
    });
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

// Roadmap list page.
(() => {
  const { $, el, icone, lerJson, erroDeCarga } = window.DSH;

  function card(r) {
    const a = el('a', 'roadmap-card');
    a.href = `roadmap.html?id=${encodeURIComponent(r.id)}`;
    const topo = el('div', 'roadmap-topo');
    const caixa = el('span', 'roadmap-icone');
    caixa.append(icone(r.icone));
    topo.append(caixa, el('span', 'etapas-total', `${r.etapas.length} etapas`));
    const pe = el('div', 'item-pe');
    const ver = el('span', 'ver-mais', 'Ver roadmap');
    ver.append(icone('arrow-right'));
    pe.append(el('span', null, r.categoria ?? ''), ver);
    a.append(topo, el('h3', null, r.titulo), el('p', null, r.descricao), pe);
    return a;
  }

  async function iniciar() {
    try {
      const { roadmaps } = await lerJson('data/roadmaps.json');
      $('grade').replaceChildren(...roadmaps.map(card));
    } catch {
      erroDeCarga($('grade'));
    }
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

// Roadmap detail page (roadmap.html?id=...): the steps as a timeline and a
// ready-made prompt to send to an AI coding assistant.
(() => {
  const { $, el, icone, parametro, lerJson, erroDeCarga } = window.DSH;

  const IAS = [
    { nome: 'Claude', url: 'https://claude.ai/new', cor: '#D97757' },
    { nome: 'ChatGPT', url: 'https://chatgpt.com/', cor: '#10A37F' },
    { nome: 'Gemini', url: 'https://gemini.google.com/app', cor: '#4285F4' },
    { nome: 'Copilot', url: 'https://github.com/copilot', cor: '#6E40C9' },
    { nome: 'Cursor', url: 'https://cursor.com', cor: '#000000' },
  ];

  // Same keyword rules the Base44 version used to pick an icon per step.
  function iconeDaEtapa(categoria) {
    const c = categoria.toLowerCase();
    const tem = (...palavras) => palavras.some((p) => c.includes(p));
    if (tem('front', 'ui', 'client')) return 'monitor';
    if (tem('back', 'api', 'server')) return 'server';
    if (tem('dado', 'data', 'database', 'db')) return 'database';
    if (tem('auth', 'login', 'seguran')) return 'lock';
    if (tem('storage', 'arquivo', 'file')) return 'hard-drive';
    if (tem('deploy', 'host', 'cloud', 'infra')) return 'cloud';
    if (tem('email', 'mail', 'notif')) return 'mail';
    if (tem('analytics', 'monitor', 'observ')) return 'activity';
    if (tem('pay', 'payment', 'stripe', 'billing')) return 'credit-card';
    if (tem('devops', 'ci', 'cd', 'pipeline')) return 'git-branch';
    if (tem('security', 'secure')) return 'shield-check';
    return 'box';
  }

  function prompt(r) {
    const ferramentas = r.etapas
      .map((e, i) => `${i + 1}. ${e.categoria}: ${e.ferramenta}${e.descricao ? ` — ${e.descricao}` : ''}`)
      .join('\n');
    return `Você é um arquiteto de software sênior. Crie a estrutura inicial de um projeto do tipo "${r.titulo}" seguindo a arquitetura abaixo:

${ferramentas}

## Contexto
${r.descricao || ''}

## Instruções
1. Inicialize o projeto e configure a estrutura de pastas
2. Instale e configure cada ferramenta listada na ordem acima
3. Crie um arquivo .env.example com todas as variáveis de ambiente necessárias
4. Escreva código de integração funcional para cada serviço
5. Gere um README.md com instruções de setup passo a passo
6. Siga as melhores práticas e padrões de cada tecnologia
7. Adicione tratamento de erros básico e tipagem quando aplicável

Gere o projeto completo, pronto para rodar localmente.`;
  }

  async function copiar(texto, botao) {
    const original = botao.lastChild.textContent;
    try {
      await navigator.clipboard.writeText(texto);
      botao.lastChild.textContent = 'Prompt copiado';
    } catch {
      botao.lastChild.textContent = 'Não foi possível copiar';
    }
    setTimeout(() => { botao.lastChild.textContent = original; }, 1800);
  }

  function linhaDoTempo(r) {
    const ol = el('ol', 'linha-tempo');
    r.etapas.forEach((e, i) => {
      const li = el('li', 'etapa');
      const marca = el('span', 'etapa-marca');
      marca.append(icone(iconeDaEtapa(e.categoria)), el('span', 'etapa-numero', String(i + 1)));
      const corpo = el('div', 'etapa-corpo');
      const h3 = el('h3');
      if (e.stack) {
        const a = el('a', null, e.ferramenta);
        a.href = `stack.html?id=${encodeURIComponent(e.stack)}`;
        h3.append(a);
      } else {
        h3.textContent = e.ferramenta;
      }
      corpo.append(el('p', 'etapa-categoria', e.categoria), h3);
      if (e.descricao) corpo.append(el('p', null, e.descricao));
      li.append(marca, corpo);
      ol.append(li);
    });
    return ol;
  }

  function enviarParaIa(r) {
    const texto = prompt(r);
    const caixa = el('section', 'painel ia bloco');
    const h2 = el('h2');
    h2.append(icone('send'), 'Enviar para IA');
    const detalhes = el('details', 'prompt');
    detalhes.append(el('summary', null, 'Ver prompt'), el('pre', null, texto));

    const acoes = el('div', 'ia-acoes');
    const botaoCopiar = el('button', 'botao ia-copiar');
    botaoCopiar.type = 'button';
    botaoCopiar.id = 'copiar-prompt';
    botaoCopiar.append(icone('copy'), el('span', null, 'Copiar prompt'));
    botaoCopiar.addEventListener('click', () => copiar(texto, botaoCopiar));
    acoes.append(botaoCopiar);
    // Each assistant link copies the prompt and opens in a new tab, so the
    // visitor only has to paste it.
    IAS.forEach((ia) => {
      const a = el('a', 'botao botao--contorno');
      a.href = ia.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `Copiar o prompt e abrir ${ia.nome} (nova aba)`);
      const letra = el('span', 'ia-letra', ia.nome[0]);
      letra.style.background = ia.cor;
      a.append(letra, ia.nome, icone('external-link'));
      a.addEventListener('click', () => { navigator.clipboard?.writeText(texto).catch(() => {}); });
      acoes.append(a);
    });

    caixa.append(h2, el('p', null, 'Copie o prompt de setup deste roadmap e cole no seu assistente de código favorito.'), detalhes, acoes);
    return caixa;
  }

  function render(r) {
    document.title = `${r.titulo} — DevStacksHub`;
    const cabeca = el('header', 'hero hero--pagina');
    const selo = el('p', 'eyebrow');
    selo.append(icone('cpu'), `${r.etapas.length} etapas`);
    cabeca.append(selo, el('h1', null, r.titulo), el('p', 'lead', r.descricao));
    $('conteudo').replaceChildren(cabeca, linhaDoTempo(r), enviarParaIa(r));
  }

  async function iniciar() {
    let roadmaps;
    try {
      ({ roadmaps } = await lerJson('data/roadmaps.json'));
    } catch {
      erroDeCarga($('conteudo'));
      return;
    }
    const r = roadmaps.find((x) => x.id === parametro('id'));
    if (r) {
      render(r);
      return;
    }
    document.title = 'Roadmap não encontrado — DevStacksHub';
    const p = el('p', 'vazio', 'Roadmap não encontrado. ');
    const voltar = el('a', null, 'Voltar aos roadmaps');
    voltar.href = 'roadmaps.html';
    p.append(voltar);
    $('conteudo').replaceChildren(p);
  }

  document.addEventListener('DOMContentLoaded', iniciar);
})();

const API_BASE = '/api/produtos';

const tbody = document.getElementById('produtosTbody');
const form = document.getElementById('produtoForm');
const totalBadge = document.getElementById('totalProdutos');
const mensagemEl = document.getElementById('mensagem');
const formTitulo = document.getElementById('formTitulo');
const produtoIdInput = document.getElementById('produtoId');
const submitBtn = document.getElementById('submitBtn');
const cancelarBtn = document.getElementById('cancelarBtn');
const buscaInput = document.getElementById('buscaInput');

let termoBusca = '';
let pollingId = null;
let usuarioAtual = null;

async function fetchAutenticado(url, options) {
  const resp = await fetch(url, options);
  if (resp.status === 401) {
    window.location.replace('/');
    throw new Error('Sessao expirada.');
  }
  return resp;
}

async function carregarUsuario() {
  const resp = await fetchAutenticado('/api/auth/me');
  const { usuario } = await resp.json();
  usuarioAtual = usuario;
  document.getElementById('usuarioNome').textContent = usuario.nome;
  document.getElementById('colaboradoresTab').classList.toggle(
    'hidden',
    usuario.papel !== 'proprietario',
  );
}

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  window.location.replace('/');
});

document.querySelectorAll('.nav-tab').forEach((tab) => tab.addEventListener('click', async () => {
  document.querySelectorAll('.nav-tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.app-view').forEach((view) => view.classList.add('hidden'));
  document.getElementById(tab.dataset.view).classList.remove('hidden');

  if (tab.dataset.view === 'colaboradoresView') await carregarColaboradores();
  if (tab.dataset.view === 'logsView') await carregarLogs();
}));

function formatarData(valor) {
  return new Date(`${valor.replace(' ', 'T')}Z`).toLocaleString('pt-BR');
}

async function carregarColaboradores() {
  if (usuarioAtual?.papel !== 'proprietario') return;
  const resp = await fetchAutenticado('/api/colaboradores');
  const colaboradores = await resp.json();
  const lista = document.getElementById('colaboradoresTbody');
  lista.innerHTML = '';

  colaboradores.forEach((colaborador) => {
    const linha = document.createElement('tr');
    [colaborador.nome, colaborador.email, formatarData(colaborador.criado_em)].forEach((valor) => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    });
    const acoes = document.createElement('td');
    acoes.className = 'acoes';
    const remover = document.createElement('button');
    remover.type = 'button';
    remover.className = 'danger';
    remover.textContent = 'Remover';
    remover.addEventListener('click', () => removerColaborador(colaborador.id));
    acoes.appendChild(remover);
    linha.appendChild(acoes);
    lista.appendChild(linha);
  });
}

async function removerColaborador(id) {
  if (!confirm('Remover este colaborador e bloquear seu acesso?')) return;
  const resp = await fetchAutenticado(`/api/colaboradores/${id}`, { method: 'DELETE' });
  const resposta = await resp.json();
  if (!resp.ok) return exibirMensagemColaborador(resposta.error, 'erro');
  exibirMensagemColaborador(resposta.mensagem, 'sucesso');
  await carregarColaboradores();
}

function exibirMensagemColaborador(texto, tipo) {
  const elemento = document.getElementById('colaboradorMensagem');
  elemento.textContent = texto;
  elemento.className = `mensagem ${tipo}`;
}

document.getElementById('colaboradorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const dados = {
    nome: document.getElementById('colaboradorNome').value.trim(),
    email: document.getElementById('colaboradorEmail').value.trim(),
    senha: document.getElementById('colaboradorSenha').value,
  };
  const resp = await fetchAutenticado('/api/colaboradores', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados),
  });
  const resposta = await resp.json();
  if (!resp.ok) return exibirMensagemColaborador(resposta.error, 'erro');
  event.target.reset();
  exibirMensagemColaborador('Colaborador adicionado.', 'sucesso');
  await carregarColaboradores();
});

async function carregarLogs() {
  const resp = await fetchAutenticado('/api/logs');
  const logs = await resp.json();
  const lista = document.getElementById('logsTbody');
  lista.innerHTML = '';
  logs.forEach((log) => {
    const linha = document.createElement('tr');
    const item = log.entidade_id ? `${log.entidade} #${log.entidade_id}` : log.entidade;
    [formatarData(log.criado_em), log.usuario_nome, log.acao, item, log.detalhes || '-'].forEach((valor) => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      linha.appendChild(celula);
    });
    lista.appendChild(linha);
  });
}

document.getElementById('atualizarLogs').addEventListener('click', carregarLogs);

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarMensagem(texto, tipo = 'erro') {
  mensagemEl.textContent = texto;
  mensagemEl.classList.remove('erro', 'info', 'sucesso');
  mensagemEl.classList.add(tipo);
  mensagemEl.classList.remove('hidden');
}

function mostrarErro(texto) {
  mostrarMensagem(texto, 'erro');
}

function limparMensagem() {
  mensagemEl.classList.add('hidden');
  mensagemEl.textContent = '';
  mensagemEl.classList.remove('erro', 'info', 'sucesso');
}

async function acompanharJob(jobId) {
  if (!jobId) return;

  clearInterval(pollingId);
  mostrarMensagem(`Operacao ${jobId} enviada para a fila. Aguardando processamento...`, 'info');

  let tentativas = 0;
  pollingId = setInterval(async () => {
    tentativas += 1;

    try {
      const resp = await fetchAutenticado(`/api/jobs/${jobId}`);
      const job = await resp.json();

      if (!resp.ok) {
        mostrarErro(job.error || 'Nao foi possivel consultar o job.');
        clearInterval(pollingId);
        return;
      }

      if (job.status === 'completed') {
        clearInterval(pollingId);
        mostrarMensagem('Operacao processada com sucesso.', 'sucesso');
        await carregarProdutos();
        setTimeout(limparMensagem, 2500);
        return;
      }

      if (job.status === 'failed') {
        clearInterval(pollingId);
        mostrarErro(job.erro || 'O processamento da fila falhou.');
        await carregarProdutos();
        return;
      }

      if (tentativas >= 20) {
        clearInterval(pollingId);
        mostrarMensagem('Operacao ainda esta na fila. A lista sera atualizada na proxima consulta.', 'info');
        await carregarProdutos();
      }
    } catch (err) {
      clearInterval(pollingId);
      mostrarErro('Falha ao consultar o status da fila.');
    }
  }, 700);
}

function entrarModoEdicao(produto) {
  produtoIdInput.value = produto.id;
  document.getElementById('nome').value = produto.nome;
  document.getElementById('preco').value = produto.preco;
  document.getElementById('categoria').value = produto.categoria ?? '';
  document.getElementById('estoque').value = produto.estoque;

  formTitulo.textContent = `Editar produto #${produto.id}`;
  submitBtn.textContent = 'Salvar';
  cancelarBtn.classList.remove('hidden');
}

function sairModoEdicao() {
  form.reset();
  produtoIdInput.value = '';
  formTitulo.textContent = 'Novo produto';
  submitBtn.textContent = 'Adicionar';
  cancelarBtn.classList.add('hidden');
}

async function removerProduto(id) {
  if (!confirm('Remover este produto?')) return;

  const resp = await fetchAutenticado(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!resp.ok) {
    const erro = await resp.json();
    mostrarErro(erro.error);
    return;
  }

  const job = await resp.json();
  await acompanharJob(job.jobId);
}

function criarBotao(texto, classe, aoClicar) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener('click', aoClicar);
  return botao;
}

function renderProdutos(produtos) {
  tbody.innerHTML = '';

  produtos.forEach((produto) => {
    const tr = document.createElement('tr');
    [produto.nome, produto.categoria ?? '-', formatarPreco(produto.preco), produto.estoque].forEach((valor) => {
      const celula = document.createElement('td');
      celula.textContent = valor;
      tr.appendChild(celula);
    });

    const acoes = document.createElement('td');
    acoes.className = 'acoes';
    acoes.append(
      criarBotao('Editar', 'secondary', () => entrarModoEdicao(produto)),
      criarBotao('Remover', 'danger', () => removerProduto(produto.id)),
    );
    tr.appendChild(acoes);

    tbody.appendChild(tr);
  });
}

async function atualizarTotal() {
  const resp = await fetchAutenticado(`${API_BASE}/count`);
  const { total } = await resp.json();
  totalBadge.textContent = `${total} produto${total === 1 ? '' : 's'}`;
}

async function carregarProdutos() {
  const url = termoBusca
    ? `${API_BASE}/search?nome=${encodeURIComponent(termoBusca)}`
    : API_BASE;

  const resp = await fetchAutenticado(url);
  const produtos = await resp.json();
  renderProdutos(produtos);
  await atualizarTotal();
}

let debounceId;
buscaInput.addEventListener('input', (event) => {
  clearTimeout(debounceId);
  debounceId = setTimeout(() => {
    termoBusca = event.target.value.trim();
    carregarProdutos();
  }, 300);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  limparMensagem();

  const id = produtoIdInput.value;
  const dados = {
    nome: document.getElementById('nome').value.trim(),
    preco: Number(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value.trim() || null,
    estoque: Number(document.getElementById('estoque').value || 0),
  };

  const resp = await fetchAutenticado(id ? `${API_BASE}/${id}` : API_BASE, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  if (!resp.ok) {
    const erro = await resp.json();
    mostrarErro(erro.error);
    return;
  }

  const job = await resp.json();
  sairModoEdicao();
  await acompanharJob(job.jobId);
});

cancelarBtn.addEventListener('click', sairModoEdicao);

Promise.all([carregarUsuario(), carregarProdutos()]).catch(() => {});

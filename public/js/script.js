const API_BASE = '/api/produtos';

const tbody = document.getElementById('produtosTbody');
const form = document.getElementById('produtoForm');
const totalBadge = document.getElementById('totalProdutos');
const mensagemEl = document.getElementById('mensagem');
const formTitulo = document.getElementById('formTitulo');
const produtoIdInput = document.getElementById('produtoId');
const submitBtn = document.getElementById('submitBtn');
const cancelarBtn = document.getElementById('cancelarBtn');

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mostrarErro(texto) {
  mensagemEl.textContent = texto;
  mensagemEl.classList.remove('hidden');
}

function limparErro() {
  mensagemEl.classList.add('hidden');
  mensagemEl.textContent = '';
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

  const resp = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!resp.ok) {
    const erro = await resp.json();
    mostrarErro(erro.error);
    return;
  }

  await carregarProdutos();
}

function renderProdutos(produtos) {
  tbody.innerHTML = '';

  produtos.forEach((produto) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.categoria ?? '-'}</td>
      <td>${formatarPreco(produto.preco)}</td>
      <td>${produto.estoque}</td>
      <td class="acoes">
        <button type="button" class="secondary editar">Editar</button>
        <button type="button" class="danger remover">Remover</button>
      </td>
    `;

    tr.querySelector('.editar').addEventListener('click', () => entrarModoEdicao(produto));
    tr.querySelector('.remover').addEventListener('click', () => removerProduto(produto.id));

    tbody.appendChild(tr);
  });
}

async function atualizarTotal() {
  const resp = await fetch(`${API_BASE}/count`);
  const { total } = await resp.json();
  totalBadge.textContent = `${total} produto${total === 1 ? '' : 's'}`;
}

async function carregarProdutos() {
  const resp = await fetch(API_BASE);
  const produtos = await resp.json();
  renderProdutos(produtos);
  await atualizarTotal();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  limparErro();

  const id = produtoIdInput.value;
  const dados = {
    nome: document.getElementById('nome').value.trim(),
    preco: Number(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value.trim() || null,
    estoque: Number(document.getElementById('estoque').value || 0),
  };

  const resp = await fetch(id ? `${API_BASE}/${id}` : API_BASE, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  if (!resp.ok) {
    const erro = await resp.json();
    mostrarErro(erro.error);
    return;
  }

  sairModoEdicao();
  await carregarProdutos();
});

cancelarBtn.addEventListener('click', sairModoEdicao);

carregarProdutos();

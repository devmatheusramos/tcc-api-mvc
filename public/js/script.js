const API_BASE = '/api/produtos';

const tbody = document.getElementById('produtosTbody');
const form = document.getElementById('produtoForm');
const totalBadge = document.getElementById('totalProdutos');
const mensagemEl = document.getElementById('mensagem');

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

function renderProdutos(produtos) {
  tbody.innerHTML = '';

  produtos.forEach((produto) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.categoria ?? '-'}</td>
      <td>${formatarPreco(produto.preco)}</td>
      <td>${produto.estoque}</td>
      <td class="acoes"></td>
    `;
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

  const dados = {
    nome: document.getElementById('nome').value.trim(),
    preco: Number(document.getElementById('preco').value),
    categoria: document.getElementById('categoria').value.trim() || null,
    estoque: Number(document.getElementById('estoque').value || 0),
  };

  const resp = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });

  if (!resp.ok) {
    const erro = await resp.json();
    mostrarErro(erro.error);
    return;
  }

  form.reset();
  await carregarProdutos();
});

carregarProdutos();

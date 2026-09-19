const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockflow-api-test-'));
process.env.DATA_DIR = testDataDir;
process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes';
process.env.QUEUE_MODE = 'inline';
process.env.AUTH_RATE_LIMIT_MAX = '5';

const db = require('../src/config/database');
const app = require('../src/app');

let servidor;
let baseUrl;

before(async () => {
  servidor = app.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  baseUrl = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor.closeAllConnections();
  await new Promise((resolve) => servidor.close(resolve));
  db.close();
  fs.rmSync(testDataDir, { recursive: true, force: true });
});

async function chamar(metodo, caminho, { token, corpo } = {}) {
  const resposta = await fetch(`${baseUrl}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: corpo && JSON.stringify(corpo),
  });
  const texto = await resposta.text();
  return {
    status: resposta.status,
    headers: resposta.headers,
    corpo: texto ? JSON.parse(texto) : null,
  };
}

async function cadastrar(nome, email) {
  const resposta = await chamar('POST', '/api/auth/register', {
    corpo: { nome, email, senha: 'senha123' },
  });
  assert.equal(resposta.status, 201);
  return resposta.corpo.token;
}

async function criarProduto(token, produto) {
  const resposta = await chamar('POST', '/api/produtos', { token, corpo: produto });
  assert.equal(resposta.status, 202);
  const job = await chamar('GET', `/api/jobs/${resposta.corpo.jobId}`, { token });
  assert.equal(job.corpo.status, 'completed');
  return job.corpo.resultado;
}

const teclado = { nome: 'Teclado', preco: 250.9, categoria: 'Perifericos', estoque: 10 };

test('exige autenticacao nas rotas protegidas', async () => {
  assert.equal((await chamar('GET', '/api/produtos')).status, 401);
  assert.equal((await chamar('GET', '/api/produtos', { token: 'invalido' })).status, 401);
  assert.equal((await chamar('GET', '/api/logs')).status, 401);
});

test('cadastra, autentica e informa o usuario logado', async () => {
  const token = await cadastrar('Maria Silva', 'maria@email.com');

  const login = await chamar('POST', '/api/auth/login', {
    corpo: { email: 'maria@email.com', senha: 'senha123' },
  });
  assert.equal(login.status, 200);

  const me = await chamar('GET', '/api/auth/me', { token });
  assert.equal(me.corpo.usuario.papel, 'proprietario');

  const senhaErrada = await chamar('POST', '/api/auth/login', {
    corpo: { email: 'maria@email.com', senha: 'errada123' },
  });
  assert.equal(senhaErrada.status, 401);
});

test('cria pela fila e consulta por id, listagem, contagem e nome', async () => {
  const token = await cadastrar('Ana', 'ana@email.com');

  const criado = await chamar('POST', '/api/produtos', { token, corpo: teclado });
  assert.equal(criado.status, 202);
  assert.equal(criado.headers.get('location'), `/api/jobs/${criado.corpo.jobId}`);

  const job = await chamar('GET', `/api/jobs/${criado.corpo.jobId}`, { token });
  assert.equal(job.corpo.status, 'completed');
  const { id } = job.corpo.resultado;

  assert.equal((await chamar('GET', `/api/produtos/${id}`, { token })).corpo.nome, 'Teclado');
  assert.equal((await chamar('GET', '/api/produtos', { token })).corpo.length, 1);
  assert.equal((await chamar('GET', '/api/produtos/count', { token })).corpo.total, 1);
  assert.equal((await chamar('GET', '/api/produtos/search?nome=tecl', { token })).corpo.length, 1);
  assert.equal((await chamar('GET', '/api/produtos/search?nome=mouse', { token })).corpo.length, 0);
  assert.equal((await chamar('GET', '/api/produtos/search', { token })).status, 400);
  assert.equal((await chamar('GET', '/api/produtos/999', { token })).status, 404);
});

test('rejeita dados invalidos antes de enfileirar', async () => {
  const token = await cadastrar('Bia', 'bia@email.com');

  const semNome = await chamar('POST', '/api/produtos', { token, corpo: { nome: '', preco: -5 } });
  assert.equal(semNome.status, 400);
  assert.match(semNome.corpo.error, /nome/);

  const categoriaInvalida = await chamar('POST', '/api/produtos', {
    token, corpo: { ...teclado, categoria: { x: 1 } },
  });
  assert.equal(categoriaInvalida.status, 400);

  const { id } = await criarProduto(token, teclado);
  const precoInvalido = await chamar('PUT', `/api/produtos/${id}`, { token, corpo: { preco: 0 } });
  assert.equal(precoInvalido.status, 400);

  assert.equal((await chamar('GET', '/api/produtos/count', { token })).corpo.total, 1);
});

test('atualiza e remove produtos, com 404 para ids inexistentes', async () => {
  const token = await cadastrar('Caio', 'caio@email.com');
  const { id } = await criarProduto(token, teclado);

  const atualizacao = await chamar('PUT', `/api/produtos/${id}`, { token, corpo: { estoque: 8 } });
  assert.equal(atualizacao.status, 202);
  assert.equal((await chamar('GET', `/api/produtos/${id}`, { token })).corpo.estoque, 8);

  assert.equal((await chamar('PUT', '/api/produtos/999', { token, corpo: { estoque: 1 } })).status, 404);
  assert.equal((await chamar('DELETE', '/api/produtos/999', { token })).status, 404);

  assert.equal((await chamar('DELETE', `/api/produtos/${id}`, { token })).status, 202);
  assert.equal((await chamar('GET', `/api/produtos/${id}`, { token })).status, 404);
  assert.equal((await chamar('DELETE', `/api/produtos/${id}`, { token })).status, 404);
});

test('isola produtos e jobs entre proprietarios', async () => {
  const donoA = await cadastrar('Dono A', 'dono.a@email.com');
  const donoB = await cadastrar('Dono B', 'dono.b@email.com');
  const { id } = await criarProduto(donoA, teclado);

  assert.equal((await chamar('GET', '/api/produtos', { token: donoB })).corpo.length, 0);
  assert.equal((await chamar('GET', '/api/produtos/count', { token: donoB })).corpo.total, 0);
  assert.equal((await chamar('GET', `/api/produtos/${id}`, { token: donoB })).status, 404);
  assert.equal((await chamar('PUT', `/api/produtos/${id}`, { token: donoB, corpo: { estoque: 1 } })).status, 404);
  assert.equal((await chamar('DELETE', `/api/produtos/${id}`, { token: donoB })).status, 404);

  const criado = await chamar('POST', '/api/produtos', { token: donoA, corpo: teclado });
  assert.equal((await chamar('GET', `/api/jobs/${criado.corpo.jobId}`, { token: donoB })).status, 404);
  assert.equal((await chamar('GET', `/api/jobs/${criado.corpo.jobId}`, { token: donoA })).status, 200);
});

test('colaborador opera produtos, nao gerencia a equipe e perde o acesso ao ser removido', async () => {
  const dono = await cadastrar('Dona Lu', 'lu@email.com');

  const novo = await chamar('POST', '/api/colaboradores', {
    token: dono, corpo: { nome: 'Joao Costa', email: 'joao@email.com', senha: 'senha456' },
  });
  assert.equal(novo.status, 201);

  const login = await chamar('POST', '/api/auth/login', {
    corpo: { email: 'joao@email.com', senha: 'senha456' },
  });
  const colaborador = login.corpo.token;

  await criarProduto(colaborador, teclado);
  assert.equal((await chamar('GET', '/api/produtos/count', { token: dono })).corpo.total, 1);

  assert.equal((await chamar('GET', '/api/colaboradores', { token: colaborador })).status, 403);
  const tentativa = await chamar('POST', '/api/colaboradores', {
    token: colaborador, corpo: { nome: 'Intruso', email: 'intruso@email.com', senha: 'senha789' },
  });
  assert.equal(tentativa.status, 403);

  const logs = await chamar('GET', '/api/logs', { token: dono });
  assert.ok(logs.corpo.some((log) => log.acao === 'CRIOU' && log.usuario_nome === 'Joao Costa'));

  assert.equal((await chamar('DELETE', `/api/colaboradores/${novo.corpo.id}`, { token: dono })).status, 200);
  assert.equal((await chamar('GET', '/api/produtos', { token: colaborador })).status, 401);
});

test('responde 404 em JSON para rotas inexistentes', async () => {
  const resposta = await chamar('GET', '/api/nao-existe');
  assert.equal(resposta.status, 404);
  assert.ok(resposta.corpo.error);
});

test('responde JSON, sem stack trace, para corpo malformado', async () => {
  const resposta = await fetch(`${baseUrl}/api/produtos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{quebrado',
  });
  assert.equal(resposta.status, 400);
  assert.match(resposta.headers.get('content-type'), /application\/json/);
  const corpo = await resposta.json();
  assert.ok(corpo.error);
  assert.doesNotMatch(JSON.stringify(corpo), /node_modules|SyntaxError/);
});

test('limita tentativas de login com senha incorreta', async () => {
  let ultima;
  for (let tentativa = 0; tentativa < 6; tentativa += 1) {
    ultima = await chamar('POST', '/api/auth/login', {
      corpo: { email: 'ninguem@email.com', senha: 'errada123' },
    });
  }
  assert.equal(ultima.status, 429);
});

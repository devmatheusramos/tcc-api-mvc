const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockflow-test-'));
process.env.DATA_DIR = testDataDir;
process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes';

const db = require('../src/config/database');
const AuthService = require('../src/services/AuthService');
const ProdutoService = require('../src/services/ProdutoService');
const AuditoriaService = require('../src/services/AuditoriaService');
const { assinarToken, verificarToken } = require('../src/utils/jwt');

before(() => {
  db.exec('DELETE FROM usuarios; DELETE FROM produtos;');
});

after(() => {
  db.close();
  fs.rmSync(testDataDir, { recursive: true, force: true });
});

test('cadastra usuario e autentica com a mesma senha', async () => {
  const cadastro = await AuthService.cadastrar({
    nome: 'Maria Silva',
    email: 'maria@email.com',
    senha: 'senha123',
  });

  assert.equal(cadastro.usuario.email, 'maria@email.com');
  assert.equal(verificarToken(cadastro.token).sub, String(cadastro.usuario.id));

  const login = await AuthService.entrar({ email: 'maria@email.com', senha: 'senha123' });
  assert.equal(login.usuario.nome, 'Maria Silva');
});

test('rejeita senha incorreta', async () => {
  await assert.rejects(
    AuthService.entrar({ email: 'maria@email.com', senha: 'errada123' }),
    AuthService.AuthError,
  );
});

test('gera JWT de 15 minutos e rejeita assinatura adulterada', () => {
  const token = assinarToken({ id: 10, nome: 'Teste', email: 'teste@email.com' });
  const payload = verificarToken(token);

  assert.equal(payload.exp - payload.iat, 900);
  assert.throws(() => verificarToken(`${token.slice(0, -1)}x`), /Token invalido/);
});

test('executa o CRUD e as consultas de produtos pela Service', () => {
  const donoId = 1;
  const produto = ProdutoService.criar({
    nome: 'Teclado', preco: 250.9, categoria: 'Perifericos', estoque: 10,
  }, donoId);

  assert.equal(ProdutoService.contar(donoId), 1);
  assert.equal(ProdutoService.buscarPorId(produto.id, donoId).nome, 'Teclado');
  assert.equal(ProdutoService.buscarPorNome('Tecla', donoId).length, 1);
  assert.equal(ProdutoService.buscarPorId(produto.id, 999), undefined);

  const atualizado = ProdutoService.atualizar(produto.id, { estoque: 8 }, donoId);
  assert.equal(atualizado.estoque, 8);
  assert.equal(ProdutoService.listarTodos(donoId).length, 1);

  assert.equal(ProdutoService.remover(produto.id, donoId), true);
  assert.equal(ProdutoService.contar(donoId), 0);
});

test('proprietario gerencia colaboradores e gera logs de auditoria', async () => {
  const dono = { id: 1, nome: 'Maria Silva', donoId: 1, papel: 'proprietario' };
  const colaborador = await AuthService.adicionarColaborador(dono, {
    nome: 'Joao Costa', email: 'joao@email.com', senha: 'senha456',
  });

  assert.equal(AuthService.listarColaboradores(1).length, 1);
  const login = await AuthService.entrar({ email: 'joao@email.com', senha: 'senha456' });
  assert.equal(login.usuario.donoId, 1);
  assert.equal(login.usuario.papel, 'colaborador');

  assert.equal(AuthService.removerColaborador(dono, colaborador.id), true);
  await assert.rejects(
    AuthService.entrar({ email: 'joao@email.com', senha: 'senha456' }),
    AuthService.AuthError,
  );

  const logs = AuditoriaService.listar(1);
  assert.deepEqual(logs.map((log) => log.acao), ['REMOVEU', 'ADICIONOU']);
});

test('valida dados obrigatorios do produto', () => {
  assert.throws(
    () => ProdutoService.criar({ nome: '', preco: 0 }),
    ProdutoService.ValidationError,
  );
});

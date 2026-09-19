const ProdutoService = require('../services/ProdutoService');
const AuditoriaService = require('../services/AuditoriaService');

function processarProduto({ tipo, id, dados, contexto }) {
  if (tipo === 'criar') {
    const produto = ProdutoService.criar(dados, contexto.donoId);
    AuditoriaService.registrar(contexto, 'CRIOU', 'PRODUTO', produto.id, produto.nome);
    return produto;
  }

  if (tipo === 'atualizar') {
    const produto = ProdutoService.atualizar(id, dados, contexto.donoId);
    if (!produto) {
      throw new Error('Produto nao encontrado.');
    }
    AuditoriaService.registrar(contexto, 'ATUALIZOU', 'PRODUTO', produto.id, produto.nome);
    return produto;
  }

  if (tipo === 'remover') {
    const produto = ProdutoService.buscarPorId(id, contexto.donoId);
    const removido = ProdutoService.remover(id, contexto.donoId);
    if (!removido) {
      throw new Error('Produto nao encontrado.');
    }
    AuditoriaService.registrar(contexto, 'REMOVEU', 'PRODUTO', Number(id), produto.nome);
    return { removido: true, id: Number(id) };
  }

  throw new Error(`Tipo de job desconhecido: ${tipo}`);
}

module.exports = processarProduto;

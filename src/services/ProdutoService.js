const ProdutoModel = require('../models/ProdutoModel');

class ValidationError extends Error {}

function validar({ nome, preco, categoria, estoque }, { parcial = false } = {}) {
  if (!parcial || nome !== undefined) {
    if (typeof nome !== 'string' || nome.trim().length === 0) {
      throw new ValidationError('"nome" e obrigatorio e deve ser uma string nao vazia.');
    }
  }

  if (!parcial || preco !== undefined) {
    if (typeof preco !== 'number' || Number.isNaN(preco) || preco <= 0) {
      throw new ValidationError('"preco" e obrigatorio e deve ser um numero maior que zero.');
    }
  }

  if (categoria !== undefined && categoria !== null && typeof categoria !== 'string') {
    throw new ValidationError('"categoria" deve ser uma string.');
  }

  if (estoque !== undefined) {
    if (!Number.isInteger(estoque) || estoque < 0) {
      throw new ValidationError('"estoque" deve ser um numero inteiro maior ou igual a zero.');
    }
  }
}

const ProdutoService = {
  ValidationError,

  validarCriacao(dados) {
    validar(dados);
  },

  validarAtualizacao(dados) {
    validar(dados, { parcial: true });
  },

  criar(dados, donoId) {
    validar(dados);
    return ProdutoModel.create(dados, donoId);
  },

  listarTodos(donoId) {
    return ProdutoModel.findAll(donoId);
  },

  buscarPorId(id, donoId) {
    return ProdutoModel.findById(id, donoId);
  },

  buscarPorNome(nome, donoId) {
    if (!nome || nome.trim().length === 0) {
      throw new ValidationError('Informe o parametro "nome" para a busca.');
    }
    return ProdutoModel.findByName(nome, donoId);
  },

  contar(donoId) {
    return ProdutoModel.count(donoId);
  },

  atualizar(id, dados, donoId) {
    validar(dados, { parcial: true });
    return ProdutoModel.update(id, dados, donoId);
  },

  remover(id, donoId) {
    return ProdutoModel.delete(id, donoId);
  },
};

module.exports = ProdutoService;

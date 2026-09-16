const ProdutoModel = require('../models/ProdutoModel');

class ValidationError extends Error {}

function validar({ nome, preco, estoque }, { parcial = false } = {}) {
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

  if (estoque !== undefined) {
    if (!Number.isInteger(estoque) || estoque < 0) {
      throw new ValidationError('"estoque" deve ser um numero inteiro maior ou igual a zero.');
    }
  }
}

const ProdutoService = {
  ValidationError,

  criar(dados) {
    validar(dados);
    return ProdutoModel.create(dados);
  },

  listarTodos() {
    return ProdutoModel.findAll();
  },

  buscarPorId(id) {
    return ProdutoModel.findById(id);
  },

  buscarPorNome(nome) {
    if (!nome || nome.trim().length === 0) {
      throw new ValidationError('Informe o parametro "nome" para a busca.');
    }
    return ProdutoModel.findByName(nome);
  },

  contar() {
    return ProdutoModel.count();
  },

  atualizar(id, dados) {
    validar(dados, { parcial: true });
    return ProdutoModel.update(id, dados);
  },

  remover(id) {
    return ProdutoModel.delete(id);
  },
};

module.exports = ProdutoService;

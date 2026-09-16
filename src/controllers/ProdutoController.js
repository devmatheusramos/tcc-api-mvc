const ProdutoService = require('../services/ProdutoService');

function tratarErro(res, err) {
  if (err instanceof ProdutoService.ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

const ProdutoController = {
  create(req, res) {
    try {
      const produto = ProdutoService.criar(req.body);
      res.status(201).json(produto);
    } catch (err) {
      tratarErro(res, err);
    }
  },

  findAll(req, res) {
    res.json(ProdutoService.listarTodos());
  },

  count(req, res) {
    res.json({ total: ProdutoService.contar() });
  },

  findByName(req, res) {
    try {
      const produtos = ProdutoService.buscarPorNome(req.query.nome);
      res.json(produtos);
    } catch (err) {
      tratarErro(res, err);
    }
  },

  findById(req, res) {
    const produto = ProdutoService.buscarPorId(req.params.id);
    if (!produto) {
      return res.status(404).json({ error: 'Produto nao encontrado.' });
    }
    res.json(produto);
  },

  update(req, res) {
    try {
      const produto = ProdutoService.atualizar(req.params.id, req.body);
      if (!produto) {
        return res.status(404).json({ error: 'Produto nao encontrado.' });
      }
      res.json(produto);
    } catch (err) {
      tratarErro(res, err);
    }
  },

  delete(req, res) {
    const removido = ProdutoService.remover(req.params.id);
    if (!removido) {
      return res.status(404).json({ error: 'Produto nao encontrado.' });
    }
    res.status(204).send();
  },
};

module.exports = ProdutoController;

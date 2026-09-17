const ProdutoService = require('../services/ProdutoService');
const produtoQueue = require('../queue/produtoQueue');

function tratarErro(res, err) {
  if (err instanceof ProdutoService.ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

const ProdutoController = {
  async create(req, res) {
    try {
      const job = await produtoQueue.add('criar', {
        tipo: 'criar', dados: req.body, contexto: req.usuario,
      });
      res.status(200).json({
        jobId: job.id,
        status: 'na fila',
        mensagem: 'Produto sera criado em instantes. Consulte /api/jobs/:id ou atualize a listagem.',
      });
    } catch (err) {
      tratarErro(res, err);
    }
  },

  findAll(req, res) {
    res.json(ProdutoService.listarTodos(req.usuario.donoId));
  },

  count(req, res) {
    res.json({ total: ProdutoService.contar(req.usuario.donoId) });
  },

  findByName(req, res) {
    try {
      const produtos = ProdutoService.buscarPorNome(req.query.nome, req.usuario.donoId);
      res.json(produtos);
    } catch (err) {
      tratarErro(res, err);
    }
  },

  findById(req, res) {
    const produto = ProdutoService.buscarPorId(req.params.id, req.usuario.donoId);
    if (!produto) {
      return res.status(404).json({ error: 'Produto nao encontrado.' });
    }
    res.json(produto);
  },

  async update(req, res) {
    try {
      const job = await produtoQueue.add('atualizar', {
        tipo: 'atualizar',
        id: req.params.id,
        dados: req.body,
        contexto: req.usuario,
      });
      res.status(200).json({
        jobId: job.id,
        status: 'na fila',
        mensagem: 'Atualizacao enviada para processamento.',
      });
    } catch (err) {
      tratarErro(res, err);
    }
  },

  async delete(req, res) {
    try {
      const job = await produtoQueue.add('remover', {
        tipo: 'remover', id: req.params.id, contexto: req.usuario,
      });
      res.status(200).json({
        jobId: job.id,
        status: 'na fila',
        mensagem: 'Remocao enviada para processamento.',
      });
    } catch (err) {
      tratarErro(res, err);
    }
  },
};

module.exports = ProdutoController;

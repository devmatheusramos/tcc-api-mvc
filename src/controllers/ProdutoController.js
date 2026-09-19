const ProdutoService = require('../services/ProdutoService');
const produtoQueue = require('../queue/produtoQueue');

function tratarErro(res, err) {
  if (err instanceof ProdutoService.ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

function produtoNaoEncontrado(res) {
  return res.status(404).json({ error: 'Produto nao encontrado.' });
}

async function enfileirar(res, tipo, dados, mensagem) {
  const job = await produtoQueue.add(tipo, { tipo, ...dados });
  res.status(202).location(`/api/jobs/${job.id}`).json({
    jobId: job.id,
    status: 'na fila',
    mensagem,
  });
}

const ProdutoController = {
  async create(req, res) {
    try {
      ProdutoService.validarCriacao(req.body);
      await enfileirar(
        res,
        'criar',
        { dados: req.body, contexto: req.usuario },
        'Produto sera criado em instantes. Consulte /api/jobs/:id ou atualize a listagem.',
      );
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
    if (!produto) return produtoNaoEncontrado(res);
    res.json(produto);
  },

  async update(req, res) {
    try {
      ProdutoService.validarAtualizacao(req.body);
      if (!ProdutoService.buscarPorId(req.params.id, req.usuario.donoId)) {
        return produtoNaoEncontrado(res);
      }
      await enfileirar(
        res,
        'atualizar',
        { id: req.params.id, dados: req.body, contexto: req.usuario },
        'Atualizacao enviada para processamento.',
      );
    } catch (err) {
      tratarErro(res, err);
    }
  },

  async delete(req, res) {
    try {
      if (!ProdutoService.buscarPorId(req.params.id, req.usuario.donoId)) {
        return produtoNaoEncontrado(res);
      }
      await enfileirar(
        res,
        'remover',
        { id: req.params.id, contexto: req.usuario },
        'Remocao enviada para processamento.',
      );
    } catch (err) {
      tratarErro(res, err);
    }
  },
};

module.exports = ProdutoController;

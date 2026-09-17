const AuthService = require('../services/AuthService');

function tratarErro(res, erro) {
  if (erro instanceof AuthService.ValidationError) {
    return res.status(400).json({ error: erro.message });
  }
  console.error(erro);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

const ColaboradorController = {
  index(req, res) {
    res.json(AuthService.listarColaboradores(req.usuario.donoId));
  },

  async create(req, res) {
    try {
      const colaborador = await AuthService.adicionarColaborador(req.usuario, req.body);
      res.status(201).json(colaborador);
    } catch (erro) {
      tratarErro(res, erro);
    }
  },

  delete(req, res) {
    const removido = AuthService.removerColaborador(req.usuario, Number(req.params.id));
    if (!removido) return res.status(404).json({ error: 'Colaborador nao encontrado.' });
    res.json({ mensagem: 'Colaborador removido.' });
  },
};

module.exports = ColaboradorController;

const AuditoriaModel = require('../models/AuditoriaModel');

const AuditoriaService = {
  registrar(contexto, acao, entidade, entidadeId, detalhes) {
    return AuditoriaModel.create({
      donoId: contexto.donoId,
      usuarioId: contexto.id,
      usuarioNome: contexto.nome,
      acao,
      entidade,
      entidadeId,
      detalhes,
    });
  },

  listar(donoId) {
    return AuditoriaModel.findAll(donoId);
  },
};

module.exports = AuditoriaService;

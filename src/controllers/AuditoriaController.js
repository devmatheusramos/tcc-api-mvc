const AuditoriaService = require('../services/AuditoriaService');

const AuditoriaController = {
  index(req, res) {
    res.json(AuditoriaService.listar(req.usuario.donoId));
  },
};

module.exports = AuditoriaController;

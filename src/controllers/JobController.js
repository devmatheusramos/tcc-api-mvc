const produtoQueue = require('../queue/produtoQueue');

const JobController = {
  async findById(req, res) {
    const job = await produtoQueue.consultar(req.params.id);

    if (!job || job.donoId !== req.usuario.donoId) {
      return res.status(404).json({ error: 'Job nao encontrado.' });
    }

    const { donoId, ...statusPublico } = job;
    return res.json(statusPublico);
  },
};

module.exports = JobController;

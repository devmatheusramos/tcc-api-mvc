const produtoQueue = require('../queue/produtoQueue');

const JobController = {
  async findById(req, res) {
    const job = await produtoQueue.getJob(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job nao encontrado.' });
    }

    const state = await job.getState();

    return res.json({
      jobId: job.id,
      status: state,
      progress: job.progress,
      resultado: job.returnvalue ?? null,
      erro: job.failedReason ?? null,
    });
  },
};

module.exports = JobController;

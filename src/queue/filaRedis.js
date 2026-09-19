const { Queue } = require('bullmq');
const connection = require('../config/redis');

const queue = new Queue('produtos', { connection });

module.exports = {
  async add(nome, dados) {
    const job = await queue.add(nome, dados);
    return { id: job.id };
  },

  async consultar(id) {
    const job = await queue.getJob(id);
    if (!job) return null;

    return {
      jobId: job.id,
      donoId: job.data.contexto?.donoId,
      status: await job.getState(),
      progress: job.progress,
      resultado: job.returnvalue ?? null,
      erro: job.failedReason ?? null,
    };
  },
};

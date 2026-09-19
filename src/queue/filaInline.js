const processarProduto = require('./processarProduto');

const LIMITE_HISTORICO = 1000;
const jobs = new Map();
let proximoId = 1;

module.exports = {
  async add(_nome, dados) {
    const id = String(proximoId++);
    const job = {
      jobId: id,
      donoId: dados.contexto?.donoId,
      status: 'completed',
      progress: 0,
      resultado: null,
      erro: null,
    };

    try {
      job.resultado = processarProduto(dados);
    } catch (erro) {
      job.status = 'failed';
      job.erro = erro.message;
    }

    jobs.set(id, job);
    if (jobs.size > LIMITE_HISTORICO) jobs.delete(jobs.keys().next().value);
    return { id };
  },

  async consultar(id) {
    return jobs.get(String(id)) ?? null;
  },
};

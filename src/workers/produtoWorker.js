const { Worker } = require('bullmq');
const connection = require('../config/redis');
const ProdutoService = require('../services/ProdutoService');

const worker = new Worker(
  'produtos',
  async (job) => {
    const { tipo, id, dados } = job.data;

    if (tipo === 'criar') {
      return ProdutoService.criar(dados);
    }

    if (tipo === 'atualizar') {
      const produto = ProdutoService.atualizar(id, dados);
      if (!produto) {
        throw new Error('Produto nao encontrado.');
      }
      return produto;
    }

    if (tipo === 'remover') {
      const removido = ProdutoService.remover(id);
      if (!removido) {
        throw new Error('Produto nao encontrado.');
      }
      return { removido: true, id: Number(id) };
    }

    throw new Error(`Tipo de job desconhecido: ${tipo}`);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} concluido.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} falhou:`, err.message);
});

console.log('Worker de produtos aguardando jobs...');

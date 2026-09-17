const { Worker } = require('bullmq');
const connection = require('../config/redis');
const ProdutoService = require('../services/ProdutoService');
const AuditoriaService = require('../services/AuditoriaService');

const worker = new Worker(
  'produtos',
  async (job) => {
    const { tipo, id, dados, contexto } = job.data;

    if (tipo === 'criar') {
      const produto = ProdutoService.criar(dados, contexto.donoId);
      AuditoriaService.registrar(contexto, 'CRIOU', 'PRODUTO', produto.id, produto.nome);
      return produto;
    }

    if (tipo === 'atualizar') {
      const produto = ProdutoService.atualizar(id, dados, contexto.donoId);
      if (!produto) {
        throw new Error('Produto nao encontrado.');
      }
      AuditoriaService.registrar(contexto, 'ATUALIZOU', 'PRODUTO', produto.id, produto.nome);
      return produto;
    }

    if (tipo === 'remover') {
      const produto = ProdutoService.buscarPorId(id, contexto.donoId);
      const removido = ProdutoService.remover(id, contexto.donoId);
      if (!removido) {
        throw new Error('Produto nao encontrado.');
      }
      AuditoriaService.registrar(contexto, 'REMOVEU', 'PRODUTO', Number(id), produto.nome);
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

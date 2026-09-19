const { Worker } = require('bullmq');
const connection = require('../config/redis');
const processarProduto = require('../queue/processarProduto');

const worker = new Worker('produtos', (job) => processarProduto(job.data), { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} concluido.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} falhou:`, err.message);
});

console.log('Worker de produtos aguardando jobs...');

const { Queue } = require('bullmq');
const connection = require('../config/redis');

const produtoQueue = new Queue('produtos', { connection });

module.exports = produtoQueue;

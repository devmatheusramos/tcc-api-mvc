const filas = {
  inline: () => require('./filaInline'),
  redis: () => require('./filaRedis'),
};

const modo = process.env.QUEUE_MODE || 'inline';

if (!filas[modo]) {
  throw new Error(`QUEUE_MODE invalido: "${modo}". Use "inline" ou "redis".`);
}

module.exports = filas[modo]();

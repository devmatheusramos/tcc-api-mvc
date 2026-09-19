const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { protegerPagina } = require('./middlewares/auth');

const app = express();

app.use(express.json());
const publicDir = path.join(__dirname, '..', 'public');
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
app.get('/app', protegerPagina, (req, res) => res.sendFile(path.join(publicDir, 'app.html')));
app.get('/app.html', protegerPagina, (req, res) => res.redirect('/app'));
app.use(express.static(publicDir, { index: false }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', apiLimiter, routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

// Erros do body-parser (JSON malformado etc.) tambem respondem em JSON,
// sem expor stack trace.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Corpo da requisicao nao e um JSON valido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisicao grande demais.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

module.exports = app;

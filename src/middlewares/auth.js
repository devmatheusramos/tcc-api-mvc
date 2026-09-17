const { verificarToken } = require('../utils/jwt');

function lerCookies(cabecalho = '') {
  return Object.fromEntries(cabecalho.split(';').filter(Boolean).map((cookie) => {
    const [nome, ...valor] = cookie.trim().split('=');
    return [nome, decodeURIComponent(valor.join('='))];
  }));
}

function obterToken(req) {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  return lerCookies(req.headers.cookie).token;
}

function autenticar(req, res, next) {
  try {
    req.usuario = verificarToken(obterToken(req));
    next();
  } catch (erro) {
    res.status(401).json({ error: 'Autenticacao necessaria.' });
  }
}

function protegerPagina(req, res, next) {
  try {
    req.usuario = verificarToken(obterToken(req));
    next();
  } catch (erro) {
    res.redirect('/');
  }
}

module.exports = { autenticar, protegerPagina };

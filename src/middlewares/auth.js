const { verificarToken } = require('../utils/jwt');
const UsuarioModel = require('../models/UsuarioModel');

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
    const token = verificarToken(obterToken(req));
    const usuario = UsuarioModel.findById(token.sub);
    if (!usuario || !usuario.ativo) throw new Error('Usuario inativo.');
    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      donoId: usuario.dono_id,
      papel: usuario.papel,
    };
    next();
  } catch (erro) {
    res.status(401).json({ error: 'Autenticacao necessaria.' });
  }
}

function protegerPagina(req, res, next) {
  try {
    const token = verificarToken(obterToken(req));
    const usuario = UsuarioModel.findById(token.sub);
    if (!usuario || !usuario.ativo) throw new Error('Usuario inativo.');
    req.usuario = usuario;
    next();
  } catch (erro) {
    res.redirect('/');
  }
}

function somenteProprietario(req, res, next) {
  if (req.usuario.papel !== 'proprietario') {
    return res.status(403).json({ error: 'Apenas o proprietario pode gerenciar colaboradores.' });
  }
  next();
}

module.exports = { autenticar, protegerPagina, somenteProprietario };

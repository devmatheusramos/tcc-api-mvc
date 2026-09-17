const AuthService = require('../services/AuthService');
const { TOKEN_TTL_SECONDS } = require('../utils/jwt');

function definirCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TOKEN_TTL_SECONDS}${secure}`,
  );
}

function responderErro(res, erro) {
  if (erro instanceof AuthService.ValidationError) {
    return res.status(400).json({ error: erro.message });
  }
  if (erro instanceof AuthService.AuthError) {
    return res.status(401).json({ error: erro.message });
  }
  console.error(erro);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

const AuthController = {
  async register(req, res) {
    try {
      const resultado = await AuthService.cadastrar(req.body);
      definirCookie(res, resultado.token);
      res.status(201).json({ usuario: resultado.usuario, token: resultado.token });
    } catch (erro) {
      responderErro(res, erro);
    }
  },

  async login(req, res) {
    try {
      const resultado = await AuthService.entrar(req.body);
      definirCookie(res, resultado.token);
      res.json({ usuario: resultado.usuario, token: resultado.token });
    } catch (erro) {
      responderErro(res, erro);
    }
  },

  logout(req, res) {
    res.setHeader('Set-Cookie', 'token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.json({ mensagem: 'Sessao encerrada.' });
  },

  me(req, res) {
    res.json({ usuario: req.usuario });
  },
};

module.exports = AuthController;

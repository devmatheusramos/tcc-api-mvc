const crypto = require('crypto');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET e obrigatorio em producao.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'desenvolvimento-troque-esta-chave';
const TOKEN_TTL_SECONDS = 60 * 15;

function base64url(valor) {
  return Buffer.from(valor).toString('base64url');
}

function assinarToken(usuario) {
  const agora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    sub: String(usuario.id),
    nome: usuario.nome,
    email: usuario.email,
    donoId: usuario.donoId ?? usuario.dono_id ?? usuario.id,
    papel: usuario.papel ?? 'proprietario',
    iat: agora,
    exp: agora + TOKEN_TTL_SECONDS,
  }));
  const assinatura = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${assinatura}`;
}

function verificarToken(token) {
  if (!token) throw new Error('Token ausente.');

  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('Token invalido.');

  const [header, payload, assinatura] = partes;
  // Compara o texto base64url, nao os bytes decodificados: o ultimo caractere
  // carrega bits de preenchimento, e decodificar aceitaria codificacoes alternativas.
  const assinaturaEsperada = Buffer.from(crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url'));
  const assinaturaRecebida = Buffer.from(assinatura);

  if (
    assinaturaRecebida.length !== assinaturaEsperada.length
    || !crypto.timingSafeEqual(assinaturaRecebida, assinaturaEsperada)
  ) {
    throw new Error('Token invalido.');
  }

  const dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!dados.exp || dados.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expirado.');
  }

  return dados;
}

module.exports = { assinarToken, verificarToken, TOKEN_TTL_SECONDS };

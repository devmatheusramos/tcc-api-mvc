const crypto = require('crypto');
const { promisify } = require('util');
const UsuarioModel = require('../models/UsuarioModel');
const { assinarToken } = require('../utils/jwt');
const AuditoriaService = require('./AuditoriaService');

const scrypt = promisify(crypto.scrypt);

class AuthError extends Error {}
class ValidationError extends Error {}

async function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(senha, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function conferirSenha(senha, senhaHash) {
  const [salt, hashHex] = senhaHash.split(':');
  const hashSalvo = Buffer.from(hashHex, 'hex');
  const hashInformado = await scrypt(senha, salt, 64);
  return crypto.timingSafeEqual(hashSalvo, hashInformado);
}

function validarDados({ nome, email, senha }, cadastro = false) {
  if (cadastro && (typeof nome !== 'string' || nome.trim().length < 2)) {
    throw new ValidationError('Informe um nome com pelo menos 2 caracteres.');
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    throw new ValidationError('Informe um e-mail valido.');
  }
  if (typeof senha !== 'string' || senha.length < 6) {
    throw new ValidationError('A senha deve ter pelo menos 6 caracteres.');
  }
}

const AuthService = {
  AuthError,
  ValidationError,

  async cadastrar(dados) {
    validarDados(dados, true);
    const email = dados.email.trim().toLowerCase();
    if (UsuarioModel.findByEmail(email)) {
      throw new ValidationError('Este e-mail ja esta cadastrado.');
    }

    const usuario = UsuarioModel.create({
      nome: dados.nome.trim(),
      email,
      senhaHash: await gerarHash(dados.senha),
    });
    return { usuario, token: assinarToken(usuario) };
  },

  async entrar({ email, senha }) {
    validarDados({ email, senha });
    const usuario = UsuarioModel.findByEmail(email.trim().toLowerCase());
    if (!usuario || !usuario.ativo || !(await conferirSenha(senha, usuario.senha_hash))) {
      throw new AuthError('E-mail ou senha incorretos.');
    }

    const dadosPublicos = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      donoId: usuario.dono_id,
      papel: usuario.papel,
    };
    return { usuario: dadosPublicos, token: assinarToken(dadosPublicos) };
  },

  listarColaboradores(donoId) {
    return UsuarioModel.findColaboradores(donoId);
  },

  async adicionarColaborador(dono, dados) {
    validarDados(dados, true);
    const email = dados.email.trim().toLowerCase();
    if (UsuarioModel.findByEmail(email)) {
      throw new ValidationError('Este e-mail ja esta cadastrado.');
    }

    const colaborador = UsuarioModel.create({
      nome: dados.nome.trim(),
      email,
      senhaHash: await gerarHash(dados.senha),
      donoId: dono.donoId,
      papel: 'colaborador',
    });
    AuditoriaService.registrar(
      dono,
      'ADICIONOU',
      'COLABORADOR',
      colaborador.id,
      `${colaborador.nome} (${colaborador.email})`,
    );
    return colaborador;
  },

  removerColaborador(dono, id) {
    const colaborador = UsuarioModel.findById(id);
    if (!colaborador || colaborador.dono_id !== dono.donoId || colaborador.papel !== 'colaborador') {
      return false;
    }
    const removido = UsuarioModel.desativarColaborador(id, dono.donoId);
    if (removido) {
      AuditoriaService.registrar(
        dono,
        'REMOVEU',
        'COLABORADOR',
        colaborador.id,
        `${colaborador.nome} (${colaborador.email})`,
      );
    }
    return removido;
  },
};

module.exports = AuthService;

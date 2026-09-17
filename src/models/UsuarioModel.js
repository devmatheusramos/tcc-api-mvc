const db = require('../config/database');

const UsuarioModel = {
  create({ nome, email, senhaHash, donoId = null, papel = 'proprietario' }) {
    const info = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, dono_id, papel)
      VALUES (?, ?, ?, ?, ?)
    `).run(nome, email, senhaHash, donoId, papel);

    if (!donoId) {
      db.prepare('UPDATE usuarios SET dono_id = id WHERE id = ?').run(info.lastInsertRowid);
    }

    return this.findById(info.lastInsertRowid);
  },

  findById(id) {
    return db.prepare(`
      SELECT id, nome, email, dono_id, papel, ativo, criado_em FROM usuarios WHERE id = ?
    `).get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  },

  findColaboradores(donoId) {
    return db.prepare(`
      SELECT id, nome, email, papel, ativo, criado_em
      FROM usuarios
      WHERE dono_id = ? AND papel = 'colaborador' AND ativo = 1
      ORDER BY nome
    `).all(donoId);
  },

  desativarColaborador(id, donoId) {
    const info = db.prepare(`
      UPDATE usuarios SET ativo = 0
      WHERE id = ? AND dono_id = ? AND papel = 'colaborador'
    `).run(id, donoId);
    return info.changes > 0;
  },
};

module.exports = UsuarioModel;

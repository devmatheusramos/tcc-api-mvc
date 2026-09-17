const db = require('../config/database');

const UsuarioModel = {
  create({ nome, email, senhaHash }) {
    const info = db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash)
      VALUES (?, ?, ?)
    `).run(nome, email, senhaHash);

    return this.findById(info.lastInsertRowid);
  },

  findById(id) {
    return db.prepare(`
      SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?
    `).get(id);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  },
};

module.exports = UsuarioModel;

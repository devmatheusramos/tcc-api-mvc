const db = require('../config/database');

const AuditoriaModel = {
  create({ donoId, usuarioId, usuarioNome, acao, entidade, entidadeId = null, detalhes = null }) {
    const info = db.prepare(`
      INSERT INTO logs_auditoria
        (dono_id, usuario_id, usuario_nome, acao, entidade, entidade_id, detalhes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(donoId, usuarioId, usuarioNome, acao, entidade, entidadeId, detalhes);
    return info.lastInsertRowid;
  },

  findAll(donoId) {
    return db.prepare(`
      SELECT id, usuario_id, usuario_nome, acao, entidade, entidade_id, detalhes, criado_em
      FROM logs_auditoria
      WHERE dono_id = ?
      ORDER BY id DESC
      LIMIT 200
    `).all(donoId);
  },
};

module.exports = AuditoriaModel;

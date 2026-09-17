const db = require('../config/database');

const ProdutoModel = {
  create({ nome, preco, categoria, estoque }, donoId) {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, preco, categoria, estoque, dono_id)
      VALUES (@nome, @preco, @categoria, @estoque, @donoId)
    `);
    const info = stmt.run({ nome, preco, categoria: categoria ?? null, estoque: estoque ?? 0, donoId });
    return this.findById(info.lastInsertRowid, donoId);
  },

  findAll(donoId) {
    return db.prepare('SELECT * FROM produtos WHERE dono_id = ? ORDER BY id').all(donoId);
  },

  findById(id, donoId) {
    return db.prepare('SELECT * FROM produtos WHERE id = ? AND dono_id = ?').get(id, donoId);
  },

  findByName(nome, donoId) {
    return db.prepare('SELECT * FROM produtos WHERE nome LIKE ? AND dono_id = ? ORDER BY id').all(`%${nome}%`, donoId);
  },

  count(donoId) {
    const row = db.prepare('SELECT COUNT(*) AS total FROM produtos WHERE dono_id = ?').get(donoId);
    return row.total;
  },

  update(id, { nome, preco, categoria, estoque }, donoId) {
    const atual = this.findById(id, donoId);
    if (!atual) return null;

    db.prepare(`
      UPDATE produtos
      SET nome = @nome, preco = @preco, categoria = @categoria, estoque = @estoque
      WHERE id = @id AND dono_id = @donoId
    `).run({
      id,
      donoId,
      nome: nome ?? atual.nome,
      preco: preco ?? atual.preco,
      categoria: categoria ?? atual.categoria,
      estoque: estoque ?? atual.estoque,
    });

    return this.findById(id, donoId);
  },

  delete(id, donoId) {
    const info = db.prepare('DELETE FROM produtos WHERE id = ? AND dono_id = ?').run(id, donoId);
    return info.changes > 0;
  },
};

module.exports = ProdutoModel;

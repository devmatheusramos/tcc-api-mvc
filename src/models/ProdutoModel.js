const db = require('../config/database');

const ProdutoModel = {
  create({ nome, preco, categoria, estoque }) {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, preco, categoria, estoque)
      VALUES (@nome, @preco, @categoria, @estoque)
    `);
    const info = stmt.run({ nome, preco, categoria: categoria ?? null, estoque: estoque ?? 0 });
    return this.findById(info.lastInsertRowid);
  },

  findAll() {
    return db.prepare('SELECT * FROM produtos ORDER BY id').all();
  },

  findById(id) {
    return db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  },

  findByName(nome) {
    return db.prepare('SELECT * FROM produtos WHERE nome LIKE ? ORDER BY id').all(`%${nome}%`);
  },

  count() {
    const row = db.prepare('SELECT COUNT(*) AS total FROM produtos').get();
    return row.total;
  },

  update(id, { nome, preco, categoria, estoque }) {
    const atual = this.findById(id);
    if (!atual) return null;

    db.prepare(`
      UPDATE produtos
      SET nome = @nome, preco = @preco, categoria = @categoria, estoque = @estoque
      WHERE id = @id
    `).run({
      id,
      nome: nome ?? atual.nome,
      preco: preco ?? atual.preco,
      categoria: categoria ?? atual.categoria,
      estoque: estoque ?? atual.estoque,
    });

    return this.findById(id);
  },

  delete(id) {
    const info = db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
    return info.changes > 0;
  },
};

module.exports = ProdutoModel;

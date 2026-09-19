const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'tcc.sqlite');
const db = new DatabaseSync(dbPath);

// API e worker escrevem no mesmo arquivo: espera o lock em vez de falhar na hora.
db.exec('PRAGMA busy_timeout = 5000');
db.exec('PRAGMA journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    categoria TEXT,
    estoque INTEGER NOT NULL DEFAULT 0,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function adicionarColunaSeNecessario(tabela, coluna, definicao) {
  const colunas = db.prepare(`PRAGMA table_info(${tabela})`).all();
  if (!colunas.some((item) => item.name === coluna)) {
    try {
      db.exec(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${definicao}`);
    } catch (erro) {
      if (!erro.message.includes('duplicate column name')) throw erro;
    }
  }
}

adicionarColunaSeNecessario('usuarios', 'dono_id', 'INTEGER REFERENCES usuarios(id)');
adicionarColunaSeNecessario('usuarios', 'papel', "TEXT NOT NULL DEFAULT 'proprietario'");
adicionarColunaSeNecessario('usuarios', 'ativo', 'INTEGER NOT NULL DEFAULT 1');
adicionarColunaSeNecessario('produtos', 'dono_id', 'INTEGER REFERENCES usuarios(id)');

db.exec(`
  UPDATE usuarios SET dono_id = id WHERE dono_id IS NULL;
  UPDATE produtos
  SET dono_id = (SELECT MIN(id) FROM usuarios)
  WHERE dono_id IS NULL AND EXISTS (SELECT 1 FROM usuarios);

  CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dono_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    usuario_nome TEXT NOT NULL,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id INTEGER,
    detalhes TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;

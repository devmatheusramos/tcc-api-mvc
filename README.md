# API REST de Produtos — MVC (TCC Arquitetura de Software)

API RESTful de CRUD de Produtos, construída em Node.js + Express seguindo o
padrão **MVC + Service**, com persistência real em **SQLite**.

Exercício de conclusão de curso: pós-graduação em Arquitetura de Software.

## Arquitetura

Desenho completo (C4 + diagrama de sequência + diagrama de classes) em
[`docs/architecture.md`](docs/architecture.md).

## Estrutura de pastas

```
src/
├── config/database.js       # conexão com o SQLite + criação da tabela
├── models/ProdutoModel.js   # acesso a dados (SQL) — sem regra de negócio
├── services/ProdutoService.js # validação e regras de negócio
├── controllers/ProdutoController.js # camada HTTP (req/res, status codes)
├── routes/                  # mapeamento de rotas -> controllers
└── app.js                   # configuração do Express
server.js                    # ponto de entrada (sobe o servidor)
data/tcc.sqlite               # arquivo do banco (gerado automaticamente)
docs/architecture.md         # diagramas de arquitetura
Dockerfile / docker-compose.yml # empacota a API para rodar em container
```

| Camada         | Responsabilidade                                                                      |
| -------------- | ------------------------------------------------------------------------------------- |
| **Routes**     | Mapeia `metodo + path` para uma função do Controller.                                 |
| **Controller** | Lê a requisição HTTP, chama a Service, devolve status code + JSON. Não sabe SQL.      |
| **Service**    | Validação e regra de negócio (ex.: preço deve ser > 0). Não sabe o que é `req`/`res`. |
| **Model**      | Única camada que fala com o banco (SQLite). Sem regra de negócio.                     |

## Como rodar

### Com Docker (recomendado)

```bash
docker compose up --build
```

Servidor sobe em `http://localhost:3000`. O arquivo `data/tcc.sqlite` fica
mapeado como volume na pasta `data/` do host, então os dados persistem entre
`docker compose down` / `up`.

### Sem Docker

```bash
npm install
npm run dev      # com nodemon (reinicia sozinho)
# ou
npm start
```

Requer **Node.js >= 22.5** (usa o módulo nativo `node:sqlite`). Servidor sobe
em `http://localhost:3000`. O banco SQLite é criado automaticamente em
`data/tcc.sqlite` na primeira execução.

## Endpoints

Base: `/api/produtos`

| Método | Rota                            | Descrição                                     | Body                                                                 |
| ------ | ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| POST   | `/api/produtos`                 | Cria um produto                               | `{ "nome": "...", "preco": 10.5, "categoria": "...", "estoque": 5 }` |
| GET    | `/api/produtos`                 | Lista todos os produtos                       | —                                                                    |
| GET    | `/api/produtos/count`           | Retorna o total de registros                  | —                                                                    |
| GET    | `/api/produtos/search?nome=xyz` | Busca produtos por nome (parcial)             | —                                                                    |
| GET    | `/api/produtos/:id`             | Busca um produto por ID                       | —                                                                    |
| PUT    | `/api/produtos/:id`             | Atualiza um produto (campos parciais aceitos) | `{ "nome": "...", "preco": 12 }`                                     |
| DELETE | `/api/produtos/:id`             | Remove um produto                             | —                                                                    |

`categoria` e `estoque` são opcionais na criação (`estoque` default `0`).

## Exemplos (curl)

```bash
# Criar
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teclado Mecanico","preco":250.90,"categoria":"Perifericos","estoque":10}'

# Listar todos
curl http://localhost:3000/api/produtos

# Contar
curl http://localhost:3000/api/produtos/count

# Buscar por nome
curl "http://localhost:3000/api/produtos/search?nome=teclado"

# Buscar por ID
curl http://localhost:3000/api/produtos/1

# Atualizar
curl -X PUT http://localhost:3000/api/produtos/1 \
  -H "Content-Type: application/json" \
  -d '{"estoque":8}'

# Remover
curl -X DELETE http://localhost:3000/api/produtos/1
```

## Persistência

Dados são gravados em `data/tcc.sqlite` via [`node:sqlite`](https://nodejs.org/api/sqlite.html),
o módulo de SQLite **nativo do Node.js** (>= 22.5) — API síncrona, sem
callbacks/promises, e sem nenhuma dependência externa ou compilação nativa. O arquivo `.sqlite` não é versionado (está no `.gitignore`).

O Node imprime um aviso `ExperimentalWarning: SQLite is an experimental
feature` ao iniciar — é esperado, não é um erro; a API já é estável o
suficiente para uso e não requer nenhuma flag.

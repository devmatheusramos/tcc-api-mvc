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
├── config/swagger.js        # configuração do OpenAPI/Swagger
├── models/ProdutoModel.js   # acesso a dados (SQL) — sem regra de negócio
├── services/ProdutoService.js # validação e regras de negócio
├── controllers/ProdutoController.js # camada HTTP (req/res, status codes)
├── routes/                  # mapeamento de rotas -> controllers (com anotações OpenAPI)
└── app.js                   # configuração do Express
public/                      # frontend estático (HTML/CSS/JS puro) que consome a API
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

Defina `JWT_SECRET` com uma chave longa e aleatoria no ambiente antes de usar
o sistema fora do desenvolvimento.

O Compose sobe três serviços:

- `api`: Express + frontend + Swagger em `http://localhost:3000`;
- `worker`: consumidor da fila BullMQ que processa criação, edição e remoção;
- `redis`: broker usado pela fila.

O arquivo `data/tcc.sqlite` fica mapeado como volume na pasta `data/` do host,
então os dados persistem entre `docker compose down` / `up`.

### Sem Docker

```bash
npm install
npm run dev      # com nodemon (reinicia sozinho)
# ou
npm start
```

Para testar a fila sem Docker, também é necessário ter Redis rodando e iniciar
o worker em outro terminal:

```bash
npm run worker
```

Requer **Node.js >= 22.5** (usa o módulo nativo `node:sqlite`). Servidor sobe
em `http://localhost:3000`. O banco SQLite é criado automaticamente em
`data/tcc.sqlite` na primeira execução.

## Endpoints

Base: `/api/produtos`

As rotas de produtos e jobs exigem um JWT valido. O login grava o token em
cookie `HttpOnly` com validade de 15 minutos; clientes externos tambem podem
enviar `Authorization: Bearer <token>`.

| Metodo | Rota                 | Descricao                        |
| ------ | -------------------- | -------------------------------- |
| POST   | `/api/auth/register` | Cria uma conta e inicia a sessao |
| POST   | `/api/auth/login`    | Autentica e devolve um JWT       |
| GET    | `/api/auth/me`       | Retorna o usuario autenticado    |
| POST   | `/api/auth/logout`   | Encerra a sessao                 |

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

As rotas `POST`, `PUT` e `DELETE` respondem `200` rapidamente com um `jobId`.
O processamento real acontece no worker. Para consultar o andamento:

```bash
curl http://localhost:3000/api/jobs/1
```

Possíveis estados comuns: `waiting`, `active`, `completed` e `failed`.

## Documentação da API (Swagger)

A documentação interativa (OpenAPI 3.0) fica disponível em
`http://localhost:3000/api-docs` assim que o servidor sobe — dá pra ver todos
os endpoints, os schemas de `Produto` e testar as requisições direto pelo
navegador.

## Frontend

Existe um frontend simples (HTML + CSS + JavaScript puro, sem framework nem
build step) em `public/`, servido pelo próprio Express na raiz
(`http://localhost:3000/`). A pagina inicial apresenta o sistema e permite
entrar ou criar uma conta. A area protegida em `/app` consome a API para:

- listar e buscar produtos por nome;
- cadastrar um novo produto;
- editar e remover um produto existente;
- mostrar o total de produtos cadastrados;
- acompanhar por polling o status dos jobs enviados para a fila.

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

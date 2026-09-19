# StockFlow - API REST MVC de Produtos

Projeto do desafio final de Arquitetura de Software: API REST de produtos em
Node.js e Express, no padrao MVC + Service, com persistencia em SQLite,
autenticacao JWT, colaboradores, auditoria e escritas assincronas com
BullMQ e Redis. Usando a mesma estrutura de governança e tickets que uso no meu sistema Nobreak. Veja em app.nobreak.cloud. É meu saas que estou validando.

## Onde esta a documentacao

| O que                     | Onde                                                   |
| ------------------------- | ------------------------------------------------------ |
| Arquitetura (C4)          | [`docs/c4-containers.pdf`](docs/c4-containers.pdf)     |
| Componentes MVC           | [`docs/componentes-mvc.pdf`](docs/componentes-mvc.pdf) |
| Decisoes arquiteturais    | [`docs/adr/`](docs/adr/)                               |
| Governanca e tickets      | [`docs/governance.md`](docs/governance.md)             |
| Contrato da API (Swagger) | `http://localhost:3000/api-docs`                       |

## Estrutura

```text
src/
|-- config/          # SQLite, Redis e Swagger
|-- routes/          # Endpoints, OpenAPI e autorizacao
|-- controllers/     # Traduz HTTP em chamadas de Service
|-- services/        # Validacoes e regras de negocio
|-- models/          # Acesso SQL (produtos, usuarios, auditoria)
|-- middlewares/     # JWT, autorizacao e rate limit
|-- queue/           # Fila de escritas (inline ou BullMQ/Redis)
|-- workers/         # Consumidor da fila
|-- utils/           # Assinatura e verificacao do JWT
`-- app.js           # Configuracao do Express
public/              # View: dashboard e area autenticada
test/                # Testes de servicos e da API HTTP
docs/                # Diagramas, ADRs e governanca
server.js            # Ponto de entrada
```

Fluxo: `View -> Routes -> Controller -> Service -> Model -> SQLite`.

## Endpoints

Rotas de `/api/produtos` e `/api/jobs` exigem login (JWT em cookie `HttpOnly`
ou `Authorization: Bearer`). Cada proprietario ve apenas os proprios dados.

| Metodo | Rota                     | Funcao                                |
| ------ | ------------------------ | ------------------------------------- |
| POST   | `/api/auth/register`     | Cria proprietario e inicia a sessao   |
| POST   | `/api/auth/login`        | Autentica e devolve o JWT (15 min)    |
| POST   | `/api/auth/logout`       | Encerra a sessao                      |
| GET    | `/api/auth/me`           | Usuario logado                        |
| GET    | `/api/produtos`          | Lista todos                           |
| GET    | `/api/produtos/count`    | Conta os registros                    |
| GET    | `/api/produtos/search`   | Busca por nome com `?nome=`           |
| GET    | `/api/produtos/:id`      | Busca por ID                          |
| POST   | `/api/produtos`          | Cria (responde `202` com `jobId`)     |
| PUT    | `/api/produtos/:id`      | Atualiza (responde `202` com `jobId`) |
| DELETE | `/api/produtos/:id`      | Remove (responde `202` com `jobId`)   |
| GET    | `/api/jobs/:id`          | Status do job (`Location` da escrita) |
| GET    | `/api/colaboradores`     | Lista membros (so proprietario)       |
| POST   | `/api/colaboradores`     | Cria membro (so proprietario)         |
| DELETE | `/api/colaboradores/:id` | Remove membro (so proprietario)       |
| GET    | `/api/logs`              | Atividades recentes                   |

Escritas de produtos validam os dados, respondem `202` e sao processadas pela
fila; o cliente acompanha o resultado em `/api/jobs/:id`.

## Executar

Com Docker (API, worker e Redis):

```bash
docker compose up --build -d
```

Sem Docker (Node.js 22.13 ou superior, sem Redis):

```bash
npm install
npm run dev
```

Interface em `http://localhost:3000`. Testes com `npm test`.

| Variavel                   | Padrao              | Funcao                                       |
| -------------------------- | ------------------- | -------------------------------------------- |
| `PORT`                     | `3000`              | Porta da API                                 |
| `JWT_SECRET`               | de desenv.          | Chave do JWT; obrigatoria em producao        |
| `QUEUE_MODE`               | `inline`            | `inline` (sem Redis) ou `redis` (com worker) |
| `REDIS_HOST`, `REDIS_PORT` | `127.0.0.1`, `6379` | Conexao do Redis no modo `redis`             |
| `DATA_DIR`                 | `./data`            | Pasta do arquivo SQLite                      |

## Decisoes arquiteturais (ADR)

As decisoes relevantes ficam registradas em [`docs/adr/`](docs/adr/), uma por
arquivo, com contexto, decisao e consequencias:

- [ADR 001](docs/adr/001-fila-assincrona.md): escritas de produtos passam por
  uma fila BullMQ/Redis processada por um worker. A fila fica atras de uma
  interface unica (`add` e `consultar`), com o modo `inline` para rodar e
  testar sem Redis.
- [ADR 002](docs/adr/002-contas-e-auditoria.md): usuarios tem papel de
  proprietario ou colaborador, compartilham um espaco (`dono_id`) e todas as
  alteracoes geram auditoria.

Novas decisoes usam o modelo em [`docs/adr/template.md`](docs/adr/template.md).

## Tickets e governanca

Toda mudanca comeca em um ticket (defeito ou melhoria, com prioridade e
criterios de aceite) e segue o fluxo
`Backlog -> Pronto -> Em andamento -> Em revisao -> Concluido`. O processo
completo e a Definition of Done estao em
[`docs/governance.md`](docs/governance.md).

- Formularios de ticket: [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/)
- Checklist de pull request: [`.github/pull_request_template.md`](.github/pull_request_template.md)
- CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda `npm test` a
  cada push e pull request.

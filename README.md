# StockFlow - API REST MVC de Produtos

Projeto do desafio final de Arquitetura de Software. O StockFlow e uma API
REST em Node.js e Express, organizada em MVC + Service, com frontend proprio,
persistencia SQLite, autenticacao JWT, colaboradores, auditoria e escritas
assincronas com BullMQ e Redis.

## Funcionalidades

- CRUD, contagem, busca por ID, nome e listagem de produtos;
- cadastro e login com JWT de 15 minutos;
- senhas protegidas com `scrypt` e salt individual;
- contas de colaboradores vinculadas ao proprietario;
- isolamento dos produtos e jobs por proprietario;
- auditoria de alteracoes em produtos e colaboradores;
- fila para criar, atualizar e remover produtos;
- polling do status dos jobs no frontend;
- rate limit nas rotas da API;
- contrato OpenAPI e interface Swagger;
- testes automatizados com o runner nativo do Node.js;
- execucao completa com Docker Compose.

## Arquitetura

Os diagramas C4, sequencias de login/fila e modelo de dominio estao em
[`docs/architecture.md`](docs/architecture.md). As decisoes arquiteturais ficam
em [`docs/adr/`](docs/adr/).

Fluxo principal das camadas:

```text
Routes -> Controller -> Service -> Model -> SQLite
```

- **Routes:** endpoints, autenticacao e autorizacao.
- **Controller:** traduz requisicoes e respostas HTTP.
- **Service:** validacoes e regras de negocio.
- **Model:** acesso SQL e persistencia.
- **Worker:** consome jobs e reutiliza Service/Model para as escritas.

## Estrutura

```text
src/
|-- config/          # SQLite, Redis e Swagger
|-- controllers/     # HTTP de auth, produtos, jobs, equipe e logs
|-- middlewares/     # JWT, autorizacao e rate limit
|-- models/          # Produtos, usuarios e auditoria
|-- queue/           # Fila BullMQ de produtos
|-- routes/          # Endpoints e anotacoes OpenAPI
|-- services/        # Regras de negocio
|-- utils/           # Assinatura e verificacao JWT
|-- workers/         # Consumidor da fila
|-- app.js           # Configuracao do Express
public/              # Dashboard, area protegida e JavaScript do frontend
test/                # Testes com SQLite temporario
docs/                # Arquitetura, governanca e ADRs
.github/             # Templates de tickets e pull requests
data/.gitkeep        # Mantem a pasta; o banco e criado em execucao
docker-compose.yml   # API, worker e Redis
Dockerfile           # Imagem Node.js da API e do worker
server.js            # Ponto de entrada
```

## Executar com Docker

Use uma chave longa e aleatoria em `JWT_SECRET` fora do desenvolvimento. O
Compose possui um valor local apenas para facilitar a avaliacao.

```bash
docker compose up --build -d
docker compose ps
```

Servicos iniciados:

- `api`: frontend, REST e Swagger em `http://localhost:3000`;
- `worker`: processamento assincrono dos produtos;
- `redis`: armazenamento da fila na porta `6379`.

O SQLite e criado automaticamente em `data/tcc.sqlite` e persiste no host. Para
encerrar os containers sem apagar os dados:

```bash
docker compose down
```

## Executar sem Docker

Requer Node.js 22.5 ou superior e um Redis acessivel localmente.

```bash
npm install
npm run dev
```

Em outro terminal:

```bash
npm run worker
```

## Interfaces

- Dashboard e login: `http://localhost:3000/`
- Area autenticada: `http://localhost:3000/app`
- Swagger: `http://localhost:3000/api-docs`

A area autenticada possui as abas **Produtos**, **Equipe** e **Logs**. A aba
Equipe aparece apenas para o proprietario. Colaboradores podem operar produtos
e consultar o historico, mas nao podem criar ou remover outros membros.

## Autenticacao e seguranca

O login devolve um JWT e tambem o grava em cookie `HttpOnly` com
`SameSite=Strict`. O token expira em 15 minutos. Clientes de API podem usar o
cabecalho `Authorization: Bearer <token>`.

Rotas publicas:

| Metodo | Rota                 | Funcao                                  |
| ------ | -------------------- | --------------------------------------- |
| POST   | `/api/auth/register` | Cria um proprietario e inicia a sessao  |
| POST   | `/api/auth/login`    | Autentica e devolve o JWT               |
| POST   | `/api/auth/logout`   | Remove o cookie da sessao               |

Rotas protegidas:

| Metodo | Rota                       | Funcao                                  |
| ------ | -------------------------- | --------------------------------------- |
| GET    | `/api/auth/me`             | Usuario, papel e proprietario da conta  |
| GET    | `/api/produtos`            | Lista os produtos                       |
| GET    | `/api/produtos/count`      | Conta os produtos                       |
| GET    | `/api/produtos/search`     | Busca por nome com `?nome=`             |
| GET    | `/api/produtos/:id`        | Busca um produto por ID                 |
| POST   | `/api/produtos`            | Enfileira a criacao                     |
| PUT    | `/api/produtos/:id`        | Enfileira a atualizacao                 |
| DELETE | `/api/produtos/:id`        | Enfileira a remocao                     |
| GET    | `/api/jobs/:id`            | Consulta um job do mesmo proprietario   |
| GET    | `/api/colaboradores`       | Lista membros; somente proprietario     |
| POST   | `/api/colaboradores`       | Cria membro; somente proprietario       |
| DELETE | `/api/colaboradores/:id`   | Remove membro; somente proprietario     |
| GET    | `/api/logs`                | Lista ate 200 atividades recentes       |

## Fila e polling

`POST`, `PUT` e `DELETE` de produtos respondem `200` com um `jobId`. O worker
processa o job e registra a auditoria. Estados comuns: `waiting`, `active`,
`completed` e `failed`. O frontend consulta `/api/jobs/:id` a cada 700 ms.

## Auditoria

Os logs registram o usuario, a acao, a entidade, o identificador, detalhes e o
horario. Sao auditados:

- criacao, atualizacao e remocao de produtos;
- adicao e remocao de colaboradores.

Cada proprietario e seus colaboradores enxergam apenas os logs do proprio
espaco. Um colaborador removido e marcado como inativo, e o middleware rejeita
seu acesso mesmo que o JWT ainda nao tenha expirado.

## Exemplo de uso

O exemplo abaixo usa um arquivo temporario de cookies para manter a sessao:

```bash
# Criar proprietario e autenticar
curl -c cookies.txt -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","senha":"senha123"}'

# Enfileirar um produto
curl -b cookies.txt -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teclado","preco":250.90,"categoria":"Perifericos","estoque":10}'

# Consultar o job retornado
curl -b cookies.txt http://localhost:3000/api/jobs/1

# Consultar atividades
curl -b cookies.txt http://localhost:3000/api/logs
```

## Testes

```bash
npm test
```

Os testes usam um SQLite temporario e cobrem cadastro, login, senha incorreta,
JWT de 15 minutos, token adulterado, CRUD, isolamento de produtos, gestao de
colaboradores, bloqueio de acesso e auditoria.

## Governanca e documentacao viva

O fluxo de tickets, prioridades e Definition of Done esta em
[`docs/governance.md`](docs/governance.md). Formularios de defeito e melhoria
ficam em `.github/ISSUE_TEMPLATE/`, e o checklist de revisao fica em
`.github/pull_request_template.md`.

Arquitetura, Swagger, README, testes e ADRs vivem no mesmo repositorio do
codigo. Uma mudanca so e concluida quando essas fontes continuam coerentes com
o comportamento entregue. Eu uso esse mesmo modelo em um projeto de uma
startup que estou fundando.

## Persistencia

O projeto usa `node:sqlite`, modulo nativo e ainda experimental no Node.js 22.
O aviso `ExperimentalWarning` durante testes ou inicializacao e esperado. O
arquivo `data/tcc.sqlite` e seus arquivos WAL nao sao versionados.

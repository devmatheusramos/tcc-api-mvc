# Arquitetura - API REST de Produtos

Os diagramas usam Mermaid e sao renderizados diretamente pelo GitHub. O foco
e mostrar a solucao de forma simples: uma API MVC protegida por autenticacao e
uma fila para processar alteracoes nos produtos.

## 1. C4 - Contexto

```mermaid
C4Context
    title Contexto do StockFlow

    Person(usuario, "Usuario", "Gerencia produtos pelo frontend ou consome a API")
    System(sistema, "StockFlow", "API REST MVC e frontend de gestao de produtos")
    System_Ext(redis, "Redis", "Mantem a fila de operacoes")
    SystemDb(sqlite, "SQLite", "Persiste usuarios, produtos e logs")

    Rel(usuario, sistema, "Usa via HTTP/JSON localmente")
    Rel(sistema, redis, "Publica e consome jobs")
    Rel(sistema, sqlite, "Le e grava dados")
```

## 2. C4 - Containers e componentes

```mermaid
C4Container
    title Containers principais

    Person(usuario, "Usuario")

    Container_Boundary(stockflow, "StockFlow") {
        Container(frontend, "Frontend", "HTML, CSS e JavaScript", "Login, produtos e polling")
        Container(api, "API REST", "Node.js e Express", "JWT, rotas e camadas MVC")
        Container(worker, "Worker", "Node.js e BullMQ", "Processa escritas assincronas")
        ContainerDb(redis, "Fila", "Redis", "Armazena jobs")
        ContainerDb(sqlite, "Banco", "SQLite", "Usuarios, produtos e auditoria")
    }

    Rel(usuario, frontend, "Acessa")
    Rel(frontend, api, "HTTP/JSON com JWT")
    Rel(api, redis, "Enfileira create, update e delete")
    Rel(worker, redis, "Consome jobs")
    Rel(api, sqlite, "Le via Service e Model")
    Rel(worker, sqlite, "Grava via Service e Model")
```

Dentro da API, as responsabilidades seguem o MVC com uma camada de servico:

```mermaid
flowchart LR
    R[Routes] --> C[Controller]
    C --> S[Service]
    S --> M[Model]
    M --> DB[(SQLite)]
```

- **Routes:** define os endpoints e aplica a autenticacao.
- **Controller:** recebe a requisicao e monta a resposta HTTP.
- **Service:** concentra validacoes e regras de negocio.
- **Model:** executa o acesso ao SQLite.

## 3. Sequencia - Login

```mermaid
sequenceDiagram
    actor Usuario
    participant API
    participant AuthService
    participant DB as SQLite

    Usuario->>API: POST /api/auth/login
    API->>AuthService: validar credenciais
    AuthService->>DB: buscar usuario por e-mail
    DB-->>AuthService: usuario e hash da senha
    AuthService-->>API: JWT valido por 15 minutos
    API-->>Usuario: 200 + cookie HttpOnly
```

## 4. Sequencia - Criacao assincrona

```mermaid
sequenceDiagram
    actor Usuario
    participant API
    participant Fila as BullMQ / Redis
    participant Worker
    participant DB as SQLite

    Usuario->>API: POST /api/produtos + JWT
    API->>Fila: adicionar job de criacao
    API-->>Usuario: 200 + jobId
    Worker->>Fila: consumir job
    Worker->>DB: inserir produto via Service e Model
    DB-->>Worker: produto criado
    Usuario->>API: GET /api/jobs/:id
    API-->>Usuario: status completed
```

As consultas (`find all`, `find by id`, `find by name` e `count`) sao
sincronas. Criacao, atualizacao e exclusao sao enviadas para a fila e
acompanhadas pelo frontend por polling. Proprietarios e colaboradores usam o
mesmo espaco de produtos, identificado pelo proprietario. Cada alteracao gera
um log com usuario, acao, entidade e horario.

## 5. Dominio

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string email
        +string senha_hash
        +int dono_id
        +string papel
        +bool ativo
    }

    class Produto {
        +int id
        +string nome
        +float preco
        +string categoria
        +int estoque
        +int dono_id
    }

    class LogAuditoria {
        +int id
        +int dono_id
        +int usuario_id
        +string acao
        +string entidade
        +string detalhes
        +datetime criado_em
    }

    class ProdutoService {
        +criar(dados)
        +listarTodos()
        +buscarPorId(id)
        +buscarPorNome(nome)
        +contar()
        +atualizar(id, dados)
        +remover(id)
    }

    ProdutoService --> Produto : gerencia
    Usuario "1" --> "0..*" Usuario : possui colaboradores
    Usuario "1" --> "0..*" Produto : compartilha espaco
    Usuario "1" --> "0..*" LogAuditoria : realiza acoes
```

Em producao, HTTPS deve ser terminado por um proxy reverso ou pela plataforma
de hospedagem. O JWT expira em 15 minutos e e enviado pelo frontend em cookie
`HttpOnly` com `SameSite=Strict`.

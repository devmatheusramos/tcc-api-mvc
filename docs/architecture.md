# Arquitetura — API REST de Produtos (MVC)

Diagramas em [Mermaid](https://mermaid.js.org/), renderizados nativamente pelo
GitHub. Cobrem o requisito de desenho arquitetural (C4 + UML) do exercício.

## 1. C4 — Contexto

Visão de fora: quem usa o sistema e com o que ele conversa.

```mermaid
C4Context
    title Contexto - API de Produtos

    Person(cliente, "Cliente da API", "Usa Postman/curl/navegador para consumir a API")
    System(api, "API REST de Produtos", "Node.js + Express, empacotada em container Docker")
    SystemDb(db, "SQLite (node:sqlite)", "Arquivo persistido em volume Docker (./data)")

    Rel(cliente, api, "Faz requisicoes HTTP (JSON) na porta 3000")
    Rel(api, db, "Le e escreve dados via SQL")
```

## 2. C4 — Componentes (dentro da API)

Visão interna: como a requisição atravessa as camadas MVC + Service.

```mermaid
C4Component
    title Componentes internos - API de Produtos

    Container_Boundary(api, "API REST de Produtos") {
        Component(routes, "Routes", "Express Router", "Mapeia metodo+path para o Controller")
        Component(controller, "ProdutoController", "Controller", "Le req, chama a Service, monta a resposta HTTP")
        Component(service, "ProdutoService", "Service", "Validacao e regras de negocio")
        Component(model, "ProdutoModel", "Model", "Unica camada que executa SQL")
    }
    SystemDb(db, "SQLite", "data/tcc.sqlite")

    Rel(routes, controller, "encaminha requisicao")
    Rel(controller, service, "chama")
    Rel(service, model, "chama")
    Rel(model, db, "SQL")
```

## 3. Sequência — `POST /api/produtos`

```mermaid
sequenceDiagram
    actor Cliente
    participant Routes
    participant Controller as ProdutoController
    participant Service as ProdutoService
    participant Model as ProdutoModel
    participant DB as SQLite

    Cliente->>Routes: POST /api/produtos (JSON)
    Routes->>Controller: create(req, res)
    Controller->>Service: criar(dados)
    Service->>Service: validar(nome, preco, estoque)
    alt dados invalidos
        Service-->>Controller: lanca ValidationError
        Controller-->>Cliente: 400 { error }
    else dados validos
        Service->>Model: create(dados)
        Model->>DB: INSERT INTO produtos ...
        DB-->>Model: lastInsertRowid
        Model->>DB: SELECT * WHERE id = ...
        DB-->>Model: produto criado
        Model-->>Service: produto
        Service-->>Controller: produto
        Controller-->>Cliente: 201 produto (JSON)
    end
```

## 4. Diagrama de classes — Model

```mermaid
classDiagram
    class Produto {
        +int id
        +string nome
        +float preco
        +string categoria
        +int estoque
        +string criado_em
    }

    class ProdutoModel {
        +create(dados) Produto
        +findAll() Produto[]
        +findById(id) Produto
        +findByName(nome) Produto[]
        +count() int
        +update(id, dados) Produto
        +delete(id) bool
    }

    ProdutoModel --> Produto : le/escreve
```

## Por que essas camadas

- **Model** isola todo acesso a dados: se o banco mudar (ex.: Postgres), só o
  Model muda.
- **Service** concentra a regra de negócio (validação) fora do HTTP — pode ser
  reaproveitada por outro tipo de entrada (ex.: um job, uma CLI) sem duplicar
  código.
- **Controller** só traduz HTTP: não tem SQL nem regra de negócio.
- **Routes** é a única camada que conhece os paths da API.

# ADR 001 - Escritas assincronas com BullMQ

- Status: Aceita
- Data: 2026-09-16

## Contexto

Criacao, atualizacao e remocao de produtos nao devem prender a interface
enquanto a operacao e processada.

## Decisao

As escritas sao publicadas em uma fila BullMQ no Redis. A API valida os dados,
confere se o produto existe e responde `202` com um `jobId` e o cabecalho
`Location`. O worker executa a operacao e o frontend acompanha o estado por
polling. Consultas permanecem sincronas.

A fila fica atras de uma interface unica (`add` e `consultar`) com duas
implementacoes: `redis` (BullMQ + worker) e `inline`, que executa o mesmo
processador dentro da API. `QUEUE_MODE` escolhe a implementacao, e `inline` e o
padrao para desenvolvimento e testes.

## Consequencias

API e worker ficam desacoplados e as operacoes podem ser acompanhadas. Em
contrapartida, Redis e um worker passam a fazer parte da operacao do sistema no
modo `redis`. O modo `inline` permite rodar e testar a API sem essa
infraestrutura, mas sem o desacoplamento.

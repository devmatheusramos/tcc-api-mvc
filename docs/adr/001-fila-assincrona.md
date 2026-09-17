# ADR 001 - Escritas assincronas com BullMQ

- Status: Aceita
- Data: 2026-09-16

## Contexto

Criacao, atualizacao e remocao de produtos nao devem prender a interface
enquanto a operacao e processada.

## Decisao

As escritas sao publicadas em uma fila BullMQ no Redis. A API responde `200`
com um `jobId`, o worker executa a operacao e o frontend acompanha o estado por
polling. Consultas permanecem sincronas.

## Consequencias

API e worker ficam desacoplados e as operacoes podem ser acompanhadas. Em
contrapartida, Redis e um worker passam a fazer parte da operacao do sistema.

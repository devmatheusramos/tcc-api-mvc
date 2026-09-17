# ADR 002 - Contas compartilhadas e auditoria

- Status: Aceita
- Data: 2026-09-16

## Contexto

O proprietario precisa compartilhar a gestao com colaboradores e identificar
quem realizou cada alteracao.

## Decisao

Usuarios possuem papel de `proprietario` ou `colaborador` e compartilham um
espaco identificado por `dono_id`. Apenas o proprietario gerencia membros.
Alteracoes de produtos e membros geram registros imutaveis de auditoria.

## Consequencias

Os dados ficam isolados por proprietario e as mudancas se tornam rastreaveis.
Remover um colaborador desativa sua conta e invalida seu acesso imediatamente.

# Governanca do projeto

Este projeto usa um processo enxuto para manter as mudancas rastreaveis sem
criar burocracia desnecessaria.

## Tickets

Cada defeito ou melhoria deve ser registrado em um ticket antes da
implementacao. O ticket informa contexto, prioridade, criterios de aceite e,
quando aplicavel, impacto na arquitetura.

Fluxo adotado:

```text
Backlog -> Pronto -> Em andamento -> Em revisao -> Concluido
```

- **Backlog:** demanda registrada e ainda nao priorizada.
- **Pronto:** escopo e criterios de aceite definidos.
- **Em andamento:** implementacao iniciada.
- **Em revisao:** codigo e documentacao sendo verificados.
- **Concluido:** criterios atendidos e validacoes executadas.

## Prioridades

- **Alta:** indisponibilidade, falha de seguranca ou perda de dados.
- **Media:** funcionalidade importante incorreta ou bloqueada.
- **Baixa:** melhoria sem impacto imediato na operacao.

## Definition of Done

Uma mudanca esta concluida quando:

- os criterios de aceite do ticket foram atendidos;
- os testes relacionados passam com `npm test`;
- o fluxo afetado foi validado em Docker quando necessario;
- Swagger, README e diagramas foram atualizados quando impactados;
- nenhuma credencial ou arquivo de banco foi versionado;
- os commits identificam claramente a mudanca realizada.

## Documentacao viva

A documentacao evolui junto com o codigo. Mudancas de comportamento devem
atualizar os documentos no mesmo conjunto de commits. O projeto mantem:

- README para execucao, endpoints e visao geral;
- Swagger/OpenAPI para o contrato HTTP;
- Mermaid/C4 para arquitetura e fluxos;
- ADR para decisoes arquiteturais relevantes;
- tickets para contexto, aceite e acompanhamento do trabalho.

## Decisoes arquiteturais

Decisoes que alterem estrutura, tecnologia ou comportamento transversal devem
usar o modelo em `docs/adr/template.md`. Cada ADR recebe um numero sequencial,
um contexto, a decisao adotada e suas consequencias.

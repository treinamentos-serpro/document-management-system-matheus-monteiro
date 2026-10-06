---
name: implementar-fatia-dms
description: "Implementa uma mudança incremental do DMS a partir de uma solicitação e critérios de aceite, cobrindo as camadas e testes necessários."
argument-hint: "Descreva a mudança e os critérios de aceite"
agent: agent
---

# Implementar uma funcionalidade DMS

Implemente a seguinte mudança como uma fatia vertical mínima, mantendo compatibilidade com o comportamento existente.

**Solicitação:** ${input:solicitacao:Descreva o comportamento desejado}

**Critérios de aceite:** ${input:criterios:Liste os resultados verificáveis}

## Processo

1. Leia as instruções do repositório e consulte [a especificação DMS](../../docs/specs/dms-spec.md). Inspecione os módulos e testes mais próximos da funcionalidade antes de editar.
2. Identifique os limites afetados. No backend, preserve o fluxo routes -> controllers -> services -> repositories; no frontend, reutilize componentes e o cliente API existente quando aplicável.
3. Faça apenas as mudanças necessárias para os critérios de aceite. Não crie uma camada ou scaffold completo quando a mudança puder ser implementada nos módulos existentes.
4. Inclua ou ajuste testes focados no comportamento alterado, seguindo os padrões próximos. Não adicione dependências sem necessidade.
5. Execute as validações aplicáveis: `npm test` em `backend`; em `frontend`, `node --test src/services/documentApi.test.js` e `npm run build` quando a mudança afetar o frontend.

## Restrições do projeto

- Arquivos enviados permanecem no filesystem local em `backend/storage`, com Multer `diskStorage`; metadados ficam em memória.
- `X-User-Id` identifica o proprietário informado pelo cliente, mas não autentica o usuário.
- Ao enviar `FormData` com `fetch`, não defina `Content-Type` manualmente.
- Se a especificação, o código atual e os critérios fornecidos entrarem em conflito, explicite a divergência e resolva somente o que for necessário para os critérios, sem ampliar o escopo silenciosamente.

Ao concluir, resuma os arquivos alterados, os critérios atendidos e os comandos de validação executados, incluindo falhas ou verificações que não puderam ser executadas.
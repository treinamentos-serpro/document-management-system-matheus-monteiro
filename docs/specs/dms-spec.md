# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, consultem e baixem seus documentos por meio de uma aplicação web, mantendo os arquivos no filesystem local e seus metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário informado na requisição.
- Download de um documento pelo identificador, respeitando o proprietário informado.
- Interface React para envio, listagem e download.
- Armazenamento dos arquivos no diretório local `backend/storage` usando `multer` com `diskStorage`.
- Armazenamento em memória dos metadados durante a execução do processo.

### Fora do escopo

- Armazenamento em nuvem ou em qualquer serviço externo.
- Banco de dados para metadados ou persistência destes entre reinicializações.
- Autenticação, autorização baseada em credenciais ou gestão de contas de usuário.
- Versionamento, edição, exclusão, compartilhamento ou busca avançada de documentos.
- Upload de múltiplos arquivos em uma única requisição.

### Premissa de identificação do usuário

Nesta fase, `owner` é um identificador fornecido pelo cliente no cabeçalho `X-User-Id`. Ele serve somente para separar operações por identificador; não comprova a identidade de quem fez a requisição e pode ser falsificado. A aplicação não deve ser considerada segura para uso multiusuário em produção sem autenticação e autorização apropriadas, que estão fora do escopo atual.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O cliente pode enviar um arquivo por `multipart/form-data`, informando `X-User-Id` não vazio. |
| RF-02 | O sistema rejeita o envio quando o arquivo ou o identificador do usuário estiver ausente ou inválido. |
| RF-03 | O sistema grava o conteúdo recebido no filesystem local em `backend/storage`, por meio de `multer` configurado com `diskStorage`. |
| RF-04 | O sistema gera um identificador único para cada documento e não usa o nome original como nome físico do arquivo. |
| RF-05 | Após um envio bem-sucedido, o sistema registra em memória o identificador, nome original, tamanho em bytes, data/hora do upload e proprietário. |
| RF-06 | O cliente pode listar os metadados dos documentos cujo proprietário corresponde ao `X-User-Id` informado. Uma lista sem resultados é válida e retorna vazia. |
| RF-07 | O cliente pode baixar um documento pelo identificador quando o `X-User-Id` informado corresponde ao proprietário. |
| RF-08 | O sistema não revela nem permite baixar um documento inexistente ou pertencente a outro identificador de usuário. |
| RF-09 | O arquivo baixado é entregue como conteúdo binário para download, usando o nome original como nome sugerido ao cliente. |
| RF-10 | O frontend permite enviar um documento, consultar a lista do usuário ativo e iniciar o download de um item listado. |
| RF-11 | O frontend apresenta estados de carregamento, lista vazia e erro para as operações de envio, listagem e download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos são armazenados exclusivamente no filesystem local da aplicação, no diretório `backend/storage`; não são usados provedores externos. |
| RNF-02 | O upload usa `multer` com `diskStorage`; o nome físico deve ser gerado pelo sistema para evitar colisões e não confiar no nome fornecido pelo cliente como caminho. |
| RNF-03 | Os metadados ficam em memória nesta fase e são perdidos quando o processo do backend reinicia. |
| RNF-04 | O backend segue Clean Architecture simples, com dependências fluindo de `routes` para `controllers`, `services` e `repositories`. |
| RNF-05 | A configuração operacional, como a porta HTTP, deve ser obtida de variáveis de ambiente, com valor padrão documentado quando aplicável. |
| RNF-06 | O backend usa Node.js, Express em CommonJS e testes com `node:test`; o frontend usa React e Vite em ESM. |
| RNF-07 | Erros de entrada, persistência local e leitura de arquivos são tratados nos limites apropriados, sem expor caminhos internos ou detalhes da implementação ao cliente. |

## 5. Modelo de dados

### Metadados públicos do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único gerado pelo sistema. |
| `originalName` | string | Sim | Nome original do arquivo informado no upload; usado como nome sugerido no download. |
| `size` | number | Sim | Tamanho do conteúdo em bytes. |
| `uploadedAt` | string | Sim | Data e hora do upload em formato ISO 8601. |
| `owner` | string | Sim | Identificador recebido no cabeçalho `X-User-Id`. |

### Dados internos de persistência

O repositório pode manter, junto aos metadados, a referência necessária para localizar o arquivo no diretório local. Essa referência é interna e não deve ser retornada pela API. O nome físico do arquivo é gerado pelo sistema e é independente de `originalName`.

O registro de metadados existe somente enquanto o processo estiver em execução. Não há garantia de recuperação de registros após reinicialização, mesmo que os arquivos continuem presentes no diretório local.

## 6. Contratos de API

### Convenções

- Prefixo: `/api` no frontend, encaminhado ao backend pelo proxy do Vite. Os caminhos abaixo são relativos ao backend.
- Identificação do usuário: cabeçalho obrigatório `X-User-Id`, com valor não vazio, nas operações de envio, listagem e download.
- Tipo de conteúdo das respostas JSON: `application/json; charset=utf-8`.
- O backend não deve incluir caminhos físicos, nomes internos ou conteúdo binário nas respostas de metadados.

### POST /upload

Envia um documento para o usuário identificado.

**Cabeçalhos**

- `X-User-Id: <identificador>`
- `Content-Type: multipart/form-data` (definido pelo cliente HTTP com o boundary apropriado)

**Corpo**

- Campo multipart `file`, contendo exatamente um arquivo.

**Sucesso: `201 Created`**

```json
{
  "id": "<identificador>",
  "originalName": "relatorio.pdf",
  "size": 12345,
  "uploadedAt": "2026-10-06T12:00:00.000Z",
  "owner": "usuario-123"
}
```

**Erros**

- `400 Bad Request`: cabeçalho `X-User-Id` ausente/vazio, arquivo ausente ou requisição multipart inválida.
- `500 Internal Server Error`: falha inesperada ao gravar o arquivo ou registrar os metadados. A resposta não expõe detalhes internos.

### GET /documents

Lista os documentos associados ao identificador informado.

**Cabeçalho**

- `X-User-Id: <identificador>`

**Sucesso: `200 OK`**

Retorna array de metadados públicos. Sem documentos associados, retorna `[]`.

```json
[
  {
    "id": "<identificador>",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-123"
  }
]
```

**Erros**

- `400 Bad Request`: cabeçalho `X-User-Id` ausente ou vazio.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento pertencente ao identificador informado.

**Cabeçalho**

- `X-User-Id: <identificador>`

**Sucesso: `200 OK`**

- Corpo: bytes do arquivo, sem envelope JSON.
- `Content-Type`: tipo do arquivo quando conhecido, ou `application/octet-stream`.
- `Content-Disposition`: `attachment`, com o nome original tratado com segurança para uso no cabeçalho.

**Erros**

- `400 Bad Request`: cabeçalho `X-User-Id` ausente/vazio ou identificador de rota inválido.
- `404 Not Found`: documento inexistente, não pertencente ao identificador informado ou arquivo local indisponível. A resposta não distingue documento alheio de inexistente.
- `500 Internal Server Error`: falha inesperada durante a leitura do arquivo, sem exposição de detalhes internos.

### Formato de erro

Quando houver corpo JSON de erro, usar formato consistente:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Não foi possível processar a solicitação."
  }
}
```

Os códigos e mensagens podem ser específicos por situação, mas não devem conter stack trace, caminho local ou informação que revele documentos de outro usuário.

## 7. Decisões arquiteturais

### Backend

- `routes/`: declara os caminhos HTTP e encaminha a requisição ao controller correspondente.
- `controllers/`: valida dados de entrada HTTP, chama os serviços e traduz o resultado em status, cabeçalhos e corpo HTTP.
- `services/`: aplica regras de negócio, incluindo associação ao proprietário e autorização por correspondência do identificador informado.
- `repositories/`: mantém metadados em memória e interage com o filesystem local para gravar e ler arquivos.
- `multer` com `diskStorage` é configurado na fronteira HTTP para receber o arquivo e gravá-lo localmente. O controller/serviço coordena o registro dos metadados sem incorporar detalhes de Express nas regras de negócio.
- A aplicação permanece em CommonJS e deve reutilizar Express, Multer e o runner de testes já presentes no projeto.

### Frontend

- Componentes funcionais React organizados em `components/`, `pages/` e `services/`.
- A camada `services/` encapsula chamadas `fetch` sob o prefixo `/api` e envia `X-User-Id` em cada operação.
- O frontend apresenta o nome, tamanho e data dos documentos, além das ações de envio e download; não apresenta nem depende do caminho físico de armazenamento.
- A origem e a seleção do identificador de usuário precisam ser coerentes com a premissa de identidade simplificada descrita nesta especificação. Autenticação não está incluída nesta fase.

### Armazenamento e configuração

- Diretório de arquivos: `backend/storage`, no filesystem local da aplicação.
- Metadados: repositório em memória, sem banco de dados.
- Porta HTTP: variável `PORT`, com padrão `3000`, conforme o seed atual.
- Nenhuma configuração pode direcionar arquivos para um serviço externo ou substituir a restrição de armazenamento local.

## 8. Plano de execução

As etapas abaixo são um roteiro futuro. Esta entrega consiste apenas neste documento e não implementa arquivos de backend ou frontend.

1. Definir a estrutura do backend e registrar as interfaces entre rotas, controllers, services e repositories.
2. Implementar persistência local de arquivos com `multer`/`diskStorage` e repositório em memória para metadados.
3. Implementar e testar os contratos de upload, listagem filtrada por proprietário e download com verificação de propriedade.
4. Implementar a camada de serviços e tratamento uniforme de erros, garantindo que detalhes internos não sejam expostos.
5. Implementar no frontend os fluxos de envio, listagem e download, com estados de carregamento, vazio e erro.
6. Executar testes backend com `node:test` e validar o build do frontend; revisar os critérios de aceitação e a restrição de armazenamento local.

## 9. Critérios de aceitação

- Os três endpoints e seus casos de sucesso e erro estão descritos de forma consistente.
- A listagem e o download são limitados ao `owner` informado, sem afirmar que esse identificador equivale a autenticação.
- O modelo documenta metadados públicos e separa a referência interna do arquivo.
- A especificação exige `multer` com `diskStorage`, diretório local `backend/storage` e metadados em memória.
- A arquitetura e o roteiro respeitam as camadas e tecnologias existentes no repositório.
- Nenhum arquivo de backend ou frontend é alterado como parte desta entrega.

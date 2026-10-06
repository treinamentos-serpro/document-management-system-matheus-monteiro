import assert from 'node:assert/strict';
import { test } from 'node:test';
import { downloadDocument, listDocuments, uploadDocument } from './documentApi.js';

test('lista documentos via /api com usuario e sinal de cancelamento', async (context) => {
  const documents = [{ id: 'document-id', originalName: 'arquivo.txt' }];
  const controller = new AbortController();
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    assert.equal(options.signal, controller.signal);
    return Response.json(documents);
  });
  assert.deepEqual(await listDocuments(' usuario ', { signal: controller.signal }), documents);
});

test('envia arquivo multipart sem definir Content-Type manualmente', async (context) => {
  const file = new File(['conteudo'], 'arquivo.txt');
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('file'), file);
    return Response.json({ id: 'document-id' }, { status: 201 });
  });
  assert.deepEqual(await uploadDocument(file, 'usuario'), { id: 'document-id' });
});

test('baixa conteudo binario com identificador codificado e usuario', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents/document%2Fid/download');
    assert.equal(options.headers['X-User-Id'], 'usuario');
    return new Response('conteudo');
  });
  assert.equal(await (await downloadDocument('document/id', 'usuario')).text(), 'conteudo');
});

test('rejeita usuario e arquivo ausentes antes de chamar fetch', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch');
  await assert.rejects(listDocuments(' '), /identificador do usuario/);
  await assert.rejects(uploadDocument(null, 'usuario'), /Selecione um arquivo/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('apresenta mensagens do backend e fallback para erros sem JSON', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: { message: 'Documento nao encontrado.' } }, { status: 404 }));
  await assert.rejects(downloadDocument('id', 'usuario'), /Documento nao encontrado/);
  fetchMock.mock.mockImplementation(async () => new Response('erro', { status: 500 }));
  await assert.rejects(listDocuments('usuario'), /processar a solicitacao/);
});

test('trata falha de rede e preserva cancelamento', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(listDocuments('usuario'), /conectar ao servidor/);
  fetchMock.mock.mockImplementation(async () => {
    throw new DOMException('Aborted', 'AbortError');
  });
  await assert.rejects(listDocuments('usuario'), { name: 'AbortError' });
});
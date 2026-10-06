const documentService = require('../services/documentService');

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function validateOwner(req, res, next) {
  const owner = req.get('X-User-Id');
  if (!owner || !owner.trim()) {
    return sendError(res, 400, 'INVALID_REQUEST', 'Informe o identificador do usuario.');
  }
  res.locals.owner = owner.trim();
  next();
}

function uploadDocument(req, res) {
  if (!req.file) {
    return sendError(res, 400, 'INVALID_REQUEST', 'Envie um arquivo no campo file.');
  }
  const document = documentService.createDocument(req.file, res.locals.owner);
  res.status(201).json(document);
}

function listDocuments(req, res) {
  res.json(documentService.listDocuments(res.locals.owner));
}

async function downloadDocument(req, res, next) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(req.params.id)) {
    return sendError(res, 400, 'INVALID_REQUEST', 'Identificador de documento invalido.');
  }
  const download = await documentService.getDownload(req.params.id, res.locals.owner);
  if (!download) {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento nao encontrado.');
  }
  res.download(download.filePath, download.originalName, (error) => {
    if (error) next(error);
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 'INVALID_REQUEST' || error instanceof URIError || error.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_REQUEST', 'Nao foi possivel processar a solicitacao.');
  }
  if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
    return sendError(res, 404, 'DOCUMENT_NOT_FOUND', 'Documento nao encontrado.');
  }
  return sendError(res, 500, 'INTERNAL_ERROR', 'Nao foi possivel processar a solicitacao.');
}

module.exports = { validateOwner, uploadDocument, listDocuments, downloadDocument, handleError };
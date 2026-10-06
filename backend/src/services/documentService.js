const documentRepository = require('../repositories/documentRepository');

function publicMetadata(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

function createDocument(file, owner) {
  const document = documentRepository.save({
    id: file.filename,
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    fileName: file.filename,
  });
  return publicMetadata(document);
}

function listDocuments(owner) {
  return documentRepository.findByOwner(owner).map(publicMetadata);
}

async function getDownload(id, owner) {
  const document = documentRepository.findById(id);
  if (!document || document.owner !== owner) return null;
  const filePath = await documentRepository.getFilePath(document);
  if (!filePath) return null;
  return { filePath, originalName: document.originalName };
}

module.exports = { createDocument, listDocuments, getDownload };
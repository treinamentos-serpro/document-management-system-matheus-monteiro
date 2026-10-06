const path = require('node:path');
const { access } = require('node:fs/promises');
const { constants } = require('node:fs');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function findByOwner(owner) {
  return [...documents.values()].filter((document) => document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

async function getFilePath(document) {
  const filePath = path.join(storageDirectory, document.fileName);
  try {
    await access(filePath, constants.R_OK);
    return filePath;
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

module.exports = { save, findByOwner, findById, getFilePath };
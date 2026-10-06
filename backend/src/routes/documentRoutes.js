const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { mkdir } = require('node:fs');
const { randomUUID } = require('node:crypto');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const storage = multer.diskStorage({
  destination(req, file, callback) {
    mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});
const upload = multer({ storage, limits: { files: 1 } }).single('file');

function receiveDocument(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError || !error.code) {
        error.code = 'INVALID_REQUEST';
      } else {
        error.code = 'STORAGE_ERROR';
      }
      return next(error);
    }
    next();
  });
}

router.post('/upload', documentController.validateOwner, receiveDocument, documentController.uploadDocument);
router.get('/documents', documentController.validateOwner, documentController.listDocuments);
router.get('/documents/:id/download', documentController.validateOwner, documentController.downloadDocument);

module.exports = router;
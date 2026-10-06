import { useState } from 'react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ owner, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const uploadedDocument = await uploadDocument(file, owner);
      form.reset();
      setFile(null);
      setMessage(`${uploadedDocument.originalName} enviado com sucesso.`);
      onUploaded(uploadedDocument);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <h2 id="upload-heading">Enviar documento</h2>
      <form onSubmit={handleSubmit} aria-busy={uploading}>
        <div className="upload-controls">
          <label className="file-field">
            <span>Arquivo</span>
            <input
              type="file"
              name="file"
              required
              disabled={uploading}
              onChange={(event) => {
                setFile(event.target.files[0] || null);
                setError('');
                setMessage('');
              }}
            />
          </label>
          <button type="submit" className="primary-button" disabled={!file || uploading}>
            {uploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        {message && <p className="success-message" role="status">{message}</p>}
      </form>
    </section>
  );
}
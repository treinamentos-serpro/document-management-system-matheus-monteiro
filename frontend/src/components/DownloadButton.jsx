import { useState } from 'react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document: documentMetadata, owner }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(documentMetadata.id, owner);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      try {
        link.href = url;
        link.download = documentMetadata.originalName;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        type="button"
        disabled={downloading}
        onClick={handleDownload}
        aria-label={`Baixar ${documentMetadata.originalName}`}
        aria-busy={downloading}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p className="error-message" role="alert">{error}</p>}
    </div>
  );
}
import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, owner, loading, error, onRetry }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading" aria-busy={loading}>
      <div className="section-heading">
        <h2 id="documents-heading">Meus documentos</h2>
        {!loading && !error && <span className="document-count">{documents.length}</span>}
        <button type="button" onClick={onRetry} disabled={loading}>Atualizar</button>
      </div>
      {loading ? (
        <p className="list-state" role="status">Carregando documentos...</p>
      ) : error ? (
        <p className="list-state error-message" role="alert">{error}</p>
      ) : documents.length === 0 ? (
        <p className="list-state" role="status">Nenhum documento encontrado.</p>
      ) : (
        <ul className="document-list">
          {documents.map((documentMetadata) => (
            <li key={documentMetadata.id} className="document-row">
              <div className="document-details">
                <h3>{documentMetadata.originalName}</h3>
                <div className="document-metadata">
                  <span>{formatSize(documentMetadata.size)}</span>
                  <time dateTime={documentMetadata.uploadedAt}>
                    {dateFormatter.format(new Date(documentMetadata.uploadedAt))}
                  </time>
                </div>
              </div>
              <DownloadButton document={documentMetadata} owner={owner} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
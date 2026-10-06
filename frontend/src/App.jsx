import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

function DocumentWorkspace({ owner }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(owner, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setDocuments(result);
      })
      .catch((listError) => {
        if (!controller.signal.aborted) setError(listError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [owner, revision]);

  function refreshDocuments() {
    setRevision((currentRevision) => currentRevision + 1);
  }

  return (
    <>
      <UploadComponent owner={owner} onUploaded={refreshDocuments} />
      <DocumentList
        documents={documents}
        owner={owner}
        loading={loading}
        error={error}
        onRetry={refreshDocuments}
      />
    </>
  );
}

export default function App() {
  const [userId, setUserId] = useState('usuario-123');
  const owner = userId.trim();

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-brand">Document Management System</p>
          <h1>Documentos</h1>
        </div>
        <label className="user-field">
          <span>Identificador do usuario</span>
          <input
            type="text"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
      </header>
      {owner ? (
        <DocumentWorkspace key={owner} owner={owner} />
      ) : (
        <p className="list-state" role="status">Informe o identificador do usuario.</p>
      )}
    </main>
  );
}

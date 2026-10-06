async function request(path, owner, options = {}) {
  const userId = owner?.trim();
  if (!userId) throw new Error('Informe o identificador do usuario.');

  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'X-User-Id': userId },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Nao foi possivel conectar ao servidor. Tente novamente.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Nao foi possivel processar a solicitacao.');
  }
  return response;
}

export async function listDocuments(owner, { signal } = {}) {
  const response = await request('/documents', owner, { signal });
  return response.json();
}

export async function uploadDocument(file, owner) {
  if (!file) throw new Error('Selecione um arquivo para enviar.');
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', owner, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(id, owner) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, owner);
  return response.blob();
}
import { request, getStoredToken } from './api';
import {
  DocumentSummary,
  DocumentDetail,
  DocumentSection,
  MergePreviewData,
  DocumentVersion,
} from '../types/document';

export async function getDocuments(search?: string): Promise<DocumentSummary[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<DocumentSummary[]>(`/documents${query}`);
}

export async function createDocument(data: {
  title: string;
  subject?: string;
  summary?: string;
  tags?: string[];
}): Promise<DocumentSummary> {
  return request<DocumentSummary>('/documents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${id}`);
}

export async function updateDocument(
  id: string,
  data: { title?: string; subject?: string; summary?: string; tags?: string[] }
): Promise<DocumentSummary> {
  return request<DocumentSummary>(`/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await request<void>(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicateDocument(id: string): Promise<DocumentSummary> {
  return request<DocumentSummary>(`/documents/${id}/duplicate`, {
    method: 'POST',
  });
}

export async function organizeContent(payload: {
  raw_content: string;
  subject?: string;
  preserve_source?: boolean;
}): Promise<{
  title: string;
  subject: string;
  summary: string;
  sections: DocumentSection[];
  learning_objectives: string[];
  suggested_follow_ups: string[];
}> {
  return request('/ai/organize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function previewMerge(payload: {
  document_id: string;
  raw_content: string;
  preserve_source?: boolean;
}): Promise<MergePreviewData> {
  return request<MergePreviewData>('/ai/merge-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function commitMerge(
  documentId: string,
  payload: {
    version_title: string;
    change_summary?: string;
    sections: DocumentSection[];
  }
): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/ai/merge-commit/${documentId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  return request<DocumentVersion[]>(`/documents/${documentId}/versions`);
}

export async function restoreDocumentVersion(
  documentId: string,
  versionNumber: number
): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${documentId}/versions/restore`, {
    method: 'POST',
    body: JSON.stringify({ version_number: versionNumber }),
  });
}

export async function downloadExportFile(
  documentId: string,
  format: 'docx' | 'pdf',
  fallbackFilename: string
): Promise<void> {
  const token = getStoredToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api/export/${documentId}/${format}`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to download ${format.toUpperCase()} file`);
  }

  // Get filename from Content-Disposition header if available
  let filename = fallbackFilename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export interface ImageUploadResult {
  url: string;
  filename: string;
  width: number;
  height: number;
  format: string;
  size_bytes: number;
}

export async function uploadImage(file: File): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  return request<ImageUploadResult>('/upload/image', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchExternalImage(url: string): Promise<ImageUploadResult> {
  return request<ImageUploadResult>('/upload/fetch-external', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

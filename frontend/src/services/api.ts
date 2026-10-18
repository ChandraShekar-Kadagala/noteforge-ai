const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('noteforge_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('noteforge_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('noteforge_token');
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredToken();
    window.dispatchEvent(new Event('noteforge_auth_change'));
  }

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      errorDetail = await response.text();
    }
    throw new ApiError(errorDetail, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

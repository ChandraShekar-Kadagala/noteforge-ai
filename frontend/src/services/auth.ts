import { request, setStoredToken, clearStoredToken } from './api';
import { AuthResponse, LoginPayload, RegisterPayload, SocialAuthPayload, User } from '../types/auth';

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function socialLogin(payload: SocialAuthPayload): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/social', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(data.access_token);
  return data;
}

export async function getMe(): Promise<User> {
  return request<User>('/auth/me');
}

export function logout(): void {
  clearStoredToken();
  window.dispatchEvent(new Event('noteforge_auth_change'));
}

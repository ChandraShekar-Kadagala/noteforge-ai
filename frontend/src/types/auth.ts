export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  auth_provider: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface SocialAuthPayload {
  provider: 'google' | 'linkedin' | 'supabase';
  email: string;
  full_name?: string;
  avatar_url?: string;
}

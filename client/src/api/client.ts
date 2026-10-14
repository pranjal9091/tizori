const API_BASE = import.meta.env.VITE_API_URL || '/api';

export type ApiResponse<T = Record<string, unknown>> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} & T;

export async function apiRequest<T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('tizori_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/login')) {
        // Token expired
        localStorage.removeItem('tizori_token');
        localStorage.removeItem('tizori_user');
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

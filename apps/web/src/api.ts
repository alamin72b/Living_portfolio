import type { Workspace } from '@blueprint/shared';
const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';
export async function request<T>(
  path: string,
  options: { token?: string; method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const response = await fetch(`${base}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const details = Array.isArray(data?.issues)
      ? data.issues
          .slice(0, 3)
          .map((i: { path: string; message: string }) => `${i.path}: ${i.message}`)
          .join('; ')
      : '';
    throw new Error(
      details || data?.message || `Request failed (${response.status}). Please try again.`,
    );
  }
  return data as T;
}
export const loadWorkspace = (signal?: AbortSignal) => request<Workspace>('/workspace', { signal });

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiClient {
  constructor(private token = "") {}
  setToken(token: string) {
    this.token = token;
  }
  clearToken() {
    this.token = "";
  }
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.error ?? `Request failed (${response.status})`);
    return payload as T;
  }
}

export const api = new ApiClient();

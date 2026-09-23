export interface ApiConfig {
  baseUrl: string;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

const WEB_DEFAULTS: ApiConfig = {
  baseUrl: "",
  getAuthHeaders: async () => ({}),
};

let config: ApiConfig = WEB_DEFAULTS;

export function configureApiClient(next: Partial<ApiConfig>): void {
  config = {
    ...config,
    ...next,
    ...(next.baseUrl !== undefined ? { baseUrl: next.baseUrl.replace(/\/+$/, "") } : {}),
  };
}

export function getApiConfig(): ApiConfig {
  return config;
}

export function resetApiConfig(): void {
  config = WEB_DEFAULTS;
}

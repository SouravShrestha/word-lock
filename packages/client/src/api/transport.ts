import { getApiConfig } from "./config";
import { ApiError } from "./errors";

async function headersFor(extra?: Record<string, string>): Promise<Record<string, string>> {
  const { getAuthHeaders } = getApiConfig();
  return { ...(await getAuthHeaders()), ...extra };
}

function url(path: string): string {
  return `${getApiConfig().baseUrl}${path}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return new ApiError(body.error || `HTTP error ${response.status}`, response.status);
}

export async function post(path: string, data: unknown): Promise<any> {
  const response = await fetch(url(path), {
    method: "POST",
    headers: await headersFor({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) throw await toApiError(response);
  return response.json();
}

export async function get(path: string): Promise<any> {
  const response = await fetch(url(path), {
    method: "GET",
    headers: await headersFor(),
  });

  if (!response.ok) throw await toApiError(response);
  return response.json();
}

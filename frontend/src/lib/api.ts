import createClient from "openapi-fetch";
import type { paths } from "./api-client/schema";

export interface ApiClientError {
  code: string;
  message: string;
  details?: unknown;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TIMEOUT_MS = 15000;

export async function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort());
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = createClient<paths>({
  baseUrl: API_BASE,
  fetch: customFetch,
});

export function parseApiError(err: unknown): ApiClientError {
  if (!err) {
    return { code: "UNKNOWN_ERROR", message: "An unexpected error occurred" };
  }
  if (typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const code = (typeof obj.code === "string" && obj.code) || "API_ERROR";
    let message = "Request failed";
    if (typeof obj.message === "string") {
      message = obj.message;
    } else if (typeof obj.detail === "string") {
      message = obj.detail;
    } else if (Array.isArray(obj.detail) && obj.detail[0]?.msg) {
      message = String(obj.detail[0].msg);
    }
    return {
      code,
      message,
      details: obj.detail ?? obj.details,
    };
  }
  return { code: "GENERIC_ERROR", message: String(err) };
}

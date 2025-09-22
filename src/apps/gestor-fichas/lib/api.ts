// API utilities for gestor-fichas
import { toQueryString } from "./utils";

/**
 * Realiza una petición GET a una API que devuelve JSON.
 * Si se pasan queryParams como objeto, los convierte a querystring.
 */
export async function apiJSON<T = any>(
  url: string,
  queryParams?: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  let finalUrl = url;
  
  if (queryParams) {
    const qs = typeof queryParams === 'object' 
      ? new URLSearchParams(Object.entries(queryParams).map(([k, v]) => [k, String(v)])).toString()
      : queryParams;
    
    if (qs) {
      finalUrl += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const response = await fetch(finalUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Realiza una petición POST a una API que devuelve JSON.
 */
export async function apiJSONPost<T = any>(
  url: string,
  body?: any,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Realiza una petición DELETE a una API.
 */
export async function apiDelete(
  url: string,
  options?: RequestInit
): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
}
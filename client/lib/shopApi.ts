import { Product } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is not set. Add it to client/.env.local'
  );
}

/**
 * Returns the stored retailer JWT or null if not logged in.
 * Only available in the browser (localStorage is not available on the server).
 */
export function getRetailerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('retailer_token');
}

/**
 * Builds the Authorization header for retailer API calls.
 * Returns an empty object if no token is present so the spread still works.
 */
export function retailerAuthHeaders(): Record<string, string> {
  const token = getRetailerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetches all products (public).
 */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products`, {
    cache: 'no-store', // ensures fresh product list
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch products (${res.status} ${res.statusText}). Is the server running?`
    );
  }

  const json = await res.json();
  return json.data as Product[];
}

/**
 * Placeholder for Phase 3b: Create order.
 */
export async function createOrder(items: { productId: string; quantity: number }[]) {
  console.log('TODO: Phase 3b - Create Order API call', items);
  throw new Error('Not implemented yet');
}

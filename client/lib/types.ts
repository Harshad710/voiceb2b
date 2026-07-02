// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interfaces that mirror the Mongoose schemas defined in Phase 1.
// Using populated types (objects, not ObjectIds) because the API response
// from GET /api/orders always runs .populate() on retailerId and items.productId.
// ─────────────────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED';

export interface User {
  _id: string;
  name: string;
  phone: string;
  role: 'RETAILER' | 'ADMIN';
}

export interface Product {
  _id: string;
  name: string;
  brand: string;
  price: number;
}

export interface OrderItem {
  productId: Product | string; // populated = Product object; fallback = raw ID string
  quantity: number;
  priceAtPurchase: number;
}

export interface Order {
  _id: string;
  retailerId: User | string; // populated = User object; fallback = raw ID string
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

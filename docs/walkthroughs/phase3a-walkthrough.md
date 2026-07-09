# Phase 3a — Architecture & Walkthrough

This document outlines the architecture, data flow, and file structure for Phase 3a (Retailer Auth & Catalog Browse). 

## 1. Architecture: Browser to MongoDB and Back

### Retailer Login Flow
1. **Client (Browser):** The retailer submits their phone number and password on the login page (`/shop/login`).
2. **API Request:** A `POST` request is sent to `/api/auth/login`.
3. **Server:** The auth controller (not covered here, but standard) validates credentials and returns a signed JWT.
4. **Client (Browser):** The client stores the JWT in `localStorage` as `retailer_token`. Upon success, the user is redirected to the `/shop` route.

### Catalog Browse Flow
1. **Client (Browser):** The retailer navigates to `/shop`. The page mounts and triggers `fetchProducts()`.
2. **API Request:** A `GET` request is sent to `/api/products` (without an auth header, as the catalog is public).
3. **Server:** The route handler fetches the product catalog from the `Product` collection in MongoDB.
4. **Client (Browser):** The JSON response is received. The UI parses the categories, stores the products in React state, and renders the catalog grid. Client-side filtering applies immediately as the user types in the search bar or selects a category.

## 2. File-by-File Breakdown

### Backend (`server/`)
*   **`middleware/authMiddleware.js`**
    *   **Role:** Validates JWTs on protected routes (like order creation/viewing). Extracts the token from the `Authorization: Bearer` header, verifies it, and attaches the decoded payload to `req.user`.
*   **`controllers/orderController.js`**
    *   **Role:** Handles all order-related business logic.
    *   **Key Detail - `getOrderById` vs `getOrdersByRetailer` ownership checks:** 
        *   In `getOrdersByRetailer`, the ownership check (`req.params.retailerId !== req.user.userId`) compares the token's ID against the *URL parameter* directly, blocking unauthorized access before even querying the database.
        *   In `getOrderById`, the check (`order.retailerId._id.toString() !== req.user.userId`) happens *after* the DB query. Because `retailerId` is populated by Mongoose, it's a full object. We must extract the `_id` and explicitly call `.toString()` to safely compare it with the string `userId` from the JWT.
    *   **Key Detail - `expectedDeliveryDate`:** Currently, this generates a random date 1-4 days in the future. **This is a placeholder, not real logic**, acting as a stub until proper logistics/delivery routing is implemented.
    *   **Key Detail - Price Snapshot:** `createOrder` captures the current product price as `priceAtPurchase`, ensuring future price changes don't retroactively alter past orders.
*   **`routes/orderRoutes.js`**
    *   **Role:** Maps HTTP methods to the order controller.
    *   **Key Decision:** The `/retailer/:retailerId` route is defined *before* the `/:id` route. This is load-bearing; otherwise, Express would interpret "retailer" as a dynamic order ID.
*   **`scripts/seed-products.js`**
    *   **Role:** Populates the `Product` collection with realistic FMCG items and aliases for future fuzzy/voice search phases.
    *   **Key Decision:** Uses self-contained inline SVG data URIs for placeholder images rather than an external service. This prevents broken images if external services fail or font stacks change.

### Frontend (`client/`)
*   **`lib/types.ts`**
    *   **Role:** TypeScript interfaces mirroring Mongoose schemas.
    *   **Key Decision:** Uses "populated" types (e.g., `retailerId: User | string`) because the API sends fully populated objects, not just ObjectIds.
*   **`lib/shopApi.ts`**
    *   **Role:** Service functions for making API calls.
    *   **Key Detail - `fetchProducts`:** This function intentionally *does not* attach the authorization header. The product catalog is a public endpoint, allowing anyone to browse without being logged in.
*   **`app/shop/layout.tsx` & `app/shop/ShopLayoutClient.tsx`**
    *   **Role:** The shell/layout for the shop interface, including the bottom navigation bar.
    *   **Key Detail - Why split into two files?:** Next.js Server Components (`layout.tsx`) can export page `metadata` (like `<title>`), but cannot use client-side hooks. `ShopLayoutClient.tsx` uses `'use client'` and the `usePathname()` hook to conditionally hide the navigation bar on the login page.
*   **`app/shop/login/page.tsx`**
    *   **Role:** The authentication screen for retailers. Stores the received JWT in `localStorage` upon success.
*   **`app/shop/page.tsx`**
    *   **Role:** The main catalog view.
    *   **Key Decision:** Product categories are dynamically derived (`useMemo`) from the fetched product list rather than hardcoded, ensuring the UI always matches the current database state. Filtering (search and category) is handled entirely client-side for immediate responsiveness.

## 3. Key Design Decisions

| Decision | Justification |
| :--- | :--- |
| **Inline SVGs for seed images** | Removes external dependencies; ensures placeholder icons never render as broken links. |
| **Client-side catalog filtering** | The dataset is currently small enough that fetching all products and filtering locally is much faster and provides a snappier UX. |
| **Populated TS Interfaces** | Matches the exact shape of the GET responses out of the box, avoiding type gymnastics on the client. |
| **Price snapshotting (`priceAtPurchase`)** | Ensures historical order totals remain accurate even when base product prices are updated later. |
| **Public product endpoint** | Lowers the barrier to entry; allows unauthenticated exploration of the catalog before committing to login. |

## 4. Recommended Reading Sequence

For a new developer onboarding to Phase 3a, review the files in this order:
1. `server/scripts/seed-products.js` (Understand the data shape and SVG approach)
2. `server/middleware/authMiddleware.js` (Understand how routes are protected)
3. `server/routes/orderRoutes.js` (Observe the route ordering trap)
4. `server/controllers/orderController.js` (Read the core business logic, specifically `createOrder`)
5. `client/lib/types.ts` & `client/lib/shopApi.ts` (Understand the frontend data models and network calls)
6. `client/app/shop/layout.tsx` & `client/app/shop/ShopLayoutClient.tsx` (See the Server/Client component split)
7. `client/app/shop/page.tsx` (Review the client-side filtering and UI rendering)

## 5. Interview-Ready Summary

> "In Phase 3a, we built out the foundation for retailer catalog browsing and authentication. The frontend is built in Next.js, splitting layouts between Server and Client components to leverage both SEO metadata and client-side hooks like `usePathname`. The catalog is public—meaning `fetchProducts` doesn't require auth headers and filtering is handled snappily on the client—while order operations are protected by JWT middleware. On the backend, we ensured data integrity by explicitly snapshotting product prices at the time of purchase in the order controller, and we sidestepped placeholder image rot by generating self-contained SVG data URIs directly in our MongoDB seed script."

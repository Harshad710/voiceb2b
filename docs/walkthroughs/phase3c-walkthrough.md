# Phase 3c: Retailer Order History, Details, and Profile

This phase implements the final retailer-facing views: the order history timeline, detailed individual order views, and a profile page displaying lifetime stats. Crucially, the frontend architecture for this phase is dramatically simplified because of security and data-shaping decisions already made in Phase 3a. Because `server/routes/orderRoutes.js` already securely restricts access using JWT ownership checks (comparing `req.user.userId` against the order's `retailerId`), the frontend does not have to jump through hoops to securely pass IDs in request bodies. Furthermore, because Mongoose `.populate()` was already configured to return full product data embedded inside each order item, the frontend is spared from having to perform complex, multi-request data joins just to display a receipt. 

If these backend guarantees hadn't existed, this phase would have required either fragile client-side aggregation logic (fetching an order, then firing off a dozen `fetchProduct` calls) or a massive backend refactor to stitch data together securely.

## File-by-File Breakdown

### `client/app/shop/login/page.tsx`
*   **Role:** The entry point for the retailer session.
*   **Design Decision (Identity Resolution):** To fetch a retailer's order history, the frontend needs to know their `retailerId`. Instead of adding a heavy `jwt-decode` library to parse the token, or creating a new `/api/auth/me` network endpoint to fetch the user profile, we explicitly checked `server/controllers/authController.js`. We found that the existing `login` response already returns a full `user` object (`id`, `name`, `phone`, `address`). The most performant decision was to simply cache this payload in `localStorage` as `retailer_data` during login.

### `client/lib/shopApi.ts`
*   **Role:** Houses the shared fetch utilities and auth helpers for the shop interface.
*   **Design Decision:** Added `getRetailerData()` and `logoutRetailer()` to synchronously expose the `localStorage` identity cached by the login page, ensuring all three new views (Orders, Detail, Profile) source their identity from a single, consistent helper without duplicating parsing logic.

### `client/app/shop/orders/page.tsx`
*   **Role:** The chronological order history list.
*   **Data Strategy:** Fetches from `GET /api/orders/retailer/:retailerId`. It deliberately does *not* attempt to fetch or compute individual product details, trusting the backend's `populate()` to provide exactly the summarized state needed for the list view.

### `client/app/shop/orders/[id]/page.tsx`
*   **Role:** The detailed view for a single order.
*   **Data Strategy:** Fetches from `GET /api/orders/:id`. Like the list view, it relies entirely on the server-authoritative payload. It maps over `order.items` directly, safely trusting that `item.productId` already contains the full nested product object.

### `client/app/shop/profile/page.tsx`
*   **Role:** The account overview screen.
*   **Design Decision (Client-Side Analytics):** This page displays basic identity (from `localStorage`) and lifetime statistics (Total Orders, Lifetime Spent). Rather than building a dedicated backend analytics endpoint, the component fetches the exact same `GET /api/orders/retailer/:retailerId` endpoint used by the history page, and runs a client-side `.reduce()` to compute the totals. **The Trade-off:** This saves backend routing and controller complexity for a simple calculation, but requires the client to download the full order history payload. This is perfectly acceptable for the MVP scale, but would eventually need a dedicated lightweight backend endpoint if a retailer accumulates thousands of orders.

### `server/controllers/orderController.js`
*   **Role:** The backend controller handling order queries.
*   **Design Decision (Bug Fix):** Modified to remove restrictive field selectors from the `.populate('items.productId', 'name brand price')` calls. Without this fix, the backend actively stripped out `imageUrl`, preventing the frontend from rendering product images despite the data existing in the database.

### `client/components/admin/StatusSelect.tsx`
*   **Role:** A shared component for updating order statuses.
*   **Design Decision:** A minor TypeScript fix to accept `string | null` in its change handler, satisfying the strict build compiler.

---

## Recommended Reading Sequence

The data-before-UI pattern established in earlier phases strictly holds true for Phase 3c, but with a slight twist: the foundational "state" here originates from an auth payload rather than a fresh database schema. Because the UI's ability to fetch orders depends entirely on knowing *who* is logged in, you must trace the retailer's identity from the backend login response down into the UI components.

To understand how identity drives the views, read the files in this order:
1. **`server/controllers/authController.js`**: Start here to verify the exact shape of the `user` payload returned upon a successful login (the ultimate source of truth for identity).
2. **`client/app/shop/login/page.tsx`**: See how that `user` payload is intercepted and cached in `localStorage` alongside the JWT.
3. **`client/lib/shopApi.ts`**: Understand how `getRetailerData()` exposes that cached identity synchronously to the rest of the application.
4. **`server/controllers/orderController.js`**: See how the backend shapes the data (via `.populate()`) that the frontend will eventually consume.
5. **`client/app/shop/orders/page.tsx`** & **`client/app/shop/profile/page.tsx`**: See how these top-level views consume the identity from `shopApi.ts` to trigger their respective data fetches.
6. **`client/app/shop/orders/[id]/page.tsx`**: Finally, see how the detail view drills down into the fully populated data structure defined by the backend controller.

---

## Request Lifecycle

The following maps out exactly how data flows from user action to rendered UI for the three major features in this phase.

### (a) Loading Order History
1. **[READ]** The user taps the "Orders" tab in the bottom navigation.
2. **[READ]** `client/app/shop/orders/page.tsx` mounts and synchronously calls `getRetailerData()` from local storage to extract the `retailerId`.
3. **[READ]** The component executes an HTTP GET to `/api/orders/retailer/:retailerId`, attaching the JWT via `retailerAuthHeaders`.
4. **[READ]** On the backend, `authMiddleware` validates the JWT signature, and `orderController.js` enforces ownership by asserting that `req.params.retailerId === req.user.userId`.
5. **[READ]** The database queries the orders, deeply populating the `items.productId` fields, and returns the JSON payload.
6. **[RENDER]** The frontend stores the payload in local state and maps over the array to render the chronological list.

### (b) Drilling into Order Detail
1. **[READ]** The user clicks an order row, navigating to `/shop/orders/[id]`.
2. **[READ]** `client/app/shop/orders/[id]/page.tsx` asynchronously unwraps the Next.js dynamic route `params` using React's `use()` hook to extract the `id`.
3. **[READ]** The component executes an HTTP GET to `/api/orders/:id`.
4. **[READ]** The backend enforces ownership by asserting that the fetched order's `retailerId` matches the JWT's `req.user.userId`.
5. **[READ]** The database returns the single order, fully populating line items (including the newly restored `imageUrl`).
6. **[RENDER]** The frontend renders the receipt, iterating over the nested `items` array.

### (c) Computing Profile Stats
1. **[READ]** The user taps the "Profile" tab, mounting `client/app/shop/profile/page.tsx`.
2. **[READ]** The component synchronously extracts the cached identity (`name`, `phone`, `address`) from `getRetailerData()`.
3. **[READ]** Concurrently, it triggers an HTTP GET to `/api/orders/retailer/:retailerId`.
4. **[COMPUTE]** Upon receiving the JSON array of orders, the client executes a local `.reduce()` to aggregate `totalOrders` (array length) and `lifetimeSpent` (sum of `totalAmount`).
5. **[RENDER]** The aggregated stats and local identity are painted to the DOM.

---

## Resolved Bugs Reference

*   **Async Route Params:** Next.js 16 dynamic route `params` are asynchronous; accessing them synchronously throws an error. Fixed by unwrapping them via React's `use()` hook.
*   **SVG Data-URI Incompatibility:** The Next.js `<Image>` component's optimization pipeline failed to render the seeded SVG data-URIs. Fixed by reverting to a standard HTML `<img>` tag.
*   **Restrictive Populate Selector:** Backend `.populate()` statements were explicitly restricting fields, silently stripping `imageUrl` from the API response. Fixed by removing the restriction to return the full product document.
*   **Dangling Product Reference (Phantom Item):** If a product was deleted, `populate()` returned `null`, and the UI silently dropped the entire line item. Fixed by rendering a fallback row that displays the historic price and quantity (which are safely stored on the order document itself), similar to the Phase 3b cart bug but explicitly leveraging historical snapshot data.

---

## Self-Test Questions

1. Why was it safe for the frontend order detail page to rely solely on a single `GET /api/orders/:id` request without needing to make additional parallel fetch requests for product images or names?
2. How does the backend guarantee that a malicious user cannot view another retailer's order history, and what specific variables are compared during this server-side check?
3. What is the specific architectural trade-off of calculating the Profile page's "Lifetime Spent" metric entirely on the client side?
4. If `orderController.js` did *not* use Mongoose `.populate()` for line items, how would the data flow lifecycle for the Order Detail page have to change?
5. Which bug from this phase was entirely invisible to TypeScript build checks and required querying the raw database to diagnose?

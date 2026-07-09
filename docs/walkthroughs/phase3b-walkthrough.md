# Phase 3b: Cart, Checkout, and Order Creation

This phase implements the retailer cart and checkout flow entirely on the frontend. It allows retailers to add items to a persistent cart, review their selections with live pricing, and submit a real order to the backend. 

Crucially, **no backend files were modified in this phase**. Because Phase 1 and Phase 3a already locked down the `POST /api/orders` route—extracting the retailer ID from the JWT and calculating `totalAmount` server-side from live database prices—the frontend can safely just send `{ productId, quantity }` pairs without touching the backend code.

## File-by-File Breakdown

### State & API Layer
*   **`client/lib/cartStore.ts`**
    *   **Role:** A Zustand store persisted to `localStorage` (`voiceb2b_cart`) that holds the retailer's in-progress order.
    *   **Key Decision:** The cart strictly stores **only** `{ productId, quantity }`. It deliberately does not store product names or prices. This guarantees the UI cannot render a stale, cached price from days ago; prices are always resolved live from `fetchProducts()` at display time.
*   **`client/lib/shopApi.ts`**
    *   **Role:** Implements the real `createOrder()` API call to replace the previous stub.
    *   **Key Decision:** Introduces a strongly typed `OrderError` class with distinct failure codes (`AUTH`, `FORBID`, `BAD_REQ`, `NETWORK`, `SERVER`). Instead of silently failing or throwing generic errors, the API layer provides structured codes so the UI can react appropriately (e.g., redirecting to login on `AUTH`, or showing an inline out-of-stock warning on `BAD_REQ`).

### UI Components
*   **`client/app/shop/page.tsx`**
    *   **Role:** The main catalog page, now wired to the cart store.
    *   **Key Decision:** The "Add" button and the "(- qty +)" stepper are mutually exclusive and occupy the exact same flex layout slot. This prevents any layout shift in the product grid when an item's quantity changes from 0 to 1.
*   **`client/app/shop/cart/page.tsx`**
    *   **Role:** The cart review and order submission screen.
    *   **Key Decision (Data Handoff):** Upon successful order creation, the server's full response is stashed in `sessionStorage` (`voiceb2b_last_order`) before redirecting to the confirmation page. This avoids a fragile second network request to fetch the order by ID on the confirmation screen, while keeping the data ephemeral (unlike `localStorage`).
*   **`client/app/shop/checkout/confirmation/page.tsx`**
    *   **Role:** Displays the successful order details.
    *   **Key Decision:** It blindly trusts and displays the `order.totalAmount` and `item.priceAtPurchase` values directly from the server's response. The client performs zero re-computation here, making the server the sole authority on the final invoice.

## Recommended Reading Sequence

To understand how data flows from persistence to presentation, read the files in this order:
1. **`client/lib/cartStore.ts`**: Start at the state layer to see the strict shape of the cart.
2. **`client/lib/shopApi.ts`**: Understand the `createOrder` API contract and error handling.
3. **`client/app/shop/page.tsx`**: See how products are added to the cart state.
4. **`client/app/shop/cart/page.tsx`**: Follow the rendering of the cart and the submission flow.
5. **`client/app/shop/checkout/confirmation/page.tsx`**: See the final handoff of server-authoritative data.

## The "Ghost Item" Bug & Client-Trusted-State

During manual verification, a bug was identified in `client/app/shop/cart/page.tsx`: if a product was deleted from the backend catalog, its `productId` remained in the user's `localStorage` cart. The UI simply filtered out unresolvable items (`.filter(Boolean)`), causing the item to silently vanish from the screen while still artificially inflating the cart badge count. The user had no way to remove the "ghost" item.

**The Fix:** We removed the `.filter(Boolean)` and updated the render map to handle `product: null`. Unresolved products now render a distinct amber "fallback row" with a functional "Remove" button, but no price or stepper.

**The Precedent:** This is exactly the same class of bug as the `totalAmount` price-tampering vulnerability discovered in Phase 1 (documented in `notes.md` and `phase1-walkthrough.md`). Both stem from **client-trusted-state assumptions**:
*   *Phase 1:* The server mistakenly assumed the client's `totalAmount` state was perfectly accurate and untampered.
*   *Phase 3b:* The frontend UI mistakenly assumed the client's local `cartStore` state would perfectly map 1:1 to the server's live product catalog.
In both cases, trusting client state implicitly without handling edge conditions (tampering or desyncs) broke the application.

## Self-Test Questions

1. Why does `cartStore.ts` only store `productId` and `quantity` instead of the full product object?
2. If a product's price increases on the backend while it is sitting in a retailer's local cart, what price will the retailer see on the Cart page, and why?
3. How is the final order data passed from the Cart page to the Confirmation page without making a new `fetch` request?
4. What happens in the UI if a product in the user's cart is deleted from the backend database before they check out?

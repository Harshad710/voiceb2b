# Phase 2: Admin Dashboard

This document covers the frontend Admin Dashboard built with Next.js (App Router), Tailwind CSS, and Shadcn UI. It focuses on the UI for viewing and managing incoming retailer orders.

## Architecture & Reading Sequence

The frontend separates API fetching logic from UI components to maintain clean, reusable code. The recommended reading sequence is:
1. **`client/lib/api.ts`**: The central API fetch layer.
2. **`client/app/admin/layout.tsx`**: The layout shell wrapping the admin pages.
3. **`client/components/admin/AdminSidebar.tsx`**: The navigation sidebar.
4. **`client/app/admin/orders/page.tsx`**: The main order management page containing state logic.
5. **`client/components/admin/OrdersTable.tsx`**: The presentation component for the data grid.
6. **`client/components/admin/StatusSelect.tsx`**: The interactive component for status updates.

## File-by-File Details

### Core Infrastructure
*   **`client/lib/api.ts`**: Centralizes all `fetch()` calls (`fetchOrders`, `updateOrderStatus`).
    *   **Key Decision:** By isolating fetch logic here, components don't need to construct URLs or handle raw response parsing. It also provides a single point to read `NEXT_PUBLIC_API_URL` and later inject auth headers.

### UI Components
*   **`client/components/admin/AdminSidebar.tsx`**: Provides the left-hand navigation menu for the admin portal.
*   **`client/components/admin/StatusBadge.tsx`**: A read-only visual component that renders a colored pill based on the order status (`PENDING`, `PROCESSING`, `DELIVERED`).
*   **`client/components/admin/StatusSelect.tsx`**: An interactive dropdown that allows the admin to change an order's status.
    *   **Key Decision (Optimistic UI):** When the admin changes a status, this component immediately fires a callback to update the local UI state *before* the backend request finishes. If the backend request fails, the component catches the error and reverts the UI back to the previous state. This provides a snappy, responsive user experience.

### Pages & Layouts
*   **`client/app/admin/orders/page.tsx`**: The primary stateful page component. It fetches the orders on mount using `lib/api.ts` and passes them down to the `OrdersTable`. It also provides the `handleStatusUpdate` callback that surgically updates a single order's status in the local state array without requiring a full page refetch.

## Request Lifecycle
1. **Page Load**: `OrdersPage` mounts → `fetchOrders()` is called → Backend returns data → Local state is set → `OrdersTable` renders the data.
2. **Status Update**: Admin selects new status in `StatusSelect` → Optimistic UI updates locally → `updateOrderStatus()` sends PATCH request to backend → On success, state remains updated; on failure, UI reverts.

## Interview Summary
In our conversation for this phase, we discussed the architectural choice of separating `lib/api.ts` from the React components for better maintainability. We also implemented an optimistic UI pattern in the `StatusSelect` component to ensure the dashboard feels instantaneous, while maintaining a safety net to revert state if the API request fails.

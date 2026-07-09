# Phase 2.5 & 2.5b: Auth Infrastructure & Admin Enforcement

This document covers the implementation of the authentication system (JWT & bcrypt), schema additions, and the enforcement of role-based access control (RBAC) for the admin dashboard.

## Architecture & Reading Sequence

The auth system uses stateless JWTs. Passwords are never stored in plaintext. The reading sequence is:
1. **`server/models/User.js`** (Schema updates & pre-save hook)
2. **`server/controllers/authController.js`** (Registration & Login logic)
3. **`server/middleware/authMiddleware.js`** (JWT verification)
4. **`server/middleware/isAdmin.js`** (Role enforcement)
5. **`server/routes/`** (Applying middleware to routes)
6. **`server/scripts/createFirstAdmin.js`** (Bootstrap script)
7. **`client/app/admin/login/page.tsx`** & **`client/app/admin/layout.tsx`** (Frontend auth guards)

## File-by-File Details

### Schema Updates
*   **`server/models/User.js`**: Added a `password` field. 
    *   **Key Decision:** The password field is explicitly marked with `select: false`. This ensures that Mongoose queries do not return the password hash by default, preventing accidental leaks in API responses.
    *   **Key Decision:** Added a `pre('save')` hook using bcrypt. This ensures passwords are automatically hashed before being written to the database. It includes an `isModified('password')` check to prevent re-hashing if other fields are updated. Added a `comparePassword` instance method for login verification.
*   **`server/models/Product.js`**: Added `category` and `imageUrl` fields to support the Phase 3 retailer catalog.
*   **`server/models/Order.js`**: Added `expectedDeliveryDate`. Calculated server-side during order creation (today + 1-4 random days).

### Auth Controllers & Middleware
*   **`server/controllers/authController.js`**: 
    *   `register`: Hard-codes the `role` to `'RETAILER'`. This is a critical security decision that prevents a client from passing `role: 'ADMIN'` in the request body to escalate privileges.
    *   `login`: Uses `.select('+password')` to retrieve the hash for comparison. Returns a vague 401 error ("Invalid phone number or password") for both wrong phone and wrong password to prevent user enumeration.
*   **`server/middleware/authMiddleware.js`**: Expects a `Bearer <token>` in the Authorization header. Verifies the JWT and attaches the decoded payload (`userId`, `role`) to `req.user`.
*   **`server/middleware/isAdmin.js`**: Runs *after* `authMiddleware`. Checks if `req.user.role === 'ADMIN'`. Returns 403 Forbidden otherwise.

### Route Protection
*   **Admin Routes**: Applied `authMiddleware` and `isAdmin` to `GET /api/orders`, `PATCH /api/orders/:id/status`, and all mutating product routes (`POST`, `PUT`, `DELETE`).
*   **User Routes**: Applied `authMiddleware` and `isAdmin` to all `/api/users` routes. This entirely closes the loophole where anonymous users could create accounts via the standard user controller.
*   **Public Routes**: Left `GET /api/products` open so retailers can browse the catalog without a token.

### Bootstrapping & Client Integration
*   **`server/scripts/createFirstAdmin.js`**: A standalone Node.js script that connects directly to MongoDB to create the first admin user. 
    *   **Key Decision:** This script is never exposed as an API route, ensuring admins can only be bootstrapped manually via the server console.
*   **`client/app/admin/login/page.tsx`**: The admin login page. Checks the returned `role` after a successful login. If it is not `'ADMIN'`, it discards the token and shows an error message.
*   **`client/app/admin/layout.tsx`**: Checks `localStorage` for the admin token on mount and redirects to the login page if missing. This is a client-side UX guard; true security is enforced by the backend middleware.
*   **`client/lib/api.ts`**: Updated to read the token from `localStorage` and attach it as a `Bearer` token to the `Authorization` header for all admin API requests.

## Interview Summary
In our conversation, we treated the auth infrastructure and the admin enforcement as a combined preparatory step ("Phase 2.5"). We discussed the importance of hard-coding the `RETAILER` role during registration to prevent privilege escalation. We also clarified that the frontend token check in the layout is merely a UX convenience, while the real security boundary is the backend `isAdmin` middleware. Finally, we confirmed how the standalone `createFirstAdmin.js` script safely bypasses the API to establish the initial admin account.

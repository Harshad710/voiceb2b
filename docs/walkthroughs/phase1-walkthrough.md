# Phase 1: Backend Foundation

This document covers the initial setup of the VoiceB2B backend, establishing the core data models, controllers, routing, and global error handling.

## Architecture & Reading Sequence

The backend follows a standard Node.js/Express MVC-style architecture. The recommended reading sequence for understanding this phase is:
1. **`server/config/db.js`**: Database connection logic.
2. **`server/models/`** (`User.js`, `Product.js`, `Order.js`): Data schemas and constraints.
3. **`server/controllers/`**: Business logic for handling requests.
4. **`server/routes/`**: Route definitions mapping HTTP verbs to controllers.
5. **`server/middleware/errorHandler.js`**: Global error handling.
6. **`server/server.js`**: Application entry point and route mounting.

## File-by-File Details

### Models
*   **`server/models/User.js`**: Defines the user schema with `name`, `phone` (unique), and `role` (`RETAILER` or `ADMIN`).
*   **`server/models/Product.js`**: Defines the product catalog schema.
*   **`server/models/Order.js`**: Defines the order schema. Key design choice: `items` are embedded as a sub-document array rather than referenced. This ensures that the snapshot of the order at the time of purchase is preserved, decoupling it from any future changes to the `Product` collection. It also includes `totalAmount` and `status`.

### Controllers & Key Decisions
*   **`server/controllers/orderController.js`**: Handles order logic. 
    *   **Key Decision (Security Fix):** The `totalAmount` for an order is calculated entirely server-side by iterating over the requested items and multiplying their quantity by `priceAtPurchase`. We explicitly do *not* trust the client to provide a `totalAmount` in the request body to prevent price tampering.

### Routes
*   **`server/routes/orderRoutes.js`**: Maps endpoints to the `orderController`.
    *   **Key Decision (Route Ordering Fix):** The route `GET /retailer/:retailerId` must be defined *before* the dynamic route `GET /:id`. Express evaluates routes top-down. If `/:id` came first, Express would interpret the literal string `"retailer"` as the dynamic `:id` parameter, breaking the endpoint.

### Middleware
*   **`server/middleware/errorHandler.js`**: A centralized error handler that catches all exceptions thrown in controllers (passed via `next(error)`). It formats the errors into a consistent JSON response and handles Mongoose-specific errors (like CastError or ValidationError) gracefully.

## Interview Summary
In our conversation for this phase, we discussed the necessity of moving price calculations to the server to prevent client-side tampering ("never trust client-side data"). We also resolved an Express routing collision by ensuring specific routes are declared before generic dynamic routes, emphasizing the importance of route order in Express.

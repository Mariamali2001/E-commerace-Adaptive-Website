This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).  
It now ships with a lightweight backend (implemented with App Router route handlers) that powers product, review, cart, wishlist, and authentication flows.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Mood Detection Setup (Optional)

The mood detection feature uses Hugging Face Inference API. To enable it:

1. Get a token from https://huggingface.co/settings/tokens (create with "read" permissions)
2. Create `.env.local` file:
   ```bash
   HF_TOKEN=your_token_here
   ```
3. Restart the dev server

**Note:** If `HF_TOKEN` is not set, the system will use keyword-based mood detection as a fallback.

### Demo credentials

- Email: `demo@smartshop.dev`
- Password: `demo1234`

These accounts are stored in-memory. When the dev server restarts, the data resets.

## Backend overview

| Domain     | Endpoints                                                                                     | Notes                                      |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Products   | `GET /api/products`, `POST /api/products`, `GET/PATCH/DELETE /api/products/[slug]`            | In-memory store seeded from `src/data`     |
| Reviews    | `GET/POST /api/products/[slug]/reviews`                                                       | Appends reviews to the in-memory registry  |
| Cart       | `GET/POST/DELETE /api/cart`, `PATCH/DELETE /api/cart/[key]`                                   | Session cookie (`smartshop_cart`) per user |
| Wishlist   | `GET/POST /api/wishlist`, `DELETE /api/wishlist/[productId]`                                  | Session cookie (`smartshop_wishlist`)      |
| Auth       | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`  | Cookie-based session (`smartshop_session`) |

All data is stored in memory for simplicity, but the repository isolates the data layer (`src/server/*`) so it can be swapped with a real database later.

### Example requests

```bash
# Fetch products
curl http://localhost:3000/api/products

# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"changeme"}'

# Add to cart
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"productId":"p1","slug":"one-life-graphic-t-shirt","title":"ONE LIFE GRAPHIC T-SHIRT","price":260,"image":"/images/prod1.jpg"}'
```

> **Note:** Because the storage is in-memory, restart the dev server to reset the datasets.

## Learn More


- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

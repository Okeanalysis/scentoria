# Scentoria — Luxury Perfume Store

A full-stack perfume store with customer storefront, cart, checkout, and admin panel.

## Features

- **Shop** — Browse and add perfumes to cart
- **Cart** — Adjust quantities, remove items
- **Checkout** — Customer enters name, email, phone, delivery location & address
- **OPay Payment** — Displays account number 9097029635 with order reference as narration
- **Admin Panel**
  - Upload perfume photos, set names, prices & descriptions
  - Manage delivery zones and fees per location
  - View all orders, update order status (Pending → Confirmed → Dispatched)

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)

```bash
npm i -g vercel
cd scentoria
vercel
```

Follow the prompts. Your site will be live in ~30 seconds.

### Option 2 — Vercel Dashboard (drag & drop)

1. Go to [vercel.com](https://vercel.com) and sign up / log in
2. Click **"Add New Project"**
3. Click **"Upload"** and drag the entire `scentoria` folder
4. Click **Deploy**
5. Done — your store is live!

### Option 3 — GitHub

1. Push this folder to a GitHub repo
2. Import the repo on [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects the config and deploys

## Data Storage

All data (products, orders, delivery zones, cart) is stored in the browser's **localStorage**. This means:

- Data persists across sessions on the same browser/device
- The admin panel and customer use the same browser data
- For a shared backend (multiple devices), you would upgrade to a database like Supabase or Firebase

## File Structure

```
scentoria/
├── public/
│   ├── index.html    ← Full app (shop + admin)
│   ├── style.css     ← All styles
│   └── app.js        ← All logic
├── vercel.json       ← Vercel deployment config
└── README.md
```

## Admin Panel

Navigate to the **Admin** button in the top nav. No login required.

1. **Products tab** — Upload image, add name/price/description → "Add to Collection"
2. **Delivery Zones tab** — Edit location names and fees → "Save Delivery Zones"
3. **Orders tab** — View all orders, change status via dropdown

## OPay Flow

1. Customer adds items → fills details → sees OPay number **9097029635**
2. Customer transfers total using their order reference (e.g. SCT-ABC123) as narration
3. You check your OPay app, match the reference, then mark order as **Confirmed** in admin
4. Mark as **Dispatched** once shipped

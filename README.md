# Outfyt Admin Panel

A production-ready internal admin dashboard for **Outfyt** - a multi-vendor fashion delivery platform.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **ShadCN UI**
- **Axios** (API client)
- **React Hook Form + Zod** (form validation)
- **Recharts** (analytics charts)
- **Lucide React** (icons)

## Features

### Authentication
- Admin login with email/password
- JWT token storage and management
- Protected routes with auto-redirect

### Dashboard
- Total orders, revenue, active stores, active riders
- Recent orders table
- Order status breakdown

### Orders Management
- Paginated table with search and filters
- Status and date range filters
- Order detail view with timeline
- Update status, cancel order, issue refund
- Assign rider to order

### Users Management
- Search by phone/email
- Block/unblock users
- User details and order history

### Stores Management
- Approve/reject pending stores
- View store products
- Disable/enable stores

### Riders Management
- Approve/suspend delivery partners
- View rider details and ratings

### Tickets (Support)
- Ticket listing with filters
- Conversation view
- Reply to tickets
- Resolve tickets
- Priority management

### Payments
- Transaction listing
- Process refunds

### Analytics
- Orders count chart
- Revenue chart
- Active users chart
- Date range selection

### Global Search
- Search orders, users, stores
- Debounced search
- Quick navigation

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the admin panel.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard)
│   │   ├── orders/
│   │   ├── users/
│   │   ├── stores/
│   │   ├── riders/
│   │   ├── tickets/
│   │   ├── payments/
│   │   └── analytics/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── AdminLayout.tsx
│   │   └── GlobalSearch.tsx
│   └── ui/ (ShadCN components)
├── services/
│   └── api/
│       ├── config.ts
│       ├── auth.ts
│       ├── orders.ts
│       ├── users.ts
│       ├── stores.ts
│       ├── riders.ts
│       ├── tickets.ts
│       ├── payments.ts
│       ├── analytics.ts
│       └── search.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── types/
│   └── index.ts
└── lib/
    └── utils.ts
```

## API Integration

The admin panel expects a REST API with the following endpoints:

### Auth
- `POST /admin/auth/login`
- `POST /admin/auth/logout`
- `GET /admin/auth/profile`

### Orders
- `GET /admin/orders`
- `GET /admin/orders/:id`
- `PUT /admin/orders/:id/status`
- `PUT /admin/orders/:id/cancel`
- `POST /admin/orders/:id/refund`

### Users
- `GET /admin/users`
- `PUT /admin/users/:id/block`
- `PUT /admin/users/:id/unblock`

### Stores
- `GET /admin/stores`
- `PUT /admin/stores/:id/approve`
- `PUT /admin/stores/:id/reject`
- `PUT /admin/stores/:id/disable`

### Riders
- `GET /admin/riders`
- `PUT /admin/riders/:id/approve`
- `PUT /admin/riders/:id/suspend`

### Tickets
- `GET /admin/tickets`
- `GET /admin/tickets/:id`
- `POST /admin/tickets/:id/reply`
- `PUT /admin/tickets/:id/resolve`

### Payments
- `GET /admin/payments`
- `POST /admin/payments/:id/refund`

### Analytics
- `GET /admin/analytics/dashboard`
- `GET /admin/analytics/full`

## Performance Features

- Pagination on all list views
- Debounced search (300ms)
- Lazy loading with React Suspense
- Optimized re-renders with useCallback/useMemo

## Deployment

Build for production:

```bash
npm run build
npm start
```

Deploy to Vercel:

```bash
vercel --prod
```

## License

Private - Internal use only for Outfyt operations team.

# Car Decoration Management System

A production-quality Business Management System (ERP Lite) for a Car Decoration & Accessories Shop.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Shadcn UI, TypeScript
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT + Refresh Tokens, bcrypt

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Git

### Installation

```bash
# Install all dependencies
npm run install:all

# Set up database
cd server
# Edit .env with your PostgreSQL password
npx prisma migrate dev
npm run db:seed

# Start development servers
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd ../client
npm run dev
```

### Default Login
- **Admin**: admin@cardecor.com / admin123
- **Manager**: manager@cardecor.com / manager123
- **Cashier**: cashier@cardecor.com / cashier123

## Project Structure

```
car-decoration-system/
├── client/          # React Frontend (Vite + Tailwind + Shadcn)
├── server/          # Express Backend (Prisma + PostgreSQL)
├── .gitignore
├── package.json     # Root scripts
└── README.md
```

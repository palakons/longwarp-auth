# Project Specification: `longwarp-auth` (Central Authentication & Identity Service)

A complete, production-ready, lightweight central authentication and user identity service for the `longwarp.com` platform. Provides Google OAuth 2.0 Single Sign-On (SSO) across all subdomains (`shabu.longwarp.com`, `toll.longwarp.com`, `trade.longwarp.com`) using HTTP-Only cookies (`.longwarp.com`).

---

## 1. Project Overview & Architecture

* **Service Domain**: `auth.longwarp.com`
* **Target Stack**: Node.js + TypeScript + Express + PostgreSQL (Prisma ORM)
* **Authentication Provider**: Google OAuth 2.0 (`google-auth-library` or `passport-google-oauth20`)
* **Session Protocol**: JSON Web Tokens (JWT) stored in HTTP-Only, Secure cookies scoped to domain `.longwarp.com`
* **Production Binding**: Listens on `127.0.0.1:4000` (Reverse proxied by Nginx)

---

## 2. Technical Stack & Dependencies

```json
{
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.4.5",
    "jsonwebtoken": "^9.0.2",
    "google-auth-library": "^9.10.0",
    "@prisma/client": "^5.14.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.12",
    "@types/cors": "^2.8.17",
    "@types/cookie-parser": "^1.4.7",
    "@types/jsonwebtoken": "^9.0.6",
    "typescript": "^5.4.5",
    "ts-node-dev": "^2.0.0",
    "prisma": "^5.14.0"
  }
}
```

---

## 3. Database Schema (PostgreSQL / Prisma)

Create `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String          @id @default(uuid())
  googleId      String          @unique @map("google_id")
  email         String          @unique
  displayName   String?         @map("display_name")
  avatarUrl     String?         @map("avatar_url")
  createdAt     DateTime        @default(now()) @map("created_at")
  lastLoginAt   DateTime        @default(now()) @map("last_login_at")
  
  // Relations to sub-service data
  shabuSessions ShabuSession[]

  @@map("users")
}

model ShabuSession {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionDate  DateTime @default(now()) @map("session_date")
  totalTrays   Int      @map("total_trays")
  totalCalories Int     @map("total_calories")
  proteinG     Float    @map("protein_g")
  carbsG       Float    @map("carbs_g")
  fatG         Float    @map("fat_g")
  costThb      Float    @default(299.00) @map("cost_thb")
  itemsJson    Json     @map("items_json")
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("shabu_dining_sessions")
}
```

---

## 4. Environment Configuration (`.env.example`)

```env
# Server Runtime
NODE_ENV=production
HOST=127.0.0.1
PORT=4000

# Canonical PostgreSQL Connection String
DATABASE_URL=postgresql://auth_user:secure_password@127.0.0.1:5432/longwarp_db

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://auth.longwarp.com/auth/google/callback

# JWT & Cookie Security
JWT_SECRET=super_secret_jwt_signing_key_change_me
COOKIE_DOMAIN=.longwarp.com
ALLOWED_ORIGINS=https://shabu.longwarp.com,https://toll.longwarp.com,https://trade.longwarp.com
```

---

## 5. API Endpoints & Specification

### A. System & Health Check
- `GET /health`: Returns `{ status: "ok", service: "longwarp-auth", timestamp: "..." }`

### B. Google OAuth SSO Flow
- `GET /auth/google?redirect=https://shabu.longwarp.com`:
  - Initiates Google OAuth2 authentication flow.
  - Stores caller redirect URL in session or state parameter.
- `GET /auth/google/callback`:
  - Handles authorization code from Google.
  - Fetches user profile (`googleId`, `email`, `displayName`, `avatarUrl`).
  - Upserts user in `users` database table.
  - Issues HTTP-Only JWT Cookie (`auth_token`, `domain=.longwarp.com`, `maxAge=30 days`).
  - Redirects back to the caller app (`redirect` URL).

### C. Session & User Verification
- `GET /auth/me`:
  - Verifies `auth_token` cookie.
  - Returns authenticated user profile:
    ```json
    {
      "authenticated": true,
      "user": {
        "id": "uuid",
        "email": "user@gmail.com",
        "displayName": "John Doe",
        "avatarUrl": "https://lh3.googleusercontent.com/..."
      }
    }
    ```
- `POST /auth/logout`:
  - Clears `auth_token` cookie across domain `.longwarp.com`.
  - Returns `{ success: true, message: "Logged out" }`.

### D. Sub-Service Data API (`Shabu Sessions`)
- `POST /api/shabu/sessions`:
  - Requires authenticated `auth_token` cookie.
  - Accepts JSON payload:
    ```json
    {
      "totalTrays": 14,
      "totalCalories": 1250,
      "proteinG": 85.5,
      "carbsG": 110.0,
      "fatG": 32.0,
      "costThb": 299,
      "itemsJson": [
        { "id": "pork-slice", "name_th": "หมูสไลซ์", "count": 5, "calories": 550 }
      ]
    }
    ```
  - Saves new entry in `shabu_dining_sessions` linked to `user.id`.
- `GET /api/shabu/sessions`:
  - Returns all past dining sessions for the authenticated user ordered by `sessionDate DESC`.

---

## 6. CORS & Cookie Middleware Setup

```typescript
import cors from 'cors';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://shabu.longwarp.com'],
  credentials: true, // Crucial for passing HTTP-Only cookies across subdomains
}));

// Cookie setting helper
export const sendAuthCookie = (res: Response, token: string) => {
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || '.longwarp.com',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
  });
};
```

---

## 7. Step-by-Step Execution Guide for AI Vibe-Coder

1. Initialize project with `npm init -y` and install dependencies.
2. Setup `tsconfig.json` and `.env.example`.
3. Initialize Prisma with `npx prisma init` and add the `schema.prisma` above.
4. Create Express app with `src/server.ts` binding to `127.0.0.1:4000`.
5. Implement Google OAuth route handlers in `src/routes/auth.ts`.
6. Implement Shabu session API routes in `src/routes/shabu.ts`.
7. Add `/health` route.
8. Add `"build": "tsc"`, `"start": "node dist/server.js"`, and `"migrate": "prisma migrate deploy"` to `package.json`.

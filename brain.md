# CineFlix — Project Brain & Knowledge Base (`brain.md`)

> **CineFlix** is a premium, cinematic movie recommendation and streaming platform built with **React**, **Vite**, **Supabase**, and custom **Vanilla CSS Glassmorphism**.

---

## 1. Project Overview & Architecture

- **Application Name**: CineFlix
- **Tagline**: *Your Premium Global Cinema Platform*
- **Primary Runtime**: React 18 (Vite Bundler)
- **Styling Paradigm**: Pure Vanilla CSS with modular components, dark mode aesthetics, glassmorphism, 3D tilt interactions, and animated light runners.
- **Backend Services**: Supabase (Authentication, PostgreSQL Database, Row-Level Security, Edge Functions)
- **External APIs**: The Movie Database (TMDB) API for movie metadata, trending feeds, posters, and trailers.
- **Project Location**: `D:\Own projects\MovieRecommender`

---

## 2. Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Declarative component-based UI |
| **Build Tooling** | Vite | Rapid HMR and optimized production bundles |
| **Routing** | React Router v6 | Client-side navigation & route guards |
| **Database & Auth** | Supabase | Auth sessions, user profiles, and PostgreSQL database |
| **Styling** | Vanilla CSS | Bespoke glassmorphism, responsive grids, and CSS animations |
| **Security** | Custom Rate Limiter | In-memory brute-force protection & cooldown lockouts |
| **State Management** | Context API | `AuthContext`, `MovieContext`, `ToastContext` |

---

## 3. Directory & Codebase Map

```text
D:\Own projects\MovieRecommender\
├── public/                 # Favicon, icons, static assets
├── src/
│   ├── assets/             # Logos, hero images, SVG graphics
│   ├── components/         # Reusable presentation & interactive components
│   │   ├── AdminFooter.jsx       # Admin layout footer
│   │   ├── AdminHeader.jsx       # Admin header with breadcrumbs & user profile
│   │   ├── AdminLayout.jsx       # Wrapper layout for /admin routes
│   │   ├── AdminRoute.jsx        # Protected route guard for admin privileges
│   │   ├── AdminSidebar.jsx      # Navigation sidebar for admin sections
│   │   ├── AuthModal.jsx         # User login/registration with security validation
│   │   ├── DottedOffsetButton.jsx # Interactive button with dotted offset shadows
│   │   ├── Footer.jsx            # Public site footer with quick links
│   │   ├── HeroSpotlight.jsx     # Cinematic hero banner carousel with trailer modal
│   │   ├── HomeSuggestionsRail.jsx # Curated recommendation feeds and genre filters
│   │   ├── KexsioCard.jsx        # 3D interactive card with border light runners & cursor glow
│   │   ├── LiquidGlassButton.jsx # Specular liquid glass action button
│   │   ├── Loader.jsx            # Animated cinema reel loading spinner
│   │   ├── MobileBottomNav.jsx   # Mobile floating bottom navigation bar
│   │   ├── MovieCard.jsx         # Movie poster card with hover actions & favorite toggle
│   │   ├── MovieModal.jsx        # Deep-dive movie details, cast, trailer, and reviews
│   │   ├── NavBar.jsx            # Primary desktop navigation & search
│   │   ├── PulseRoll.jsx         # Dynamic pulse progress indicator
│   │   ├── SkeletonCard.jsx      # Shimmer loading skeleton
│   │   ├── StatsBar.jsx          # Metric cards for platform statistics
│   │   └── WavePathMarquee.jsx   # Fluid marquee banner for trending films
│   ├── contexts/           # Global application state
│   │   ├── AuthContext.jsx       # Supabase user session, profile, and role state
│   │   ├── MovieContext.jsx      # Favorites, watchlist, and custom watch tracking
│   │   └── ToastContext.jsx      # Global popup notifications & alerts
│   ├── css/                # Component and page stylesheets (Vanilla CSS)
│   ├── data/               # Curated local fallback movies & offline suggestions
│   ├── hooks/              # Custom hooks (`useSiteSettings`, `useDebounce`)
│   ├── lib/                # Third-party initializations (`supabase.js`)
│   ├── pages/              # Primary view controllers
│   │   ├── Home.jsx              # Main catalog, search, and category exploration
│   │   ├── Favorite.jsx          # User saved favorites grid
│   │   ├── Profile.jsx           # User account profile, security, and preferences
│   │   ├── LoaderShowcase.jsx    # Visual test playground for platform loaders
│   │   └── admin/                # Admin Panel management pages
│   │       ├── AdminDashboard.jsx  # Platform KPI overview and quick actions
│   │       ├── AdminMovies.jsx     # Full movie catalog CRUD & TMDB sync
│   │       ├── AdminGenres.jsx     # Genre taxonomy & display order
│   │       ├── AdminUsers.jsx      # User role promotion, demotion, and blocking
│   │       ├── AdminReviews.jsx    # Community review moderation & deletion
│   │       ├── AdminAnalytics.jsx  # Traffic, ratings, and genre analytics
│   │       ├── AdminSettings.jsx   # Global site branding, tagline, and feature flags
│   │       └── AdminLogin.jsx      # Dedicated administrator gateway
│   ├── services/           # TMDB API client and network handlers
│   └── utils/              # Helper functions (rate limiting, poster resolvers)
├── supabase/               # Supabase Edge Functions (`delete-auth-user`)
├── .env                    # Environment variables (API keys & project URLs)
├── package.json            # Project dependencies and script declarations
└── vite.config.js          # Vite bundler configuration
```

---

## 4. Key UI & Visual Design System

### 4.1 KexsioCard (`src/components/KexsioCard.jsx`)
- **3D Tilt**: Physics-based cursor tracking (`perspective: 1000px`, dynamic `rotateX` / `rotateY`).
- **Border Runners**: Multi-layer animated light beams revolving around card contours on a continuous loop.
- **Pointer Glow**: Radial light gradient following exact cursor coordinates over dark surfaces.

### 4.2 LiquidGlassButton (`src/components/LiquidGlassButton.jsx`)
- **Stadium Pill Geometry**: Calculated dynamically via `radiusFromPercent` based on button aspect ratio.
- **Glass Refraction**: Subtle multi-stop linear gradients, specular light highlights on `:hover`, and translucent dark borders.

### 4.3 Color Palette & Aesthetic Tokens
- **Background**: `#090a0f` to `#12151e` (OLED-grade deep dark cinema theme)
- **Primary Accent**: `#e50914` (Cinema Red), hover: `#ff4d4d`
- **Glass Containers**: `rgba(18, 21, 30, 0.92)` with `backdrop-filter: blur(16px)`
- **Text**: Primary `#ffffff`, Secondary `#94a3b8`, Muted `#64748b`

---

## 5. Security & Authentication Architecture

### 5.1 Account Creation & Input Validation (`AuthModal.jsx`)
- **Full Name**: Strict regex (`/^[a-zA-Z\s'-]+$/`). No numbers or special symbols allowed. Length constrained to 2–50 characters.
- **Email**: Strict RFC-compliant validation (`/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/`). Rejects whitespace, consecutive dots, and malformed domains.
- **Password**: Minimum 8 characters with required complexity:
  - At least 1 uppercase letter (`A-Z`)
  - At least 1 lowercase letter (`a-z`)
  - At least 1 numeric digit (`0-9`)
  - At least 1 special character (`!@#$%^&*...`)
- **Interactive Security Meter**: Real-time visual strength indicator (Weak, Fair, Good, Strong) with animated status bars and criteria checklist.

### 5.2 Brute-Force Rate Limiting (`src/utils/rateLimiter.js`)
- Maximum **5 failed attempts** within a **120-second sliding window**.
- Automatic **60-second security lockout** with real-time countdown timer before retrying.

### 5.3 Role-Based Access Control (RBAC)
- User role stored in Supabase `profiles.role` (`"user"` or `"admin"`).
- Protected by `AdminRoute.jsx`: redirects unauthenticated or non-admin users to `/admin/login`.
- Auto-redirect: Authenticated admins visiting `/admin/login` are forwarded directly to `/admin`.

---

## 6. Database Schema (`Supabase PostgreSQL`)

### `profiles` Table
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique,
  role text default 'user' check (role in ('user', 'admin')),
  is_blocked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

### Edge Functions (`supabase/functions/`)
- `delete-auth-user`: Runs under Supabase Service Role to completely erase user records from `auth.users` alongside database profiles.

---

## 7. Configuration & Environment Variables

The `.env` file at project root contains:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>

# TMDB Configuration
VITE_TMDB_API_KEY=<tmdb-api-key>
```

---

## 8. Common Development Commands

```powershell
# Start local development server (Vite)
npm run dev

# Build for production distribution
npm run build

# Preview production build locally
npm run preview
```

---

## 9. Best Practices & Engineering Guidelines

1. **Vanilla CSS Integrity**: Maintain styling modularity inside `src/css/`. Avoid adding third-party CSS utility frameworks (e.g. Tailwind) unless explicitly requested.
2. **Error Handling**: Always handle asynchronous Supabase and TMDB queries with clean user-facing error notifications through `useToast`.
3. **Session State**: Preserve session synchronization between `auth.onAuthStateChange` and database profile checks inside `AuthContext.jsx`.
4. **Responsive Testing**: Ensure all interactive cards and tables render smoothly on mobile viewports (< 480px) and ultrawide displays.

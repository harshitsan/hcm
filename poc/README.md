# Enetro Frontend

A modern, feature-rich admin dashboard built with React, TypeScript, and TanStack Router. ReadyWire provides comprehensive business management tools including leads tracking, task management, user administration, and analytics.

## 🚀 Features

### Core Modules

- **Dashboard** - Overview with key metrics and analytics
- **Leads Management** - Comprehensive leads tracking and performance analytics
- **Task Management** - Full CRUD operations with bulk actions
- **User Management** - User administration with role-based access
- **Contacts** - Contact management system
- **Insurance** - Insurance-related features
- **Service** - Service management tools
- **Call Operations** - Call center operations
- **Track Rep** - Sales representative tracking
- **Used Cars** - Vehicle inventory management

### Technical Features

- **Authentication** - Secure sign-in/sign-up with OTP verification
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Data Tables** - Advanced tables with sorting, filtering, and pagination
- **Charts & Analytics** - Interactive charts using ApexCharts
- **Real-time Updates** - Live data synchronization
- **Error Handling** - Comprehensive error boundaries and user feedback

## 🛠️ Tech Stack

### Core Framework

- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety with strict mode
- **Vite** - Fast build tool and development server
- **TanStack Router** - Type-safe routing with file-based routing
- **TanStack Query** - Server state management and caching
- **TanStack Table** - Headless table library with sorting, filtering, pagination
- **TanStack Virtual** - Virtual scrolling for large datasets

### HTTP Client

- **Axios** - Promise-based HTTP client for API requests

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons
- **Phosphor React** - Additional icon set
- **Sonner** - Toast notifications
- **Class Variance Authority** - Component variant management

### State Management

- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **TanStack Query** - Server state and caching

### Data Visualization

- **ApexCharts** - Interactive charts
- **React ApexCharts** - React wrapper for ApexCharts

### Utilities

- **date-fns** - Date utility library
- **xlsx** - Excel file parsing and generation
- **clsx** & **tailwind-merge** - Conditional class name utilities
- **cmdk** - Command menu component
- **input-otp** - OTP input component
- **react-day-picker** - Date picker component
- **react-top-loading-bar** - Top loading bar indicator

### Development Tools

- **ESLint** - Code linting with React hooks rules
- **Prettier** - Code formatting with import sorting
- **Knip** - Unused code detection
- **TypeScript ESLint** - TypeScript-specific linting
- **Husky** - Git hooks for code quality
- **SWC** - Fast TypeScript/JavaScript compiler

## 🏗️ Architecture: 4-Layer Approach

ReadyWire follows a clean, layered architecture pattern that separates concerns and promotes maintainability:

| Layer                   | Folder                                      | Responsibility                                            |
| ----------------------- | ------------------------------------------- | --------------------------------------------------------- |
| **Service**             | `/services/` or `/features/*/services/`     | Pure API calls (axios/fetch). No React here.              |
| **React Query Hook**    | `/query/` or `/features/*/hooks/query`      | Data fetching + caching (React Query). Consumes services. |
| **Business Logic Hook** | `/hooks/` or `/features/*/hooks/`           | Business/UI logic. Consumes API hooks.                    |
| **Component**           | `/components/` or `/features/*/components/` | Pure presentation (no logic or API calls).                |

### Layer Responsibilities

1. **Service Layer** (`/services/`)
   - Pure functions that make HTTP requests using Axios
   - No React dependencies
   - Returns promises with typed responses
   - Handles request/response transformation

2. **React Query Hook Layer** (`/query/`)
   - React Query hooks (`useQuery`, `useMutation`)
   - Manages caching, refetching, and loading states
   - Consumes service layer functions
   - Provides typed hooks for components

3. **Business Logic Hook Layer** (`/hooks/`)
   - Business logic and UI state management
   - Combines multiple API hooks
   - Handles complex state transformations
   - Manages component-specific logic

4. **Component Layer** (`/components/`)
   - Pure presentation components
   - Receives data via props or logic hooks
   - No direct API calls or business logic
   - Focuses on rendering and user interaction

### Example Flow

```
Component → Logic Hook → React Query Hook → Service → API
```

### Code Example

Here's a practical example of the 4-layer architecture:

**1. Service Layer** (`/services/leads-summary.service.ts`)

```typescript
import { apiClient } from '@/lib/api-client'
import type {
  LeadsSummaryRequest,
  LeadsSummaryData,
} from '../types/leads-summary'

export const fetchLeadsSummary = async (
  filters: LeadsSummaryRequest
): Promise<LeadsSummaryData> => {
  const response = await apiClient.get<LeadsSummaryData>('/leads/summary', {
    params: filters,
  })
  return response.data
}
```

**2. React Query Hook Layer** (`/hook/query/use-leads-summary.ts`)

```typescript
import { useQuery } from '@tanstack/react-query'
import { fetchLeadsSummary } from '../services/leads-summary.service'
import type {
  UseLeadsSummaryOptions,
  UseLeadsSummaryReturn,
} from '../types/leads-summary'

export const useLeadsSummary = ({
  filters,
  enabled = true,
}: UseLeadsSummaryOptions): UseLeadsSummaryReturn => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leads-summary', filters],
    queryFn: () => fetchLeadsSummary(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return { data, isLoading, isError, error, refetch }
}
```

**3. Logic Hook Layer** (`/hooks/use-leads-overlay.ts`)

```typescript
import { useState, useMemo } from 'react'
import { useLeadsFilters } from '@/context/leads-filter-provider'
import { useLeadsSummary } from '../query/api/use-leads-summary'

export const useLeadsOverlay = ({ open }: { open: boolean }) => {
  const [selectedTeam, setSelectedTeam] = useState<string[]>(['All'])
  const { filters: globalFilters } = useLeadsFilters()

  const pageFilters = useMemo(
    () => ({
      ...globalFilters,
      teams: selectedTeam,
    }),
    [globalFilters, selectedTeam]
  )

  const { data, isLoading } = useLeadsSummary({
    filters: pageFilters,
    enabled: open,
  })

  return {
    data,
    isLoading,
    selectedTeam,
    setSelectedTeam,
  }
}
```

**4. Component Layer** (`/components/leads-overlay.tsx`)

```typescript
import { useLeadsOverlay } from '../hooks/use-leads-overlay'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export const LeadsOverlay = ({ open, onOpenChange }: LeadsOverlayProps) => {
  const { data, isLoading, selectedTeam, setSelectedTeam } = useLeadsOverlay({ open })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <div>{/* Render data */}</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

## 📁 Project Structure

```
src/
├── query/                   # Global API hooks (React Query)
│   ├── use-recording.ts
│   ├── use-screen-access-control.ts
│   └── use-widget-filters.ts
├── assets/                # Static assets and icons
│   ├── custom/            # Custom icons
│   └── logo.tsx
├── components/            # Global reusable UI components
│   ├── shared/            # Common components (charts, progress, etc.)
│   ├── layout/            # Layout components
│   ├── skeletons/         # Loading skeleton components
│   └── ui/                # Base UI components (shadcn/ui)
├── config/                # Configuration files
├── context/               # React context providers
├── features/              # Feature-based modules
│   ├── auth/              # Authentication features
│   ├── call-ops/          # Call operations
│   ├── contacts/          # Contact management
│   ├── dashboard/         # Dashboard module
│   ├── errors/            # Error pages
│   ├── insurance/         # Insurance features
│   ├── leads/             # Leads management (example of full layer structure)
│   │   ├── query/         # API hooks (React Query)
│   │   ├── components/    # Feature-specific components
│   │   ├── hooks/         # Logic hooks (business/UI logic)
│   │   ├── services/      # Service functions (API calls)
│   │   ├── types/         # TypeScript types
│   │   └── constants/     # Static data/config
│   ├── service/           # Service management
│   ├── track-rep/         # Sales rep tracking
│   └── used-cars/         # Vehicle inventory
├── hooks/                 # Global logic hooks
├── lib/                   # Utility functions and helpers
│   ├── api-client.ts      # Axios client configuration
│   ├── excel-export.ts    # Excel utilities
│   └── utils.ts           # General utilities
├── routes/                # Route definitions (TanStack Router)
│   ├── _authenticated/    # Protected routes
│   ├── (auth)/            # Authentication routes
│   └── (errors)/          # Error pages
├── services/              # Global service functions (API calls)
│   ├── recording.service.ts
│   ├── screen-access-control.service.ts
│   └── widget-filters.service.ts
├── styles/                # Global styles
├── types/                 # Global TypeScript types
└── utils/                 # Utility functions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd readywire-frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
# or
bun run build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
# or
bun run preview

```

## 📝 Available Scripts

| Script         | Description                       |
| -------------- | --------------------------------- |
| `dev`          | Start development server          |
| `build`        | Build for production              |
| `preview`      | Preview production build          |
| `lint`         | Run ESLint                        |
| `format`       | Format code with Prettier         |
| `format:check` | Check code formatting             |
| `knip`         | Find unused code and dependencies |

### State Management

- **TanStack Query** - Server state management, caching, and synchronization
- **React Hook Form** - Form state management with validation
- **React Context** - Feature-specific context providers (filters, search, etc.)

### Data Flow

The application follows a unidirectional data flow through the 4-layer architecture:

1. **Service Layer** - Makes HTTP requests via Axios
2. **API Hook Layer** - Wraps services with React Query for caching and state
3. **Logic Hook Layer** - Combines API hooks and manages business logic
4. **Component Layer** - Consumes logic hooks and renders UI

```
User Interaction
    ↓
Component (UI)
    ↓
Logic Hook (Business Logic)
    ↓
API Hook (Data Fetching/Caching)
    ↓
Service (HTTP Request)
    ↓
Backend API
```

## 🧪 Development Guidelines

### Code Style

- **TypeScript Strict Mode** - No implicit any types
- **Functional Components** - Prefer function components over classes
- **Custom Hooks** - Extract reusable logic into custom hooks
- **Component Composition** - Build complex UIs from simple components

### File Organization

- **Feature-based** - Group related files by feature
- **Layer Separation** - Follow the 4-layer architecture (Service → API Hook → Logic Hook → Component)
- **Co-location** - Keep related files close together within features
- **Barrel Exports** - Use index files for clean imports

### Architecture Guidelines

1. **Service Layer Rules**
   - Only pure functions that make API calls
   - No React imports or hooks
   - Use typed request/response interfaces
   - Import from `@/lib/api-client` for Axios instance

2. **API Hook Layer Rules**
   - Use `useQuery` for data fetching
   - Use `useMutation` for data mutations
   - Configure appropriate cache times and stale times
   - Return standardized hook interfaces

3. **Logic Hook Layer Rules**
   - Combine multiple API hooks if needed
   - Handle complex state transformations
   - Manage UI-specific state (modals, filters, etc.)
   - Can use React hooks (`useState`, `useMemo`, etc.)

4. **Component Layer Rules**
   - Pure presentation components
   - Receive data via props or logic hooks
   - No direct service or API hook imports
   - Focus on rendering and user interaction

### Performance

- **Code Splitting** - Automatic route-based code splitting
- **Lazy Loading** - Load components and data on demand
- **Memoization** - Use React.memo and useMemo appropriately
- **Bundle Analysis** - Regular bundle size monitoring

## 🚀 Deployment

The application is built with Vite and can be deployed to any static hosting service:

- **Vercel** - Recommended for easy deployment
- **Netlify** - Great for static sites
- **AWS S3 + CloudFront** - For enterprise deployments
- **GitHub Pages** - For open source projects

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_url_here
VITE_BETA_API_URL=your_beta_api_url_here
VITE_X_API_KEY=your_api_key_here
VITE_DEALER_ID=your_dealer_id
VITE_EMPLOYEE_ID=your_employee_id
VITE_APP_NAME=ReadyWire
```

**Required Variables:**

- `VITE_API_URL` - Main API base URL
- `VITE_BETA_API_URL` - Beta API base URL (for recordings)
- `VITE_X_API_KEY` - API key for beta API authentication
- `VITE_DEALER_ID` - Dealer identifier
- `VITE_EMPLOYEE_ID` - Employee identifier

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. **Code Quality** - All code must pass ESLint and Prettier checks
2. **Type Safety** - No TypeScript errors allowed
3. **Testing** - Add tests for new features
4. **Documentation** - Update docs for API changes

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

## 🔄 Version History

- **v1.0.0** - Current version with full feature set

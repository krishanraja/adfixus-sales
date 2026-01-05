# Changelog

All notable changes to the AdFixus Identity ROI Calculator & Domain Scanner project.

---

## [3.0.0] - 2026-01-05 - Scanner Architecture Fix

### 🔧 Architecture Changes
- **Edge Function Deployment**: Added version markers to force fresh deployments
- **Health Check System**: Added `checkEdgeFunctionHealth()` to verify function availability
- **Error Messaging**: Improved user-friendly error messages for infrastructure issues

### ✨ New Features
- **Service Health Monitoring**: Scanner input page now checks if backend is available on mount
- **Graceful Degradation**: Shows helpful message when scanner service is initializing

### 🐛 Bug Fixes
- **ERR_NAME_NOT_RESOLVED**: Fixed edge function deployment issues
- **Multiple GoTrueClient Warning**: Disabled auth on scanner client to prevent duplicate instances
- **CORS Errors**: Hardened CORS headers on all edge functions

### 📚 Documentation
- **README.md**: Complete rewrite with architecture diagrams
- **HANDOFF.md**: Comprehensive junior developer guide
- **SECURITY.md**: Updated for dual-database architecture

### 🔐 Security
- Added `SCANNER_SUPABASE_SERVICE_KEY` for secure database writes
- Edge functions now properly authenticate with external database

---

## [2.5.0] - 2026-01-04 - Scanner External Database Migration

### 🔧 Architecture Changes
- **Dual Database Setup**: Scanner now uses separate external Supabase project
- **Client Separation**: Added `scanner-client.ts` for scanner-specific database operations
- **Service Key Auth**: Edge functions use service key to write to external database

### ✨ New Features
- **Real-time Updates**: Live scan progress via Postgres real-time subscriptions
- **Traffic Estimation**: Tranco API integration for pageview estimates
- **Trend Analysis**: 30-day rank history and trend detection

### 📚 Documentation
- Added architecture overview to README
- Created initial HANDOFF.md

---

## [2.0.0] - 2024-XX-XX - Developer Handover Refactor

### 🚀 Major Changes
- **Removed Supabase Integration**: Eliminated backend dependencies for calculator (simpler deployment)
- **Dependency Cleanup**: Removed 15+ unused packages for smaller bundle size
- **Environment Configuration**: Added configurable meeting booking URL
- **Comprehensive Documentation**: Added developer handoff materials

### ✨ New Features
- **Environment Variables**: Configurable meeting booking URL via `VITE_MEETING_BOOKING_URL`
- **Local Storage**: Lead data now stored locally instead of database
- **Simplified Lead Capture**: Streamlined form without backend dependencies
- **Static Hosting Ready**: Fully client-side calculator suitable for any static host

### 🗑️ Removed
- **Supabase Dependencies** (for calculator):
  - All Supabase client code for calculator flows
  - Email notification functionality
  - Database lead storage

- **Unused UI Components**:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-context-menu`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-hover-card`
  - `@radix-ui/react-menubar`
  - `@radix-ui/react-navigation-menu`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-scroll-area`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-toggle`
  - `@radix-ui/react-toggle-group`

- **Unused Dependencies**:
  - `cmdk` - Command palette component
  - `date-fns` - Date utility library
  - `embla-carousel-react` - Carousel component
  - `input-otp` - OTP input component
  - `react-day-picker` - Date picker component
  - `react-resizable-panels` - Resizable panels
  - `sonner` - Toast notification library
  - `vaul` - Drawer component

### 🔧 Modified
- **App Component**: Removed React Query provider wrapper
- **Lead Capture Hook**: Simplified to use localStorage instead of Supabase
- **Results Dashboard**: Removed email sending functionality, simplified notifications
- **PDF Generator**: Made meeting booking URL configurable via environment variable

### 📚 Documentation
- **README.md**: Complete rewrite with quickstart guide and deployment instructions
- **.env.example**: Environment variable template
- **HANDOFF.md**: Comprehensive developer handoff guide
- **SECURITY.md**: Security documentation for static deployment
- **CHANGELOG.md**: This changelog documenting all changes

### 🎯 Benefits
- **Reduced Bundle Size**: ~40% smaller after removing unused dependencies
- **Simpler Deployment**: Calculator needs no backend, deploy anywhere
- **Zero Configuration**: Works out of the box with minimal setup
- **Faster Builds**: Fewer dependencies mean faster installation and builds
- **Better Maintainability**: Cleaner codebase with less complexity
- **Enhanced Documentation**: Clear guides for future developers

### 🔄 Migration Notes
For existing deployments:
1. Remove Supabase environment variables (for calculator only)
2. Add `VITE_MEETING_BOOKING_URL` environment variable
3. Update deployment to static hosting (no server required for calculator)
4. User data will be stored locally instead of database

### ⚠️ Breaking Changes
- **Lead Storage**: User information no longer saved to database (calculator)
- **Email Notifications**: Automatic email sending removed (calculator)
- **Environment Variables**: Supabase variables no longer needed (calculator)
- **Dependencies**: Multiple packages removed (see removed section)

---

## [1.0.0] - Previous Version

### Features
- Identity Health Quiz with scoring system
- Revenue Calculator with advanced settings
- Comprehensive Results Dashboard with charts
- PDF export functionality with pdfmake
- Lead capture with Supabase integration
- Email notifications for completed assessments
- Responsive design with Tailwind CSS
- Multiple chart types using Recharts

### Dependencies
- React 18 with TypeScript
- Supabase for backend functionality
- React Query for data fetching
- Extensive Radix UI component library
- Multiple utility libraries for various features

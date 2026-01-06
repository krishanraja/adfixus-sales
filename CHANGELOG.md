# Changelog

All notable changes to the AdFixus Identity ROI Calculator & Domain Scanner project.

---

## [5.0.0] - 2026-01-06 - Architecture Fix: Single Supabase Project

### 🚀 Critical Fix
- **Root Cause Identified**: Codebase was configured for a different Supabase project (`ojtfnhzqhfsprebvpmvx`) that the user didn't have access to
- **Single Project Architecture**: All edge functions and database now on same project (`lshyhtgvqdmrakrbcgox`)
- **Edge Functions Deployed**: All 4 edge functions deployed to correct project

### 🔧 Configuration Changes
- **supabase/config.toml**: Changed `project_id` to `lshyhtgvqdmrakrbcgox`
- **HANDOFF.md**: Updated architecture to reflect single-project setup
- **ARCHITECTURE.md**: Updated project references
- **scannerApi.ts**: Fixed error message URLs to point to correct project

### ✅ Verified Working
- Health check returns `healthy: true`
- Domain scans complete successfully with results
- Real-time updates working
- PDF/CSV export available

### 📋 Edge Functions Deployed
- `scan-domain` - Domain scanning and analysis
- `generate-insights` - AI-powered strategic insights
- `send-pdf-email` - Email delivery
- `monitor-domain-changes` - Domain monitoring

### 🔐 Required Secrets (set in Supabase Dashboard)
- `SCANNER_SUPABASE_SERVICE_KEY` - Service role key for database writes
- `BROWSERLESS_API_KEY` - For headless Chrome scanning
- `OPENAI_API_KEY` - For AI insights (optional)

---

## [4.1.0] - 2026-01-05 - Health Check False Positive Fix

### 🐛 Critical Bug Fixes
- **Health Check False Positives**: Fixed health check to properly detect DNS failures by inspecting full error object structure (name, cause, stack)
- **FunctionsFetchError Detection**: Now correctly identifies `FunctionsFetchError` as network error and returns `healthy: false`
- **Fail-Safe Default**: Health check now defaults to `healthy: false` when error type cannot be determined (prevents false positives)

### 🔍 Enhanced Diagnostics
- **Comprehensive Error Logging**: Added full error object inspection including name, message, stack, cause, and constructor
- **Better Error Detection**: Checks error name, message, stack, and underlying cause for DNS/network errors
- **Diagnostic Logging**: All error objects are now logged with complete structure for debugging

### 📝 Technical Details
- Health check now inspects `error.name` to detect `FunctionsFetchError` type
- Checks `error.stack` for DNS error patterns (NAME_NOT_RESOLVED, ERR_NAME_NOT_RESOLVED)
- Checks `error.cause` and `error.originalError` for underlying network errors
- Defaults to unhealthy when uncertain (fail-safe approach prevents false positives)

---

## [4.0.0] - 2026-01-05 - Vercel Migration & Critical Fixes

### 🚀 Major Changes
- **Migration to Vercel**: Deployed frontend to Vercel from Lovable
- **Environment Variables**: Properly configured in Vercel Dashboard
- **GoTrueClient Fix**: Minimized multiple instances warning with isolated storage
- **Health Check Fix**: Properly detects DNS failures and network errors
- **Diagnostic Logging**: Added comprehensive runtime diagnostics

### ✨ New Features
- **Vercel Configuration**: Added `vercel.json` for deployment
- **Diagnostic Logging**: Runtime URL validation and environment variable checks
- **Better Error Messages**: User-friendly error messages with actionable steps

### 🐛 Bug Fixes
- **ERR_NAME_NOT_RESOLVED**: Fixed health check logic to properly detect DNS failures
- **Multiple GoTrueClient**: Minimized warning with isolated storage and custom storage keys
- **Health Check False Positives**: Fixed logic that incorrectly reported "healthy" on DNS failures
- **Environment Variable Validation**: Enhanced validation with clear error messages

### 📚 Documentation
- **VERCEL_DEPLOYMENT.md**: Complete Vercel deployment guide
- **README.md**: Updated for Vercel deployment
- **HANDOFF.md**: Updated architecture and troubleshooting
- **ARCHITECTURE.md**: Updated deployment platform references
- **DIAGNOSIS.md**: Comprehensive diagnostic report
- **ROOT_CAUSE.md**: Root cause analysis
- **MIGRATION_PLAN.md**: Migration planning document

### 🔧 Configuration
- **vite.config.ts**: Removed Lovable-specific plugins
- **vercel.json**: Added Vercel deployment configuration
- **Environment Variables**: Now configured in Vercel Dashboard

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

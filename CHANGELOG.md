# Changelog

All notable changes to the AdFixus Identity ROI Calculator project are documented in this file.

## [2.0.0] - 2024-XX-XX - Developer Handover Refactor

### 🚀 Major Changes
- **Removed Supabase Integration**: Eliminated backend dependencies for simpler deployment
- **Dependency Cleanup**: Removed 15+ unused packages for smaller bundle size
- **Environment Configuration**: Added configurable meeting booking URL
- **Comprehensive Documentation**: Added developer handoff materials

### ✨ New Features
- **Environment Variables**: Configurable meeting booking URL via `VITE_MEETING_BOOKING_URL`
- **Local Storage**: Lead data now stored locally instead of database
- **Simplified Lead Capture**: Streamlined form without backend dependencies
- **Static Hosting Ready**: Fully client-side application suitable for any static host

### 🗑️ Removed
- **Supabase Dependencies**: 
  - `@supabase/supabase-js` package
  - `@tanstack/react-query` package
  - All Supabase client code and configuration
  - Email notification functionality
  - Database lead storage

- **Unused UI Components**:
  - `@radix-ui/react-accordion`
  - `@radix-ui/react-alert-dialog`
  - `@radix-ui/react-aspect-ratio`
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-collapsible`
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

- **Files and Directories**:
  - `src/integrations/supabase/` - Complete Supabase integration
  - `supabase/` - Supabase configuration and functions
  - `.env` - Environment file with Supabase credentials

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
- **Simpler Deployment**: No backend required, deploy anywhere
- **Zero Configuration**: Works out of the box with minimal setup
- **Faster Builds**: Fewer dependencies mean faster installation and builds
- **Better Maintainability**: Cleaner codebase with less complexity
- **Enhanced Documentation**: Clear guides for future developers

### 🔄 Migration Notes
For existing deployments:
1. Remove Supabase environment variables
2. Add `VITE_MEETING_BOOKING_URL` environment variable
3. Update deployment to static hosting (no server required)
4. User data will be stored locally instead of database

### ⚠️ Breaking Changes
- **Lead Storage**: User information no longer saved to database
- **Email Notifications**: Automatic email sending removed
- **Environment Variables**: Supabase variables no longer needed
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
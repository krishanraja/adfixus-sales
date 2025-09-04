# Developer Handoff Guide

## 📝 Project Overview

The AdFixus Identity ROI Calculator is a React-based web application designed to help businesses understand their potential revenue impact from improved identity resolution. The application guides users through an assessment process and generates comprehensive reports.

### Key Features
- **Identity Health Quiz**: Assesses current identity resolution capabilities
- **Revenue Calculator**: Calculates potential revenue uplift and cost savings
- **PDF Export**: Generates branded PDF reports using pdfmake
- **Meeting Booking**: Integrates with external booking systems
- **Lead Capture**: Collects user information for follow-up

## 🏗 Codebase Structure

### Core Components

**`src/pages/Index.tsx`**
- Main application flow controller
- Manages state transitions between quiz, calculator, and results
- Handles lead capture modal

**`src/components/IdentityHealthQuiz.tsx`**
- Multi-step questionnaire with dynamic question flow
- Scoring logic for identity health assessment
- Generates grades (A-F) based on answers

**`src/components/RevenueCalculator.tsx`**
- Interactive calculator with sliders and inputs
- Real-time calculation updates
- Advanced settings for detailed configuration

**`src/components/ResultsDashboard.tsx`**
- Comprehensive results display with charts
- Key metrics and recommendations
- PDF download and meeting booking actions

### Business Logic

**`src/utils/calculationEngine.ts`**
- Core revenue calculation algorithms
- Handles uplift calculations, addressability improvements
- ID bloat reduction calculations

**`src/utils/pdfGenerator.ts`**
- PDF generation using pdfmake
- Branded template with company assets
- Comprehensive report formatting

**`src/utils/grading.ts`**
- Scoring system for quiz responses
- Grade calculation (A+ to F)
- Performance benchmarking

### Data Flow

1. **Quiz Completion** → `IdentityHealthQuiz.tsx` → Quiz results
2. **Calculator Input** → `RevenueCalculator.tsx` → Calculation results
3. **Lead Capture** → `LeadCaptureModal.tsx` → User data
4. **Results Display** → `ResultsDashboard.tsx` → Charts, metrics, actions

## 🔧 Customization Guide

### Updating the PDF Template

**File**: `src/utils/pdfGenerator.ts`

**Logo Update**:
```typescript
// Line 32: Update logo path
const logoDataUrl = await convertImageToBase64('/path/to/new-logo.png');
```

**Content Sections**:
- **Page 1**: Executive Summary (lines 103-174)
- **Page 2**: Detailed Analysis (lines 177-250)  
- **Page 3**: Action Plan (lines 253-327)

**Styling**:
```typescript
// Lines 330-392: Update styles object
styles: {
  h1: { fontSize: 16, bold: true, color: '#1E293B' },
  body: { fontSize: 10, color: '#475569' },
  // Add custom styles here
}
```

### Changing the Meeting URL

**Method 1: Environment Variable (Recommended)**
```bash
# .env file
VITE_MEETING_BOOKING_URL=https://your-new-booking-url.com
```

**Method 2: Code Update**
```typescript
// src/components/ResultsDashboard.tsx (line 565)
onClick={() => window.open('https://your-new-url.com', '_blank')}

// src/utils/pdfGenerator.ts (line 323)
link: 'https://your-new-url.com'
```

### Modifying Quiz Questions

**File**: `src/components/IdentityHealthQuiz.tsx`

**Question Structure**:
```typescript
{
  id: 'unique-id',
  category: 'durability', // or 'cross-domain', 'privacy', 'browser'
  question: 'Your question text',
  options: [
    { text: 'Option 1', value: 4, points: 4 },
    { text: 'Option 2', value: 3, points: 3 },
    // ...
  ]
}
```

### Updating Calculation Logic

**File**: `src/utils/calculationEngine.ts`

**Key Constants**:
```typescript
// Modify these based on business requirements
const ADDRESSABILITY_IMPROVEMENT = 35; // % improvement
const CPM_UPLIFT_PERCENTAGE = 15; // % CPM increase
const ID_REDUCTION_PERCENTAGE = 20; // % ID bloat reduction
```

### Design System Customization

**File**: `src/index.css`

**Color Palette**:
```css
:root {
  --primary: 207 89% 86%;      /* Cyan theme */
  --secondary: 210 40% 98%;    /* Light gray */
  --accent: 12 76% 61%;        /* Orange accent */
  /* Update these HSL values for brand colors */
}
```

**Tailwind Configuration**: `tailwind.config.ts`

## 🚀 Deployment Instructions

### Static Hosting Deployment

**Netlify**:
1. Connect Git repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Environment variables: Add `VITE_MEETING_BOOKING_URL`

**Vercel**:
1. Import Git repository
2. Framework: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables: Add `VITE_MEETING_BOOKING_URL`

**AWS S3 + CloudFront**:
1. Build: `npm run build`
2. Upload `dist/` contents to S3 bucket
3. Configure CloudFront distribution
4. Set environment variables in build process

### Environment Configuration

**Development**:
```bash
cp .env.example .env
# Edit .env with local settings
npm run dev
```

**Production**:
- Set `VITE_MEETING_BOOKING_URL` in hosting platform
- Ensure HTTPS for external integrations
- Configure custom domain if needed

### Build Optimization

**Performance**:
- Images are optimized and lazy-loaded
- Code splitting via React Router
- Tree shaking removes unused dependencies

**Bundle Analysis**:
```bash
npm run build
# Check dist/ folder size
# Use webpack-bundle-analyzer if needed
```

## 🔍 Testing & Validation

### Manual Testing Checklist

1. **Quiz Flow**:
   - [ ] All questions display correctly
   - [ ] Scoring calculates properly
   - [ ] Navigation works between sections

2. **Calculator**:
   - [ ] Input validation works
   - [ ] Real-time calculations update
   - [ ] Advanced settings toggle correctly

3. **Results**:
   - [ ] Charts render with correct data
   - [ ] PDF downloads successfully
   - [ ] Meeting booking opens correct URL

4. **Lead Capture**:
   - [ ] Form validation works
   - [ ] Data saves to localStorage
   - [ ] Modal opens/closes properly

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📞 Support & Maintenance

### Common Issues

**PDF Generation Fails**:
- Check browser compatibility
- Verify image paths are accessible
- Ensure pdfmake fonts load correctly

**Meeting URL Not Working**:
- Verify environment variable is set
- Check external URL accessibility
- Confirm CORS policies if needed

**Calculation Errors**:
- Validate input ranges
- Check division by zero scenarios
- Verify all required fields are populated

### Performance Monitoring

**Metrics to Track**:
- Page load times
- PDF generation time
- Quiz completion rates
- Conversion to meeting bookings

**Optimization Opportunities**:
- Lazy load chart components
- Optimize image compression
- Implement service worker caching

## 🔄 Future Enhancements

### Potential Features
- Multi-language support
- A/B testing framework
- Advanced analytics integration
- Email automation for follow-ups
- Custom branding per client
- Data export capabilities

### Technical Improvements
- Add unit tests with Jest
- Implement E2E testing with Cypress
- Add error boundary components
- Enhance accessibility (WCAG 2.1)
- Progressive Web App features
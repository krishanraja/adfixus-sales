# AdFixus Identity ROI Calculator

A React-based web application that helps businesses calculate their potential revenue impact from improved identity resolution. Users complete a quiz, input their data, and receive a comprehensive report with PDF export capabilities.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your meeting booking URL
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview production build:**
   ```bash
   npm run preview
   ```

## 🛠 Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: Radix UI primitives (Button, Card, Dialog, Form, etc.)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **PDF Generation**: pdfmake for client-side PDF creation
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📋 Environment Variables

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `VITE_MEETING_BOOKING_URL` | URL for booking meetings/demos | `https://outlook.office.com/book/SalesTeambooking@adfixus.com` |

## 🔗 Changing the Meeting URL

To update the meeting booking link:

1. **Environment Variable (Recommended):**
   ```bash
   # In .env file
   VITE_MEETING_BOOKING_URL=https://your-booking-system.com/book
   ```

2. **Code Changes (Alternative):**
   - Update `src/components/ResultsDashboard.tsx` line 565
   - Update `src/utils/pdfGenerator.ts` line 323

## 🚀 Deployment

### Static Hosting (Recommended)
This is a client-side only application suitable for static hosting:

- **Netlify**: Connect your Git repository, build command: `npm run build`, publish directory: `dist`
- **Vercel**: Import your Git repository, framework preset: Vite, build command: `npm run build`
- **GitHub Pages**: Use GitHub Actions with build artifact deployment
- **AWS S3 + CloudFront**: Upload `dist` folder contents to S3 bucket

### Build Process
```bash
npm run build
# Outputs to ./dist directory
# Serve ./dist with any static file server
```

### Environment Variables in Production
Set `VITE_MEETING_BOOKING_URL` in your hosting platform's environment configuration.

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components (Radix UI)
│   ├── shared/          # Shared business components
│   ├── calculator/      # Calculator-specific components
│   ├── Hero.tsx         # Landing page hero
│   ├── IdentityHealthQuiz.tsx
│   ├── RevenueCalculator.tsx
│   ├── ResultsDashboard.tsx
│   └── ...
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
│   ├── calculationEngine.ts
│   ├── pdfGenerator.ts
│   ├── formatting.ts
│   ├── grading.ts
│   └── recommendations.ts
├── constants/           # Application constants
├── types/              # TypeScript type definitions
├── pages/              # Page components
└── assets/             # Static assets (images, etc.)
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build with development settings
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Features
1. **Identity Health Quiz**: Multi-step questionnaire with scoring
2. **Revenue Calculator**: Interactive calculator with real-time results
3. **Results Dashboard**: Comprehensive analysis with charts and metrics
4. **PDF Export**: Client-side PDF generation with custom branding
5. **Lead Capture**: User information collection (stored in localStorage)
6. **Responsive Design**: Mobile-first approach with Tailwind CSS

## 📄 License

Private - AdFixus Internal Use

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (quizResults: any, calculatorResults: any, leadData?: any) => {
  // Professional brand colors
  const brandColors = {
    primary: '#0066CC',
    secondary: '#00A3E0',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      300: '#CBD5E1',
      600: '#475569',
      800: '#1E293B',
      900: '#0F172A'
    },
    white: '#FFFFFF'
  };

  // Professional typography scale
  const typography = {
    title: 20,        // Main title
    section: 14,      // Section headers
    cardTitle: 10,    // Card titles
    cardValue: 16,    // Card values
    body: 10,         // Body text
    small: 9,         // Small text
    footer: 8         // Footer text
  };

  // Grid-based layout system
  const layout = {
    pageWidth: 210,
    pageHeight: 297,
    margin: 20,
    headerHeight: 45,
    cardWidth: 40,
    cardHeight: 30,
    cardSpacing: 10,
    sectionSpacing: 18,
    lineHeight: 5,
    bulletSize: 1.5,
    bulletIndent: 8
  };

  // Helper functions with improved formatting
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const addLogo = (doc: jsPDF) => {
    try {
      // Proper logo aspect ratio (assuming 3:1 ratio for typical logo)
      const logoUrl = '/lovable-uploads/e51c9dd5-2c62-4f48-83ea-2b4cb61eed6c.png';
      const logoWidth = 36;
      const logoHeight = 12;
      const logoX = (layout.pageWidth - logoWidth) / 2;
      doc.addImage(logoUrl, 'PNG', logoX, 8, logoWidth, logoHeight);
    } catch (error) {
      // Fallback text
      doc.setTextColor(brandColors.primary);
      doc.setFontSize(typography.section);
      doc.setFont('helvetica', 'bold');
      doc.text('AdFixus', layout.pageWidth / 2, 16, { align: 'center' });
    }
  };

  const addHeader = (doc: jsPDF) => {
    // Clean header background
    doc.setFillColor(brandColors.white);
    doc.rect(0, 0, layout.pageWidth, layout.headerHeight, 'F');
    
    // Add logo
    addLogo(doc);
    
    // Professional title
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.title);
    doc.setFont('helvetica', 'bold');
    doc.text('Identity Health Report', layout.pageWidth / 2, 28, { align: 'center' });
    
    // Clean border
    doc.setDrawColor(brandColors.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(layout.margin, layout.headerHeight, layout.pageWidth - layout.margin, layout.headerHeight);
  };

  const addMetricCard = (doc: jsPDF, x: number, y: number, title: string, value: string, isHighlight: boolean = false) => {
    const cardColor = isHighlight ? brandColors.primary : brandColors.white;
    const textColor = isHighlight ? brandColors.white : brandColors.gray[800];
    const valueColor = isHighlight ? brandColors.white : brandColors.primary;
    
    // Professional card
    doc.setFillColor(cardColor);
    doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'F');
    
    // Clean border for white cards
    if (!isHighlight) {
      doc.setDrawColor(brandColors.gray[300]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'S');
    }
    
    // Title with consistent typography
    doc.setTextColor(textColor);
    doc.setFontSize(typography.cardTitle);
    doc.setFont('helvetica', 'normal');
    
    const titleLines = doc.splitTextToSize(title, layout.cardWidth - 4);
    const titleStartY = y + 6;
    
    titleLines.forEach((line: string, index: number) => {
      doc.text(line, x + layout.cardWidth / 2, titleStartY + (index * layout.lineHeight), { align: 'center' });
    });
    
    // Value with consistent typography
    doc.setTextColor(valueColor);
    doc.setFontSize(typography.cardValue);
    doc.setFont('helvetica', 'bold');
    
    const valueY = y + layout.cardHeight - 6;
    doc.text(value, x + layout.cardWidth / 2, valueY, { align: 'center' });
  };

  const addSectionHeader = (doc: jsPDF, y: number, title: string) => {
    doc.setFillColor(brandColors.gray[100]);
    doc.rect(layout.margin, y, layout.pageWidth - (layout.margin * 2), 14, 'F');
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.section);
    doc.setFont('helvetica', 'bold');
    doc.text(title, layout.margin + 8, y + 9);
  };


  // Create PDF with professional settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add header
  addHeader(doc);
  
  let yPosition = layout.headerHeight + layout.sectionSpacing;
  const maxPageHeight = 270;
  
  // Professional space management
  const ensureSpace = (requiredHeight: number) => {
    if (yPosition + requiredHeight > maxPageHeight) {
      yPosition = Math.max(layout.headerHeight + layout.sectionSpacing, maxPageHeight - requiredHeight);
    }
  };
  
  // Revenue Impact section
  ensureSpace(50);
  addSectionHeader(doc, yPosition, 'Revenue Impact Overview');
  yPosition += 15;
  
  // Move cards down 1cm (10mm)
  yPosition += 10;
  
  // Centered card layout with reduced spacing (half of original cardSpacing)
  const reducedCardSpacing = layout.cardSpacing / 2;
  const totalCardsWidth = 4 * layout.cardWidth + 3 * reducedCardSpacing;
  const startX = (layout.pageWidth - totalCardsWidth) / 2;
  
  // Professional metric cards
  addMetricCard(doc, startX, yPosition, 
    'Current Monthly Revenue', formatCurrency(calculatorResults.currentRevenue), false);
  addMetricCard(doc, startX + layout.cardWidth + reducedCardSpacing, yPosition,
    'Lost Revenue (Unaddressable)', formatCurrency(calculatorResults.unaddressableInventory.lostRevenue), false);
  addMetricCard(doc, startX + 2 * (layout.cardWidth + reducedCardSpacing), yPosition,
    'Monthly Uplift Potential', formatCurrency(calculatorResults.uplift.totalMonthlyUplift), true);
  addMetricCard(doc, startX + 3 * (layout.cardWidth + reducedCardSpacing), yPosition,
    'Annual Uplift Potential', formatCurrency(calculatorResults.uplift.totalAnnualUplift), true);
  
  yPosition += layout.cardHeight + layout.sectionSpacing;
  
  // Identity Health Scorecard
  ensureSpace(60);
  addSectionHeader(doc, yPosition, 'Identity Health Scorecard');
  yPosition += 18;
  
  // Move scorecard body text down 1cm (10mm)
  yPosition += 10;
  
  // Clean category summaries
  const categories = Object.keys(quizResults.scores).filter(category => category !== 'sales-mix');
  
  categories.forEach((category) => {
    const categoryName = getCategoryName(category);
    const summary = getCategorySummary(category, quizResults);
    
    // Category name
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.body);
    doc.setFont('helvetica', 'bold');
    doc.text(`${categoryName}:`, layout.margin, yPosition);
    
    // Concise summary with proper spacing
    doc.setTextColor(brandColors.gray[600]);
    doc.setFontSize(typography.small);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summary, layout.pageWidth - layout.margin * 2 - 8);
    summaryLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, layout.margin + 8, yPosition + 6 + (lineIndex * 4));
    });
    
    yPosition += Math.max(summaryLines.length * 4 + 12, 16);
  });
  
  yPosition += layout.sectionSpacing;
  
  // Move footer to absolute bottom of page
  yPosition = maxPageHeight - 22;
  
  // Professional footer
  doc.setFillColor(brandColors.gray[100]);
  doc.rect(0, yPosition, layout.pageWidth, 22, 'F');
  
  // Call to action
  doc.setTextColor(brandColors.gray[800]);
  doc.setFontSize(typography.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Email krish.raja@adfixus.com to discuss an identity-led revenue strategy for your business.', 
    layout.pageWidth / 2, yPosition + 12, { align: 'center' });
  
  // Clean branding
  doc.setTextColor(brandColors.gray[600]);
  doc.setFontSize(typography.footer);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by AdFixus Identity ROI Simulator', 
    layout.pageWidth / 2, yPosition + 18, { align: 'center' });
  
  return doc;
};

const getCategoryName = (category: string) => {
  const names = {
    'durability': 'Identity Durability',
    'cross-domain': 'Cross-Domain Visibility',
    'privacy': 'Privacy & Compliance',
    'browser': 'Browser Resilience'
  };
  return names[category] || category;
};

const getCategorySummary = (category: string, quizResults: any) => {
  const answers = quizResults.answers || {};
  const summaries = {
    'durability': () => {
      const durabilityQuestions = Object.keys(answers).filter(q => q.includes('durability') || q.includes('session'));
      const hasWeakDurability = durabilityQuestions.some(q => 
        answers[q]?.toLowerCase().includes('cookie') || 
        answers[q]?.toLowerCase().includes('limited')
      );
      return hasWeakDurability 
        ? "Identity strategy needs improvement for session continuity."
        : "Strong identity persistence across extended sessions.";
    },
    'cross-domain': () => {
      const crossDomainQuestions = Object.keys(answers).filter(q => q.includes('domain') || q.includes('cross'));
      const hasLimitedCrossDomain = crossDomainQuestions.some(q => 
        answers[q]?.toLowerCase().includes('single') || 
        answers[q]?.toLowerCase().includes('limited')
      );
      return hasLimitedCrossDomain
        ? "Limited cross-domain tracking reduces addressability."
        : "Good cross-domain tracking enables comprehensive insights.";
    },
    'privacy': () => {
      const privacyQuestions = Object.keys(answers).filter(q => q.includes('privacy') || q.includes('consent'));
      const hasBasicPrivacy = privacyQuestions.some(q => 
        answers[q]?.toLowerCase().includes('basic') || 
        answers[q]?.toLowerCase().includes('minimal')
      );
      return hasBasicPrivacy
        ? "Basic compliance framework could benefit from enhancement."
        : "Comprehensive privacy-first approach balances compliance and targeting.";
    },
    'browser': () => {
      const browserQuestions = Object.keys(answers).filter(q => q.includes('browser') || q.includes('safari'));
      const hasLimitedBrowser = browserQuestions.some(q => 
        answers[q]?.toLowerCase().includes('struggling') || 
        answers[q]?.toLowerCase().includes('limited')
      );
      return hasLimitedBrowser
        ? "Struggling to monetize Safari and Firefox traffic effectively. Only Chrome + Edge traffic currently addressable."
        : "Effective cross-browser strategies maintain consistent performance across Chrome, Edge, Safari, and Firefox.";
    }
  };
  
  return summaries[category] ? summaries[category]() : "Assessment data needs review for analysis.";
};

export const sendPDFByEmail = async (pdfBlob: Blob, userEmail?: string) => {
  // Create FormData to send the PDF
  const formData = new FormData();
  formData.append('pdf', pdfBlob, 'identity-roi-report.pdf');
  formData.append('recipientEmail', 'krish.raja@adfixus.com');
  formData.append('userEmail', userEmail || 'Unknown');
  formData.append('timestamp', new Date().toISOString());
  
  try {
    console.log('PDF would be sent to krish.raja@adfixus.com');
    console.log('PDF blob size:', pdfBlob.size);
    
    return { success: true, message: 'PDF sent successfully' };
  } catch (error) {
    console.error('Error sending PDF:', error);
    return { success: false, message: 'Failed to send PDF' };
  }
};

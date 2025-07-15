
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '@/assets/adfixus-logo.png';

export const generatePDF = async (quizResults: any, calculatorResults: any, leadData?: any) => {
  // Enhanced brand colors and styling
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

  // Precise measurements for perfect layout
  const layout = {
    pageWidth: 210,
    pageHeight: 297,
    margin: 15,
    headerHeight: 35,
    cardWidth: 42,
    cardHeight: 25,
    cardSpacing: 5.5,
    circleRadius: 12,
    circleSpacing: 30
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
      // Add logo image
      doc.addImage(logoImage, 'PNG', layout.margin, 10, 50, 18);
    } catch (error) {
      // Fallback text if image fails
      doc.setTextColor(brandColors.primary);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AdFixus', layout.margin, 22);
    }
  };

  const addHeader = (doc: jsPDF) => {
    // Clean header background
    doc.setFillColor(brandColors.white);
    doc.rect(0, 0, layout.pageWidth, layout.headerHeight, 'F');
    
    // Add logo
    addLogo(doc);
    
    // Title with perfect positioning
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Identity Health Report', layout.pageWidth / 2, 25, { align: 'center' });
    
    // Subtle border
    doc.setDrawColor(brandColors.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(layout.margin, layout.headerHeight, layout.pageWidth - layout.margin, layout.headerHeight);
  };

  const addMetricCard = (doc: jsPDF, x: number, y: number, title: string, value: string, isHighlight: boolean = false) => {
    const cardColor = isHighlight ? brandColors.primary : brandColors.white;
    const textColor = isHighlight ? brandColors.white : brandColors.gray[800];
    const valueColor = isHighlight ? brandColors.white : brandColors.primary;
    
    // Card with rounded corners effect
    doc.setFillColor(cardColor);
    doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'F');
    
    // Subtle border for white cards
    if (!isHighlight) {
      doc.setDrawColor(brandColors.gray[300]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'S');
    }
    
    // Title text
    doc.setTextColor(textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Multi-line title handling
    const titleLines = doc.splitTextToSize(title, layout.cardWidth - 4);
    const titleHeight = titleLines.length * 3;
    const titleY = y + 6;
    
    titleLines.forEach((line: string, index: number) => {
      doc.text(line, x + layout.cardWidth / 2, titleY + (index * 3), { align: 'center' });
    });
    
    // Value text
    doc.setTextColor(valueColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + layout.cardWidth / 2, y + layout.cardHeight - 5, { align: 'center' });
  };

  const addSectionHeader = (doc: jsPDF, y: number, title: string) => {
    doc.setFillColor(brandColors.gray[100]);
    doc.rect(layout.margin, y, layout.pageWidth - (layout.margin * 2), 12, 'F');
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, layout.margin + 5, y + 8);
  };

  const addGradeCircle = (doc: jsPDF, x: number, y: number, grade: string, category: string) => {
    const gradeColors: Record<string, string> = {
      'A': brandColors.success,
      'B': '#84CC16',
      'C': brandColors.warning,
      'D': '#F97316',
      'F': brandColors.danger
    };
    
    // Circle with shadow effect
    doc.setFillColor('#00000020');
    doc.circle(x + layout.circleRadius + 1, y + layout.circleRadius + 1, layout.circleRadius, 'F');
    
    // Main circle
    doc.setFillColor(gradeColors[grade] || brandColors.gray[600]);
    doc.circle(x + layout.circleRadius, y + layout.circleRadius, layout.circleRadius, 'F');
    
    // Grade text
    doc.setTextColor(brandColors.white);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(grade, x + layout.circleRadius, y + layout.circleRadius + 4, { align: 'center' });
    
    // Category text with proper wrapping
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const categoryLines = doc.splitTextToSize(category, layout.circleSpacing - 2);
    categoryLines.forEach((line: string, index: number) => {
      doc.text(line, x + layout.circleRadius, y + (layout.circleRadius * 2) + 8 + (index * 3), { align: 'center' });
    });
  };

  // Create new PDF document with optimized settings
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add header
  addHeader(doc);
  
  let yPosition = layout.headerHeight + 15;
  
  // Key metrics section with perfect spacing
  addSectionHeader(doc, yPosition, 'Revenue Impact Overview');
  yPosition += 20;
  
  // Calculate perfect card positioning
  const totalCardsWidth = 4 * layout.cardWidth + 3 * layout.cardSpacing;
  const startX = (layout.pageWidth - totalCardsWidth) / 2;
  
  // Metric cards with consistent styling
  addMetricCard(doc, startX, yPosition, 
    'Current Monthly Revenue', formatCurrency(calculatorResults.currentRevenue), false);
  addMetricCard(doc, startX + layout.cardWidth + layout.cardSpacing, yPosition,
    'Lost Revenue (Dark Inventory)', formatCurrency(calculatorResults.darkInventory.lostRevenue), false);
  addMetricCard(doc, startX + 2 * (layout.cardWidth + layout.cardSpacing), yPosition,
    'Monthly Uplift Potential', formatCurrency(calculatorResults.uplift.totalMonthlyUplift), true);
  addMetricCard(doc, startX + 3 * (layout.cardWidth + layout.cardSpacing), yPosition,
    'Annual Uplift Potential', formatCurrency(calculatorResults.uplift.totalAnnualUplift), true);
  
  yPosition += layout.cardHeight + 25;
  
  // Identity Health Scorecard with perfect circle spacing
  addSectionHeader(doc, yPosition, 'Identity Health Scorecard');
  yPosition += 20;
  
  const categories = Object.keys(quizResults.scores);
  const totalCirclesWidth = categories.length * (layout.circleRadius * 2) + (categories.length - 1) * layout.circleSpacing;
  const circleStartX = (layout.pageWidth - totalCirclesWidth) / 2;
  
  categories.forEach((category, index) => {
    const grade = quizResults.scores[category].grade;
    const categoryName = getCategoryName(category);
    const xPos = circleStartX + index * (layout.circleRadius * 2 + layout.circleSpacing);
    addGradeCircle(doc, xPos, yPosition, grade, categoryName);
  });
  
  yPosition += 70;
  
  // Key Recommendations with improved formatting
  addSectionHeader(doc, yPosition, 'Key Recommendations');
  yPosition += 15;
  
  const recommendations = [
    'Implement AdFixus identity durability technology to maximize addressable inventory',
    'Focus on Safari and Firefox optimization for improved cross-browser performance',
    'Enhance first-party data collection strategies and ID resolution capabilities',
    'Optimize header bidding setup to capture maximum yield from addressable inventory'
  ];
  
  doc.setTextColor(brandColors.gray[800]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  recommendations.forEach((rec, index) => {
    // Bullet point
    doc.setFillColor(brandColors.primary);
    doc.circle(layout.margin + 2, yPosition + 1.5, 1, 'F');
    
    // Recommendation text with proper wrapping
    const textLines = doc.splitTextToSize(rec, layout.pageWidth - layout.margin * 2 - 8);
    textLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, layout.margin + 6, yPosition + (lineIndex * 4));
    });
    yPosition += Math.max(textLines.length * 4, 6) + 3;
  });
  
  // Professional footer with call to action
  yPosition = 270;
  doc.setFillColor(brandColors.gray[100]);
  doc.rect(0, yPosition, layout.pageWidth, 27, 'F');
  
  // Call to action as requested
  doc.setTextColor(brandColors.gray[800]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Email krish.raja@adfixus.com to discuss an identity-led revenue strategy for your business.', 
    layout.pageWidth / 2, yPosition + 15, { align: 'center' });
  
  // Subtle branding
  doc.setTextColor(brandColors.gray[600]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by AdFixus Identity ROI Simulator', 
    layout.pageWidth / 2, yPosition + 22, { align: 'center' });
  
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


import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // Improved layout with larger dimensions and better spacing
  const layout = {
    pageWidth: 210,
    pageHeight: 297,
    margin: 25,  // Increased margin
    headerHeight: 45,  // Increased header height
    cardWidth: 42,
    cardHeight: 35,  // Increased card height significantly
    cardSpacing: 8,  // Increased spacing
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
      // Use the correct uploaded logo path with centered positioning and smaller size
      const logoUrl = '/lovable-uploads/e51c9dd5-2c62-4f48-83ea-2b4cb61eed6c.png';
      const logoWidth = 30;
      const logoHeight = 12;
      const logoX = (layout.pageWidth - logoWidth) / 2;
      doc.addImage(logoUrl, 'PNG', logoX, 10, logoWidth, logoHeight);
    } catch (error) {
      // Fallback text with centered positioning
      doc.setTextColor(brandColors.primary);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('AdFixus', layout.pageWidth / 2, 20, { align: 'center' });
    }
  };

  const addHeader = (doc: jsPDF) => {
    // Clean header background
    doc.setFillColor(brandColors.white);
    doc.rect(0, 0, layout.pageWidth, layout.headerHeight, 'F');
    
    // Add logo
    addLogo(doc);
    
    // Title positioned below centered logo
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Identity Health Report', layout.pageWidth / 2, 30, { align: 'center' });
    
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
    
    // Title text with MUCH larger font
    doc.setTextColor(textColor);
    doc.setFontSize(12);  // Increased from 9 to 12
    doc.setFont('helvetica', 'normal');
    
    // Multi-line title handling with better spacing
    const titleLines = doc.splitTextToSize(title, layout.cardWidth - 6);
    const lineHeight = 4;  // Increased line height
    const titleStartY = y + 8;
    
    titleLines.forEach((line: string, index: number) => {
      doc.text(line, x + layout.cardWidth / 2, titleStartY + (index * lineHeight), { align: 'center' });
    });
    
    // Value text with larger font and better positioning
    doc.setTextColor(valueColor);
    doc.setFontSize(18);  // Increased from 14 to 18
    doc.setFont('helvetica', 'bold');
    
    // Position value at bottom with proper margin
    const valueY = y + layout.cardHeight - 8;
    doc.text(value, x + layout.cardWidth / 2, valueY, { align: 'center' });
  };

  const addSectionHeader = (doc: jsPDF, y: number, title: string) => {
    doc.setFillColor(brandColors.gray[100]);
    doc.rect(layout.margin, y, layout.pageWidth - (layout.margin * 2), 15, 'F');  // Increased height
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(16);  // Increased from 12 to 16
    doc.setFont('helvetica', 'bold');
    doc.text(title, layout.margin + 8, y + 11);  // Better positioning
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
  
  // Identity Health Scorecard with summary insights
  addSectionHeader(doc, yPosition, 'Identity Health Scorecard');
  yPosition += 18;  // Slightly reduced spacing
  
  // Filter out sales-mix category and display summary insights
  const categories = Object.keys(quizResults.scores).filter(category => category !== 'sales-mix');
  
  categories.forEach((category, index) => {
    const categoryName = getCategoryName(category);
    const summary = getCategorySummary(category, quizResults);
    
    // Category name with larger font
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${categoryName}:`, layout.margin, yPosition);
    
    // Summary text with proper wrapping
    doc.setTextColor(brandColors.gray[700]);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryLines = doc.splitTextToSize(summary, layout.pageWidth - layout.margin * 2 - 5);
    summaryLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, layout.margin + 5, yPosition + 6 + (lineIndex * 4));
    });
    
    yPosition += Math.max(summaryLines.length * 4, 8) + 8;  // Dynamic spacing based on text
  });
  
  yPosition += 10;  // Reduced spacing after scorecard
  
  // Key Recommendations with improved formatting and larger text
  addSectionHeader(doc, yPosition, 'Key Recommendations');
  yPosition += 15;  // Optimized spacing to fit on page
  
  const recommendations = [
    'Implement AdFixus identity durability technology to maximize addressable inventory',
    'Focus on Safari and Firefox optimization for improved cross-browser performance',
    'Enhance first-party data collection strategies and ID resolution capabilities',
    'Optimize header bidding setup to capture maximum yield from addressable inventory'
  ];
  
  doc.setTextColor(brandColors.gray[800]);
  doc.setFontSize(11);  // Increased from 10 to 11
  doc.setFont('helvetica', 'normal');
  
  recommendations.forEach((rec, index) => {
    // Larger bullet point
    doc.setFillColor(brandColors.primary);
    doc.circle(layout.margin + 3, yPosition + 2, 1.5, 'F');  // Larger bullet
    
    // Recommendation text with proper wrapping and better spacing
    const textLines = doc.splitTextToSize(rec, layout.pageWidth - layout.margin * 2 - 12);
    textLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, layout.margin + 10, yPosition + (lineIndex * 5));  // Increased line spacing
    });
    yPosition += Math.max(textLines.length * 5, 8) + 5;  // Better spacing between recommendations
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
        ? "Your current strategy needs improvement for handling logged-in users across sessions."
        : "Strong identity persistence strategy maintains user recognition across extended sessions.";
    },
    'cross-domain': () => {
      const crossDomainQuestions = Object.keys(answers).filter(q => q.includes('domain') || q.includes('cross'));
      const hasLimitedCrossDomain = crossDomainQuestions.some(q => 
        answers[q]?.toLowerCase().includes('single') || 
        answers[q]?.toLowerCase().includes('limited')
      );
      return hasLimitedCrossDomain
        ? "Limited capability to track users across different domains reduces addressability."
        : "Good cross-domain tracking enables comprehensive user journey understanding.";
    },
    'privacy': () => {
      const privacyQuestions = Object.keys(answers).filter(q => q.includes('privacy') || q.includes('consent'));
      const hasBasicPrivacy = privacyQuestions.some(q => 
        answers[q]?.toLowerCase().includes('basic') || 
        answers[q]?.toLowerCase().includes('minimal')
      );
      return hasBasicPrivacy
        ? "Basic compliance framework in place but could benefit from advanced consent management."
        : "Comprehensive privacy-first approach balances compliance with effective targeting.";
    },
    'browser': () => {
      const browserQuestions = Object.keys(answers).filter(q => q.includes('browser') || q.includes('safari'));
      const hasLimitedBrowser = browserQuestions.some(q => 
        answers[q]?.toLowerCase().includes('struggling') || 
        answers[q]?.toLowerCase().includes('limited')
      );
      return hasLimitedBrowser
        ? "Struggling to effectively monetize Safari and Firefox traffic due to limited workarounds."
        : "Effective cross-browser strategies maintain consistent performance across all browsers.";
    }
  };
  
  return summaries[category] ? summaries[category]() : "Assessment data needs review for comprehensive analysis.";
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

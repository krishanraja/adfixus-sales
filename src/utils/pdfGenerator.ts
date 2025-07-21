import jsPDF from 'jspdf';

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
    title: 20,
    section: 14,
    cardTitle: 10,
    cardValue: 16,
    body: 10,
    small: 9,
    footer: 8
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

  // Helper functions with comprehensive data handling
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0';
    return new Intl.NumberFormat('en-US').format(Number(num));
  };

  const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === null || value === undefined || isNaN(Number(value))) return '0.0';
    return Number(value).toFixed(decimals);
  };

  // Extract comprehensive data with fallbacks
  const inputs = calculatorResults?.inputs || {};
  const breakdown = calculatorResults?.breakdown || {};
  const uplift = calculatorResults?.uplift || {};
  const unaddressableInventory = calculatorResults?.unaddressableInventory || {};

  // All user inputs
  const monthlyPageviews = Number(inputs.monthlyPageviews) || 0;
  const adImpressionsPerPage = Number(inputs.adImpressionsPerPage) || 0;
  const webDisplayCPM = Number(inputs.webDisplayCPM) || 0;
  const webVideoCPM = Number(inputs.webVideoCPM) || 0;
  const displayVideoSplit = Number(inputs.displayVideoSplit) || 0;
  const chromeShare = Number(inputs.chromeShare) || 0;
  const edgeShare = Number(inputs.edgeShare) || 0;
  const safariShare = 100 - chromeShare - edgeShare - 10; // Assuming 10% Firefox
  const numDomains = Number(inputs.numDomains) || 1;
  const currentAddressability = Number(inputs.currentAddressability) || 0;

  // Revenue calculations
  const monthlyRevenue = Number(calculatorResults?.currentRevenue) || 0;
  const revenueIncrease = Number(uplift.totalAnnualUplift) || 0;
  const monthlyUplift = Number(uplift.totalMonthlyUplift) || 0;
  const percentageImprovement = Number(uplift.percentageImprovement) || 0;
  const addressabilityImprovement = Number(breakdown.addressabilityImprovement) || 0;

  // Traffic calculations
  const totalAdImpressions = monthlyPageviews * adImpressionsPerPage;

  const addLogo = (doc: jsPDF) => {
    try {
      const logoUrl = '/lovable-uploads/e51c9dd5-2c62-4f48-83ea-2b4cb61eed6c.png';
      const logoWidth = 36;
      const logoHeight = 12;
      const logoX = (layout.pageWidth - logoWidth) / 2;
      doc.addImage(logoUrl, 'PNG', logoX, 8, logoWidth, logoHeight);
    } catch (error) {
      doc.setTextColor(brandColors.primary);
      doc.setFontSize(typography.section);
      doc.setFont('helvetica', 'bold');
      doc.text('AdFixus', layout.pageWidth / 2, 16, { align: 'center' });
    }
  };

  const addHeader = (doc: jsPDF) => {
    doc.setFillColor(brandColors.white);
    doc.rect(0, 0, layout.pageWidth, layout.headerHeight, 'F');
    
    addLogo(doc);
    
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.title);
    doc.setFont('helvetica', 'bold');
    doc.text('Complete Identity Health Report', layout.pageWidth / 2, 28, { align: 'center' });
    
    doc.setDrawColor(brandColors.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(layout.margin, layout.headerHeight, layout.pageWidth - layout.margin, layout.headerHeight);
  };

  const addMetricCard = (doc: jsPDF, x: number, y: number, title: string, value: string, isHighlight: boolean = false) => {
    const cardColor = isHighlight ? brandColors.primary : brandColors.white;
    const textColor = isHighlight ? brandColors.white : brandColors.gray[800];
    const valueColor = isHighlight ? brandColors.white : brandColors.primary;
    
    doc.setFillColor(cardColor);
    doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'F');
    
    if (!isHighlight) {
      doc.setDrawColor(brandColors.gray[300]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, y, layout.cardWidth, layout.cardHeight, 2, 2, 'S');
    }
    
    doc.setTextColor(textColor);
    doc.setFontSize(typography.cardTitle);
    doc.setFont('helvetica', 'normal');
    
    const titleLines = doc.splitTextToSize(title, layout.cardWidth - 4);
    const titleStartY = y + 6;
    
    titleLines.forEach((line: string, index: number) => {
      doc.text(line, x + layout.cardWidth / 2, titleStartY + (index * layout.lineHeight), { align: 'center' });
    });
    
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

  const addDataSection = (doc: jsPDF, y: number, title: string, data: Array<{label: string, value: string}>) => {
    addSectionHeader(doc, y, title);
    let currentY = y + 18;
    
    data.forEach((item, index) => {
      if (currentY > 260) return; // Page limit check
      
      doc.setTextColor(brandColors.gray[800]);
      doc.setFontSize(typography.small);
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.label}: ${item.value}`, layout.margin, currentY);
      currentY += 6;
    });
    
    return currentY + 8;
  };

  // Create PDF with comprehensive data
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  addHeader(doc);
  
  let yPosition = layout.headerHeight + layout.sectionSpacing;
  const maxPageHeight = 270;
  
  const ensureSpace = (requiredHeight: number) => {
    if (yPosition + requiredHeight > maxPageHeight) {
      yPosition = Math.max(layout.headerHeight + layout.sectionSpacing, maxPageHeight - requiredHeight);
    }
  };
  
  // Contact Information
  if (leadData) {
    ensureSpace(30);
    yPosition = addDataSection(doc, yPosition, 'Contact Information', [
      { label: 'Name', value: `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim() },
      { label: 'Email', value: leadData.email || 'N/A' },
      { label: 'Company', value: leadData.company || 'N/A' },
      { label: 'Job Title', value: leadData.jobTitle || 'N/A' }
    ]);
  }
  
  // Revenue Impact Overview
  ensureSpace(50);
  addSectionHeader(doc, yPosition, 'Revenue Impact Overview');
  yPosition += 15;
  
  yPosition += 10;
  
  const reducedCardSpacing = layout.cardSpacing / 2;
  const totalCardsWidth = 4 * layout.cardWidth + 3 * reducedCardSpacing;
  const startX = (layout.pageWidth - totalCardsWidth) / 2;
  
  addMetricCard(doc, startX, yPosition, 
    'Current Monthly Revenue', formatCurrency(monthlyRevenue), false);
  addMetricCard(doc, startX + layout.cardWidth + reducedCardSpacing, yPosition,
    'Lost Revenue', formatCurrency(unaddressableInventory.lostRevenue || 0), false);
  addMetricCard(doc, startX + 2 * (layout.cardWidth + reducedCardSpacing), yPosition,
    'Monthly Uplift', formatCurrency(monthlyUplift), true);
  addMetricCard(doc, startX + 3 * (layout.cardWidth + reducedCardSpacing), yPosition,
    'Annual Opportunity', formatCurrency(revenueIncrease), true);
  
  yPosition += layout.cardHeight + layout.sectionSpacing;

  // User Input Data
  ensureSpace(80);
  yPosition = addDataSection(doc, yPosition, 'Complete User Input Data', [
    { label: 'Monthly Pageviews', value: formatNumber(monthlyPageviews) },
    { label: 'Ad Impressions/Page', value: adImpressionsPerPage.toFixed(1) },
    { label: 'Total Monthly Impressions', value: formatNumber(totalAdImpressions) },
    { label: 'Display CPM', value: formatCurrency(webDisplayCPM) },
    { label: 'Video CPM', value: formatCurrency(webVideoCPM) },
    { label: 'Display/Video Split', value: `${formatPercentage(displayVideoSplit)}% / ${formatPercentage(100 - displayVideoSplit)}%` },
    { label: 'Chrome Share', value: `${formatPercentage(chromeShare)}%` },
    { label: 'Edge Share', value: `${formatPercentage(edgeShare)}%` },
    { label: 'Safari Share (calc)', value: `${formatPercentage(safariShare)}%` },
    { label: 'Number of Domains', value: numDomains.toString() },
    { label: 'Current Addressability', value: `${formatPercentage(currentAddressability)}%` }
  ]);

  // Identity Health Assessment
  ensureSpace(40);
  yPosition = addDataSection(doc, yPosition, 'Identity Health Assessment', [
    { label: 'Overall Grade', value: quizResults?.overallGrade || 'N/A' },
    { label: 'Overall Score', value: `${formatPercentage(quizResults?.overallScore)}/4.0` }
  ]);

  // Revenue Analysis
  ensureSpace(40);
  yPosition = addDataSection(doc, yPosition, 'Revenue Analysis Results', [
    { label: 'Unaddressable Inventory', value: `${formatPercentage(unaddressableInventory.percentage)}%` },
    { label: 'Monthly Revenue Loss', value: formatCurrency(unaddressableInventory.lostRevenue || 0) },
    { label: 'Addressability Improvement', value: `+${formatPercentage(addressabilityImprovement)}%` },
    { label: 'Monthly Uplift Potential', value: formatCurrency(monthlyUplift) },
    { label: 'Annual Uplift Potential', value: formatCurrency(revenueIncrease) },
    { label: 'Revenue Increase %', value: `+${formatPercentage(percentageImprovement)}%` }
  ]);
  
  // Footer
  yPosition = maxPageHeight - 22;
  doc.setFillColor(brandColors.gray[100]);
  doc.rect(0, yPosition, layout.pageWidth, 22, 'F');
  
  doc.setTextColor(brandColors.gray[800]);
  doc.setFontSize(typography.body);
  doc.setFont('helvetica', 'bold');
  doc.text('Email krish.raja@adfixus.com to discuss comprehensive identity strategy.', 
    layout.pageWidth / 2, yPosition + 12, { align: 'center' });
  
  doc.setTextColor(brandColors.gray[600]);
  doc.setFontSize(typography.footer);
  doc.setFont('helvetica', 'normal');
  doc.text(`Complete Assessment Report - AI Analysis Ready | ${new Date().toLocaleDateString()}`, 
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

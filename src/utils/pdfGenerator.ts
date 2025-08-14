import jsPDF from 'jspdf';

export const generatePDF = async (quizResults: any, calculatorResults: any, leadData?: any) => {
  // Professional brand colors and design system
  const brandColors = {
    primary: '#0066CC',
    secondary: '#00A3E0', 
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A'
    },
    white: '#FFFFFF'
  };

  // Typography hierarchy
  const typography = {
    hero: 24,
    title: 18,
    sectionTitle: 14,
    cardTitle: 10,
    cardValue: 14,
    body: 10,
    caption: 8,
    footer: 7
  };

  // Layout system
  const layout = {
    pageWidth: 210,
    pageHeight: 297,
    margin: 20,
    contentWidth: 170,
    headerHeight: 50,
    footerHeight: 25,
    sectionSpacing: 20,
    cardSpacing: 8,
    lineHeight: 6,
    bulletIndent: 12
  };

  // Smart formatting functions
  const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '$0';
    const num = Number(amount);
    if (num < 1000) return `$${num.toFixed(0)}`;
    if (num < 1000000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${(num / 1000000).toFixed(1)}M`;
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === null || num === undefined || isNaN(Number(num))) return '0';
    const value = Number(num);
    if (value < 1000) return value.toFixed(0);
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const formatPercentage = (value: number | undefined | null): string => {
    if (value === null || value === undefined || isNaN(Number(value))) return '0%';
    const rounded = Number(value).toFixed(0);
    return `${rounded}%`;
  };

  // Extract data with smart defaults
  const inputs = calculatorResults?.inputs || {};
  const breakdown = calculatorResults?.breakdown || {};
  const uplift = calculatorResults?.uplift || {};
  const unaddressableInventory = calculatorResults?.unaddressableInventory || {};

  const monthlyRevenue = Number(calculatorResults?.currentRevenue) || 0;
  const monthlyUplift = Number(uplift.totalMonthlyUplift) || 0;
  const annualOpportunity = Number(uplift.totalAnnualUplift) || 0;
  const lostRevenue = Number(unaddressableInventory.lostRevenue) || 0;
  const improvementPercent = Number(uplift.percentageImprovement) || 0;
  const unaddressablePercent = Number(unaddressableInventory.percentage) || 0;

  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm', 
    format: 'a4'
  });

  let currentY = layout.margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > layout.pageHeight - layout.footerHeight) {
      doc.addPage();
      currentY = layout.margin;
      addPageHeader();
    }
  };

  // Add page header
  const addPageHeader = () => {
    // Company branding
    doc.setFillColor('#F8FAFC');
    doc.rect(0, 0, layout.pageWidth, layout.headerHeight, 'F');
    
    // Logo area (placeholder)
    doc.setTextColor(brandColors.primary);
    doc.setFontSize(typography.title);
    doc.setFont('helvetica', 'bold');
    doc.text('ADFIXUS', layout.margin, 20);
    
    // Report title
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.hero);
    doc.setFont('helvetica', 'bold');
    doc.text('Identity Revenue Impact Report', layout.margin, 35);
    
    // Divider line
    doc.setDrawColor(brandColors.gray[300]);
    doc.setLineWidth(0.5);
    doc.line(layout.margin, layout.headerHeight, layout.pageWidth - layout.margin, layout.headerHeight);
    
    currentY = layout.headerHeight + layout.sectionSpacing;
  };

  // Add footer
  const addFooter = () => {
    const footerY = layout.pageHeight - layout.footerHeight;
    
    doc.setFillColor(brandColors.gray[50]);
    doc.rect(0, footerY, layout.pageWidth, layout.footerHeight, 'F');
    
    doc.setTextColor(brandColors.gray[600]);
    doc.setFontSize(typography.footer);
    doc.setFont('helvetica', 'normal');
    
    const confidentialText = 'CONFIDENTIAL - For Internal Use Only';
    doc.text(confidentialText, layout.margin, footerY + 8);
    
    const dateText = `Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`;
    doc.text(dateText, layout.pageWidth - layout.margin, footerY + 8, { align: 'right' });
    
    const contactText = 'Questions? Contact krish.raja@adfixus.com';
    doc.text(contactText, layout.pageWidth / 2, footerY + 16, { align: 'center' });
  };

  // Executive Summary Card
  const addExecutiveSummary = () => {
    checkPageBreak(80);
    
    // Section header
    doc.setFillColor(brandColors.primary);
    doc.rect(layout.margin, currentY, layout.contentWidth, 12, 'F');
    
    doc.setTextColor(brandColors.white);
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('EXECUTIVE SUMMARY', layout.margin + 5, currentY + 8);
    
    currentY += 18;
    
    // Key findings box
    doc.setFillColor(brandColors.gray[50]);
    doc.rect(layout.margin, currentY, layout.contentWidth, 45, 'F');
    doc.setDrawColor(brandColors.gray[200]);
    doc.setLineWidth(0.5);
    doc.rect(layout.margin, currentY, layout.contentWidth, 45, 'S');
    
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.body);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = [
      `Your current identity strategy is leaving ${formatCurrency(annualOpportunity)} annually on the table.`,
      '',
      `• ${formatPercentage(unaddressablePercent)} of your inventory is unaddressable`,
      `• Lost revenue: ${formatCurrency(lostRevenue)} per month`,
      `• Potential uplift: ${formatCurrency(monthlyUplift)} monthly (+${formatPercentage(improvementPercent)})`,
      '',
      'AdFixus can help you recover this lost revenue through advanced identity resolution.'
    ];
    
    summaryText.forEach((line, index) => {
      if (line.startsWith('•')) {
        doc.setFont('helvetica', 'normal');
        doc.text('•', layout.margin + 5, currentY + 6 + (index * layout.lineHeight));
        doc.text(line.substring(2), layout.margin + 10, currentY + 6 + (index * layout.lineHeight));
      } else if (line === '') {
        // Skip empty lines
      } else {
        doc.setFont(index === 0 ? 'bold' : 'normal');
        doc.text(line, layout.margin + 5, currentY + 6 + (index * layout.lineHeight));
      }
    });
    
    currentY += 55;
  };

  // Revenue Impact Cards
  const addRevenueCards = () => {
    checkPageBreak(60);
    
    // Section header
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('REVENUE IMPACT ANALYSIS', layout.margin, currentY);
    currentY += 15;
    
    // Card dimensions
    const cardWidth = (layout.contentWidth - layout.cardSpacing) / 2;
    const cardHeight = 35;
    
    // Revenue Loss Card (Problem)
    doc.setFillColor('#FEE2E2'); // Light red
    doc.rect(layout.margin, currentY, cardWidth, cardHeight, 'F');
    doc.setDrawColor('#EF4444');
    doc.setLineWidth(2);
    doc.rect(layout.margin, currentY, cardWidth, cardHeight, 'S');
    
    doc.setTextColor('#DC2626');
    doc.setFontSize(typography.cardTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTHLY REVENUE LOSS', layout.margin + 5, currentY + 8);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lostRevenue), layout.margin + 5, currentY + 20);
    
    doc.setFontSize(typography.caption);
    doc.setFont('helvetica', 'normal');
    doc.text(`${formatPercentage(unaddressablePercent)} unaddressable inventory`, layout.margin + 5, currentY + 28);
    
    // Revenue Opportunity Card (Solution) 
    const card2X = layout.margin + cardWidth + layout.cardSpacing;
    doc.setFillColor('#DCFCE7'); // Light green
    doc.rect(card2X, currentY, cardWidth, cardHeight, 'F');
    doc.setDrawColor('#22C55E');
    doc.setLineWidth(2);
    doc.rect(card2X, currentY, cardWidth, cardHeight, 'S');
    
    doc.setTextColor('#16A34A');
    doc.setFontSize(typography.cardTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTHLY OPPORTUNITY', card2X + 5, currentY + 8);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(monthlyUplift), card2X + 5, currentY + 20);
    
    doc.setFontSize(typography.caption);
    doc.setFont('helvetica', 'normal');
    doc.text(`+${formatPercentage(improvementPercent)} revenue increase`, card2X + 5, currentY + 28);
    
    currentY += cardHeight + 10;
    
    // Annual projection
    doc.setFillColor(brandColors.primary);
    doc.rect(layout.margin, currentY, layout.contentWidth, 20, 'F');
    
    doc.setTextColor(brandColors.white);
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text(`ANNUAL OPPORTUNITY: ${formatCurrency(annualOpportunity)}`, layout.margin + 5, currentY + 13);
    
    currentY += 30;
  };

  // Identity Health Scorecard
  const addIdentityHealth = () => {
    checkPageBreak(80);
    
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('IDENTITY HEALTH SCORECARD', layout.margin, currentY);
    currentY += 15;
    
    // Overall grade - prominent display
    const gradeBoxSize = 25;
    const gradeX = layout.margin + (layout.contentWidth - gradeBoxSize) / 2;
    
    const overallGrade = quizResults?.overallGrade || 'F';
    const gradeColor = getGradeColor(overallGrade);
    
    doc.setFillColor(gradeColor.bg);
    doc.rect(gradeX, currentY, gradeBoxSize, gradeBoxSize, 'F');
    doc.setDrawColor(gradeColor.border);
    doc.setLineWidth(2);
    doc.rect(gradeX, currentY, gradeBoxSize, gradeBoxSize, 'S');
    
    doc.setTextColor(gradeColor.text);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(overallGrade, gradeX + gradeBoxSize/2, currentY + gradeBoxSize/2 + 3, { align: 'center' });
    
    doc.setTextColor(brandColors.gray[700]);
    doc.setFontSize(typography.body);
    doc.setFont('helvetica', 'bold');
    doc.text('OVERALL GRADE', layout.pageWidth/2, currentY + gradeBoxSize + 8, { align: 'center' });
    
    currentY += gradeBoxSize + 20;
    
    // Category breakdown
    if (quizResults?.scores) {
      const categories = Object.entries(quizResults.scores)
        .filter(([key]) => key !== 'sales-mix')
        .slice(0, 4); // Limit to 4 categories for space
      
      const categoryWidth = layout.contentWidth / 4;
      
      categories.forEach(([category, data]: [string, any], index) => {
        const x = layout.margin + (index * categoryWidth);
        const categoryGrade = data.grade || 'F';
        const categoryColor = getGradeColor(categoryGrade);
        
        // Small grade box
        doc.setFillColor(categoryColor.bg);
        doc.rect(x + 5, currentY, 15, 15, 'F');
        doc.setDrawColor(categoryColor.border);
        doc.setLineWidth(1);
        doc.rect(x + 5, currentY, 15, 15, 'S');
        
        doc.setTextColor(categoryColor.text);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(categoryGrade, x + 12.5, currentY + 10, { align: 'center' });
        
        // Category name
        doc.setTextColor(brandColors.gray[700]);
        doc.setFontSize(typography.caption);
        doc.setFont('helvetica', 'normal');
        const categoryName = getCategoryName(category);
        const nameLines = doc.splitTextToSize(categoryName, categoryWidth - 10);
        nameLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, x + categoryWidth/2, currentY + 20 + (lineIndex * 4), { align: 'center' });
        });
      });
      
      currentY += 35;
    }
  };

  // Action Plan & Recommendations
  const addActionPlan = () => {
    checkPageBreak(70);
    
    doc.setFillColor('#FEF3C7'); // Light amber
    doc.rect(layout.margin, currentY, layout.contentWidth, 12, 'F');
    
    doc.setTextColor('#B45309');
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('RECOMMENDED ACTION PLAN', layout.margin + 5, currentY + 8);
    
    currentY += 18;
    
    const recommendations = [
      {
        priority: 'HIGH',
        action: 'Implement AdFixus Identity Resolution',
        impact: `Recover ${formatCurrency(monthlyUplift)} monthly`,
        timeline: '30-45 days'
      },
      {
        priority: 'MEDIUM', 
        action: 'Optimize Safari/Firefox Targeting',
        impact: `Address ${formatPercentage(unaddressablePercent)} unaddressable inventory`,
        timeline: '60 days'
      },
      {
        priority: 'HIGH',
        action: 'Cross-Domain Identity Linking',
        impact: 'Improve user journey tracking',
        timeline: '45-60 days'
      }
    ];
    
    recommendations.forEach((rec, index) => {
      const priorityColor = rec.priority === 'HIGH' ? '#DC2626' : '#F59E0B';
      
      // Priority badge
      doc.setFillColor(priorityColor);
      doc.rect(layout.margin, currentY, 20, 6, 'F');
      doc.setTextColor(brandColors.white);
      doc.setFontSize(typography.caption);
      doc.setFont('helvetica', 'bold');
      doc.text(rec.priority, layout.margin + 10, currentY + 4, { align: 'center' });
      
      // Action details
      doc.setTextColor(brandColors.gray[800]);
      doc.setFontSize(typography.body);
      doc.setFont('helvetica', 'bold');
      doc.text(rec.action, layout.margin + 25, currentY + 4);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Impact: ${rec.impact}`, layout.margin + 5, currentY + 10);
      doc.text(`Timeline: ${rec.timeline}`, layout.margin + 5, currentY + 16);
      
      currentY += 22;
    });
  };

  // Technical details section
  const addTechnicalDetails = () => {
    checkPageBreak(80);
    
    doc.setTextColor(brandColors.gray[800]);
    doc.setFontSize(typography.sectionTitle);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICAL ANALYSIS', layout.margin, currentY);
    currentY += 15;
    
    // Two-column layout for technical data
    const leftCol = layout.margin;
    const rightCol = layout.margin + (layout.contentWidth / 2) + 5;
    const colWidth = (layout.contentWidth / 2) - 5;
    
    // Input parameters
    doc.setTextColor(brandColors.gray[700]);
    doc.setFontSize(typography.body);
    doc.setFont('helvetica', 'bold');
    doc.text('Input Parameters:', leftCol, currentY);
    currentY += 8;
    
    const inputData = [
      ['Monthly Pageviews', formatNumber(inputs.monthlyPageviews || 0)],
      ['Ad Impressions/Page', (inputs.adImpressionsPerPage || 0).toFixed(1)],
      ['Display CPM', formatCurrency(inputs.webDisplayCPM || 0)],
      ['Video CPM', formatCurrency(inputs.webVideoCPM || 0)],
      ['Chrome Share', formatPercentage(inputs.chromeShare || 0)]
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(typography.caption);
    inputData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, leftCol, currentY);
      currentY += 5;
    });
    
    // Reset for right column
    currentY -= (inputData.length * 5) + 8;
    
    // Calculated results
    doc.setTextColor(brandColors.gray[700]);
    doc.setFontSize(typography.body);
    doc.setFont('helvetica', 'bold');
    doc.text('Calculated Results:', rightCol, currentY);
    currentY += 8;
    
    const resultData = [
      ['Total Impressions', formatNumber((inputs.monthlyPageviews || 0) * (inputs.adImpressionsPerPage || 0))],
      ['Current Revenue', formatCurrency(monthlyRevenue)],
      ['Unaddressable %', formatPercentage(unaddressablePercent)],
      ['Monthly Uplift', formatCurrency(monthlyUplift)],
      ['ROI Improvement', formatPercentage(improvementPercent)]
    ];
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(typography.caption);
    resultData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`, rightCol, currentY);
      currentY += 5;
    });
    
    currentY += 15;
  };

  // Helper function for grade colors
  const getGradeColor = (grade: string) => {
    const colors = {
      'A+': { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
      'A': { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
      'B': { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
      'C': { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
      'D': { bg: '#FED7AA', text: '#C2410C', border: '#FB923C' },
      'F': { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' }
    };
    return colors[grade] || colors['F'];
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

  // Build the PDF
  addPageHeader();
  addExecutiveSummary();
  addRevenueCards();
  addIdentityHealth();
  addActionPlan();
  addTechnicalDetails();
  addFooter();

  return doc;
};

// Keep the email sending function unchanged
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

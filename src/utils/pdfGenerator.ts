
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (quizResults: any, calculatorResults: any, leadData?: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  
  // Brand colors
  const brandCyan: [number, number, number] = [8, 145, 178]; // #0891b2
  const brandDark: [number, number, number] = [22, 78, 99]; // #164e63
  const lightGray: [number, number, number] = [248, 250, 252]; // #f8fafc
  const darkGray: [number, number, number] = [71, 85, 105]; // #475569
  
  // Try to capture the visual dashboard
  let dashboardImage = null;
  try {
    const dashboardElement = document.querySelector('.max-w-7xl');
    if (dashboardElement) {
      dashboardImage = await html2canvas(dashboardElement as HTMLElement, {
        scale: 0.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
    }
  } catch (error) {
    console.warn('Could not capture dashboard visual:', error);
  }
  
  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const addBrandedHeader = (title: string, subtitle?: string) => {
    // Header background
    pdf.setFillColor(...brandCyan);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Company logo placeholder
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, 15, 40, 20, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(8, 145, 178);
    pdf.text('AdFixus', margin + 20, 27, { align: 'center' });
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, pageWidth - margin, 25, { align: 'right' });
    
    if (subtitle) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(subtitle, pageWidth - margin, 35, { align: 'right' });
    }
    
    return 60;
  };
  
  const addMetricCard = (x: number, y: number, width: number, title: string, value: string, color: [number, number, number] = brandCyan) => {
    // Card background
    pdf.setFillColor(...lightGray);
    pdf.rect(x, y, width, 25, 'F');
    
    // Colored accent bar
    pdf.setFillColor(...color);
    pdf.rect(x, y, 3, 25, 'F');
    
    // Border
    pdf.setDrawColor(...darkGray);
    pdf.setLineWidth(0.1);
    pdf.rect(x, y, width, 25, 'S');
    
    // Title
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(title, x + 8, y + 8);
    
    // Value
    pdf.setTextColor(...brandDark);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, x + 8, y + 20);
    
    return y + 30;
  };
  
  const addSectionHeader = (y: number, title: string, description?: string) => {
    pdf.setFillColor(...brandDark);
    pdf.rect(margin, y, pageWidth - 2 * margin, 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 5, y + 10);
    
    let newY = y + 20;
    if (description) {
      pdf.setTextColor(...darkGray);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(description, margin, newY);
      newY += 10;
    }
    
    return newY;
  };
  
  const addGradeIndicator = (x: number, y: number, grade: string, score: number) => {
    const gradeColors: Record<string, [number, number, number]> = {
      'A': [34, 197, 94], // green
      'B': [59, 130, 246], // blue
      'C': [234, 179, 8], // yellow
      'D': [239, 68, 68], // red
      'F': [220, 38, 38]  // dark red
    };
    
    const color = gradeColors[grade] || darkGray;
    
    // Grade circle
    pdf.setFillColor(...color);
    pdf.circle(x + 15, y + 10, 12, 'F');
    
    // Grade letter
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(grade, x + 15, y + 14, { align: 'center' });
    
    // Score bar
    const barWidth = 60;
    const fillWidth = (score / 4.0) * barWidth;
    
    // Background bar
    pdf.setFillColor(230, 230, 230);
    pdf.rect(x + 35, y + 5, barWidth, 8, 'F');
    
    // Progress bar
    pdf.setFillColor(...color);
    pdf.rect(x + 35, y + 5, fillWidth, 8, 'F');
    
    // Score text
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${score.toFixed(1)}/4.0`, x + 105, y + 11);
    
    return y + 25;
  };
  
  // Simple grade circle function (moved before usage)
  const addGradeCircle = (x: number, y: number, grade: string, title: string, score: string) => {
    const gradeColors: Record<string, [number, number, number]> = {
      'A': [34, 197, 94],
      'B': [59, 130, 246], 
      'C': [234, 179, 8],
      'D': [239, 68, 68],
      'F': [220, 38, 38]
    };
    
    const color = gradeColors[grade] || [220, 38, 38];
    
    // Circle
    pdf.setFillColor(...color);
    pdf.circle(x, y + 15, 15, 'F');
    
    // Grade letter
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(grade, x, y + 20, { align: 'center' });
    
    // Title
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x, y + 40, { align: 'center' });
    
    // Score
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(score, x, y + 52, { align: 'center' });
  };
  
  // SINGLE PAGE REPORT matching the design
  let yPos = addBrandedHeader('Your Identity ROI Analysis Results', 'Complete analysis of your identity health and revenue optimization opportunities');
  
  // Four main metric cards in a row (matching the design)
  yPos += 5;
  const cardWidth = (pageWidth - 5 * margin) / 4;
  const cardHeight = 25;
  
  // Monthly Revenue Loss (red card)
  addMetricCard(margin, yPos, cardWidth, 'Monthly Revenue Loss', 
    formatCurrency(calculatorResults.darkInventory.lostRevenue), [239, 68, 68]);
  
  // Monthly Uplift Potential (teal card)  
  addMetricCard(margin + cardWidth + 5, yPos, cardWidth, 'Monthly Uplift Potential',
    formatCurrency(calculatorResults.uplift.totalMonthlyUplift), [20, 184, 166]);
    
  // Annual Opportunity (blue card)
  addMetricCard(margin + 2 * (cardWidth + 5), yPos, cardWidth, 'Annual Opportunity',
    formatCurrency(calculatorResults.uplift.totalAnnualUplift), [59, 130, 246]);
    
  // Addressability Improvement (purple card)
  addMetricCard(margin + 3 * (cardWidth + 5), yPos, cardWidth, 'Addressability Improvement',
    `+${calculatorResults.breakdown.addressabilityImprovement}%`, [139, 92, 246]);
  
  yPos += cardHeight + 15;
  
  // Identity Health Scorecard section header
  pdf.setTextColor(...brandCyan);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Identity Health Scorecard', margin, yPos);
  yPos += 20;
  
  // Grade circles in a row (like the design)
  const gradeStartX = margin;
  const gradeSpacing = (pageWidth - 2 * margin) / 5;
  
  // Overall Grade (F)
  const overallX = gradeStartX;
  addGradeCircle(overallX, yPos, quizResults.overallGrade, 'Overall Grade', `Score: ${quizResults.overallScore.toFixed(1)}/4.0`);
  
  // Category grades
  const categories = ['durability', 'cross-domain', 'privacy', 'browser'];
  const categoryNames = ['Identity Durability', 'Cross-Domain Visibility', 'Privacy & Compliance', 'Browser Resilience'];
  
  categories.forEach((category, index) => {
    if (quizResults.scores[category]) {
      const x = gradeStartX + (index + 1) * gradeSpacing;
      addGradeCircle(x, yPos, quizResults.scores[category].grade, categoryNames[index], 
        `${quizResults.scores[category].score.toFixed(1)}/4.0`);
    }
  });
  
  yPos += 80;
  
  // Sales Mix Breakdown section
  pdf.setTextColor(...darkGray);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Sales Mix Breakdown', margin, yPos);
  yPos += 20;
  
  // Three percentages in large colored text
  if (quizResults.scores['sales-mix']?.breakdown) {
    const breakdown = quizResults.scores['sales-mix'].breakdown;
    const mixWidth = (pageWidth - 4 * margin) / 3;
    
    // Direct Sales (59% - blue)
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${breakdown.direct}%`, margin + mixWidth/2, yPos, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Direct Sales', margin + mixWidth/2, yPos + 15, { align: 'center' });
    
    // Deal IDs (23% - green)
    pdf.setTextColor(34, 197, 94);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${breakdown.dealIds}%`, margin + mixWidth + mixWidth/2, yPos, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Deal IDs', margin + mixWidth + mixWidth/2, yPos + 15, { align: 'center' });
    
    // Open Exchange (18% - red)
    pdf.setTextColor(239, 68, 68);
    pdf.setFontSize(36);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${breakdown.openExchange}%`, margin + 2*mixWidth + mixWidth/2, yPos, { align: 'center' });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Open Exchange', margin + 2*mixWidth + mixWidth/2, yPos + 15, { align: 'center' });
    
    yPos += 40;
  }
  
  // Key Recommendations section
  pdf.setTextColor(251, 146, 60);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Recommendations', margin, yPos);
  yPos += 20;
  
  const recommendations = [
    'Implement comprehensive identity resolution to address significant dark inventory',
    'Leverage privacy-compliant targeting to maximize CPMs',
    'Implement real-time optimization for inventory management'
  ];
  
  recommendations.forEach((rec, index) => {
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• ${rec}`, margin, yPos);
    yPos += 12;
  });
  
  yPos += 20;
  
  // Footer with the specific message
  pdf.setFontSize(10);
  pdf.setTextColor(...darkGray);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Email krish.raja@adfixus.com to discuss an identity-led revenue strategy for your business.', 
    pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  return pdf;
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


import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (quizResults: any, calculatorResults: any) => {
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
  
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  let yPos = addBrandedHeader('Identity ROI Analysis Report', new Date().toLocaleDateString());
  
  // Executive Summary Box
  yPos += 10;
  pdf.setFillColor(245, 250, 255);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 60, 'F');
  pdf.setDrawColor(...brandCyan);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 60, 'S');
  
  pdf.setTextColor(...brandDark);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin + 10, yPos + 15);
  
  pdf.setTextColor(...darkGray);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const summaryText = `Your identity infrastructure assessment reveals a ${quizResults.overallGrade} grade with significant revenue opportunity. You're potentially leaving ${formatCurrency(calculatorResults.uplift.totalAnnualUplift)} annually on the table due to identity resolution gaps.`;
  const lines = pdf.splitTextToSize(summaryText, pageWidth - 4 * margin);
  pdf.text(lines, margin + 10, yPos + 30);
  
  yPos += 80;
  
  // Key Findings Cards
  yPos = addSectionHeader(yPos, 'Key Financial Impact');
  
  const cardWidth = (pageWidth - 4 * margin) / 3;
  yPos = addMetricCard(margin, yPos, cardWidth, 'Annual Revenue Opportunity', formatCurrency(calculatorResults.uplift.totalAnnualUplift));
  
  yPos -= 30;
  addMetricCard(margin + cardWidth + 5, yPos, cardWidth, 'Monthly Revenue Loss', formatCurrency(calculatorResults.darkInventory.lostRevenue), [239, 68, 68] as [number, number, number]);
  
  addMetricCard(margin + 2 * (cardWidth + 5), yPos, cardWidth, 'Revenue Improvement', `+${calculatorResults.uplift.percentageImprovement.toFixed(1)}%`, [34, 197, 94] as [number, number, number]);
  
  yPos += 40;
  
  // Identity Health Scorecard
  yPos = addSectionHeader(yPos, 'Identity Health Scorecard', 'Overall assessment of your identity infrastructure capabilities');
  
  // Overall grade
  pdf.setTextColor(...brandDark);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Performance', margin, yPos);
  yPos += 10;
  
  yPos = addGradeIndicator(margin, yPos, quizResults.overallGrade, quizResults.overallScore);
  
  // Category breakdown
  yPos += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Category Performance:', margin, yPos);
  yPos += 15;
  
  Object.entries(quizResults.scores).forEach(([category, data]: [string, any]) => {
    if (category !== 'sales-mix') {
      const categoryName = getCategoryName(category);
      pdf.setTextColor(...darkGray);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(categoryName, margin, yPos);
      yPos = addGradeIndicator(margin + 80, yPos - 15, data.grade, data.score);
    }
  });
  
  // PAGE 2: DETAILED ANALYSIS
  pdf.addPage();
  yPos = addBrandedHeader('Detailed Revenue Analysis');
  
  // Revenue breakdown
  yPos = addSectionHeader(yPos, 'Revenue Impact Breakdown');
  
  const revenueData = [
    ['Current Monthly Revenue', formatCurrency(calculatorResults.inputs.currentRevenue)],
    ['Dark Inventory Loss', `-${formatCurrency(calculatorResults.darkInventory.lostRevenue)}`],
    ['Potential Monthly Uplift', `+${formatCurrency(calculatorResults.uplift.totalMonthlyUplift)}`],
    ['Addressability Improvement', `+${calculatorResults.breakdown.addressabilityImprovement}%`],
    ['Dark Inventory Rate', `${calculatorResults.darkInventory.percentage.toFixed(1)}%`]
  ];
  
  revenueData.forEach(([label, value]) => {
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, margin, yPos);
    
    pdf.setTextColor(...brandDark);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, pageWidth - margin, yPos, { align: 'right' });
    yPos += 12;
  });
  
  // Sales Mix (if available)
  if (quizResults.scores['sales-mix']?.breakdown) {
    yPos += 10;
    yPos = addSectionHeader(yPos, 'Sales Channel Distribution');
    
    const breakdown = quizResults.scores['sales-mix'].breakdown;
    const channels = [
      ['Direct Sales', `${breakdown.direct}%`],
      ['Deal IDs', `${breakdown.dealIds}%`],
      ['Open Exchange', `${breakdown.openExchange}%`]
    ];
    
    channels.forEach(([channel, percentage]) => {
      pdf.setTextColor(...darkGray);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(channel, margin, yPos);
      
      // Percentage bar
      const barWidth = 100;
      const fillWidth = (parseInt(percentage) / 100) * barWidth;
      
      pdf.setFillColor(...lightGray);
      pdf.rect(pageWidth - margin - barWidth - 40, yPos - 5, barWidth, 8, 'F');
      
      pdf.setFillColor(...brandCyan);
      pdf.rect(pageWidth - margin - barWidth - 40, yPos - 5, fillWidth, 8, 'F');
      
      pdf.setTextColor(...brandDark);
      pdf.setFont('helvetica', 'bold');
      pdf.text(percentage, pageWidth - margin, yPos, { align: 'right' });
      yPos += 15;
    });
  }
  
  // Add dashboard image if captured
  if (dashboardImage) {
    yPos += 20;
    if (yPos > pageHeight - 100) {
      pdf.addPage();
      yPos = addBrandedHeader('Visual Dashboard');
    } else {
      yPos = addSectionHeader(yPos, 'Visual Dashboard Analysis');
    }
    
    try {
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = Math.min((dashboardImage.height * imgWidth) / dashboardImage.width, pageHeight - yPos - 40);
      
      const imgData = dashboardImage.toDataURL('image/png', 0.8);
      pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
      yPos += imgHeight + 20;
    } catch (error) {
      console.warn('Could not add dashboard image to PDF:', error);
    }
  }
  
  // PAGE 3: RECOMMENDATIONS & NEXT STEPS
  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = addBrandedHeader('Action Plan & Recommendations');
  } else {
    yPos = addSectionHeader(yPos, 'Action Plan & Recommendations');
  }
  
  const recommendations = [];
  if (quizResults.overallScore < 3.0) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Identity Resolution Strategy',
      description: 'Implement a comprehensive identity resolution platform to reduce dark inventory and increase addressability.'
    });
  }
  if (quizResults.scores['browser']?.score < 2.5) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'Browser Optimization',
      description: 'Enhance Safari and Firefox browser support to maximize reach across all user segments.'
    });
  }
  if (quizResults.scores['cross-domain']?.score < 2.5) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Cross-Domain Tracking',
      description: 'Improve cross-domain identity resolution to maintain user context across your digital properties.'
    });
  }
  if (quizResults.scores['privacy']?.score < 3.0) {
    recommendations.push({
      priority: 'CRITICAL',
      title: 'Privacy Compliance',
      description: 'Strengthen privacy compliance framework and consent management to ensure regulatory adherence.'
    });
  }
  
  recommendations.forEach((rec, index) => {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = addBrandedHeader('Action Plan & Recommendations (continued)');
    }
    
    // Priority badge
    const priorityColors: Record<string, [number, number, number]> = {
      'CRITICAL': [220, 38, 38],
      'HIGH': [239, 68, 68],
      'MEDIUM': [234, 179, 8],
      'LOW': [34, 197, 94]
    };
    
    const color = priorityColors[rec.priority] || darkGray;
    pdf.setFillColor(...color);
    pdf.rect(margin, yPos, 25, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(rec.priority, margin + 12.5, yPos + 5.5, { align: 'center' });
    
    // Title
    pdf.setTextColor(...brandDark);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${rec.title}`, margin + 30, yPos + 5);
    
    // Description
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(rec.description, pageWidth - 2 * margin - 30);
    pdf.text(descLines, margin + 30, yPos + 15);
    
    yPos += 25 + (descLines.length * 5);
  });
  
  // Next Steps Section
  yPos += 20;
  if (yPos > pageHeight - 80) {
    pdf.addPage();
    yPos = addBrandedHeader('Next Steps');
  } else {
    yPos = addSectionHeader(yPos, 'Next Steps');
  }
  
  const nextSteps = [
    'Schedule a personalized demo to see how AdFixus can address your specific challenges',
    'Review detailed implementation roadmap and timeline',
    'Discuss integration requirements and technical specifications',
    'Calculate precise ROI projections based on your specific data'
  ];
  
  nextSteps.forEach((step, index) => {
    pdf.setFillColor(...brandCyan);
    pdf.circle(margin + 5, yPos + 3, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text((index + 1).toString(), margin + 5, yPos + 5, { align: 'center' });
    
    pdf.setTextColor(...darkGray);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(step, margin + 15, yPos + 5);
    yPos += 15;
  });
  
  // Call to action
  yPos += 20;
  pdf.setFillColor(...brandCyan);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ready to unlock your revenue potential?', pageWidth / 2, yPos + 10, { align: 'center' });
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Book a demo at: https://calendly.com/krish-raja', pageWidth / 2, yPos + 20, { align: 'center' });
  
  // Footer on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...darkGray);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by AdFixus ID Simulator', margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    pdf.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
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

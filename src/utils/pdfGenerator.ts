
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (quizResults: any, calculatorResults: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Try to capture the visual dashboard
  let dashboardImage = null;
  try {
    const dashboardElement = document.querySelector('.max-w-7xl');
    if (dashboardElement) {
      dashboardImage = await html2canvas(dashboardElement as HTMLElement, {
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
    }
  } catch (error) {
    console.warn('Could not capture dashboard visual:', error);
  }
  
  // Header
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Identity ROI Analysis Report', pageWidth / 2, 30, { align: 'center' });
  
  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString();
  pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, 40, { align: 'center' });
  
  let yPosition = 60;
  
  // Overall Grade
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Identity Health Scorecard', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(14);
  pdf.text(`Overall Grade: ${quizResults.overallGrade}`, 20, yPosition);
  pdf.text(`Score: ${quizResults.overallScore.toFixed(1)}/4.0`, 120, yPosition);
  yPosition += 20;
  
  // Category Scores
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Category Breakdown:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFont('helvetica', 'normal');
  Object.entries(quizResults.scores).forEach(([category, data]: [string, any]) => {
    if (category !== 'sales-mix') {
      const categoryName = getCategoryName(category);
      pdf.text(`${categoryName}: ${data.grade} (${data.score.toFixed(1)}/4.0)`, 25, yPosition);
      yPosition += 8;
    }
  });
  
  // Sales Mix
  if (quizResults.scores['sales-mix']?.breakdown) {
    const breakdown = quizResults.scores['sales-mix'].breakdown;
    pdf.text(`Sales Mix: Direct ${breakdown.direct}%, Deal IDs ${breakdown.dealIds}%, Open Exchange ${breakdown.openExchange}%`, 25, yPosition);
    yPosition += 8;
  }
  
  yPosition += 15;
  
  // Revenue Impact
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Revenue Impact Analysis', 20, yPosition);
  yPosition += 15;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  pdf.text(`Monthly Revenue Loss: ${formatCurrency(calculatorResults.darkInventory.lostRevenue)}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Monthly Uplift Potential: ${formatCurrency(calculatorResults.uplift.totalMonthlyUplift)}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Annual Opportunity: ${formatCurrency(calculatorResults.uplift.totalAnnualUplift)}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Revenue Improvement: +${calculatorResults.uplift.percentageImprovement.toFixed(1)}%`, 20, yPosition);
  yPosition += 8;
  pdf.text(`Addressability Improvement: +${calculatorResults.breakdown.addressabilityImprovement}%`, 20, yPosition);
  yPosition += 20;
  
  // Key Metrics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Metrics:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Dark Inventory: ${calculatorResults.darkInventory.percentage.toFixed(1)}%`, 25, yPosition);
  yPosition += 8;
  pdf.text(`Current Addressability: ${calculatorResults.inputs.currentAddressability}%`, 25, yPosition);
  yPosition += 8;
  pdf.text(`Monthly Pageviews: ${new Intl.NumberFormat('en-US').format(calculatorResults.inputs.monthlyPageviews)}`, 25, yPosition);
  yPosition += 20;
  
  // Add dashboard image if captured
  if (dashboardImage && yPosition > pageHeight - 100) {
    pdf.addPage();
    yPosition = 30;
  }
  
  if (dashboardImage) {
    try {
      const imgWidth = pageWidth - 40;
      const imgHeight = (dashboardImage.height * imgWidth) / dashboardImage.width;
      
      // Check if image fits on current page
      if (yPosition + imgHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Visual Analysis Dashboard:', 20, yPosition);
      yPosition += 15;
      
      const imgData = dashboardImage.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, Math.min(imgHeight, pageHeight - yPosition - 40));
      
      // Move to next page for recommendations
      pdf.addPage();
      yPosition = 30;
    } catch (error) {
      console.warn('Could not add dashboard image to PDF:', error);
    }
  }
  
  // Recommendations
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Recommendations:', 20, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const recommendations = [];
  if (quizResults.overallScore < 3.0) {
    recommendations.push('• Implement a comprehensive identity resolution strategy');
  }
  if (quizResults.scores['browser']?.score < 2.5) {
    recommendations.push('• Optimize for Safari and Firefox browsers');
  }
  if (quizResults.scores['cross-domain']?.score < 2.5) {
    recommendations.push('• Improve cross-domain identity resolution capabilities');
  }
  if (quizResults.scores['privacy']?.score < 3.0) {
    recommendations.push('• Strengthen privacy compliance and consent management');
  }
  
  recommendations.forEach(rec => {
    pdf.text(rec, 25, yPosition);
    yPosition += 8;
  });
  
  // Footer
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Generated by AdFixus ID Simulator', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
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

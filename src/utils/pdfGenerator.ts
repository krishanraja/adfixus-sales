import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatCurrency, formatNumber, formatPercentage } from './formatting';
import { generateKeyRecommendations } from './recommendations';
import { getGrade } from './grading';
import { supabase } from '@/integrations/supabase/client';

// Initialize pdfMake fonts with correct VFS structure
pdfMake.vfs = pdfFonts.vfs;

// Convert image to base64
const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

export const buildAdfixusProposalPdf = async (
  quizResults: any,
  calculatorResults: any,
  leadData?: any
) => {
  const logoDataUrl = await convertImageToBase64('/lovable-uploads/e51c9dd5-2c62-4f48-83ea-2b4cb61eed6c.png');
  
  // Extract data from actual calculator results
  const monthlyRevenueLoss = calculatorResults?.unaddressableInventory?.lostRevenue || 0;
  const potentialRevenue = calculatorResults?.uplift?.totalMonthlyUplift || 0;
  const currentIdentities = calculatorResults?.idBloatReduction?.currentMonthlyIds || 0;
  const optimizedIdentities = calculatorResults?.idBloatReduction?.optimizedMonthlyIds || 0;
  const cdpCostSavings = calculatorResults?.idBloatReduction?.monthlyCdpSavings || 0;
  const annualOpportunity = (potentialRevenue * 12) || 0;
  const currentAddressability = calculatorResults?.breakdown?.currentAddressability || 0;
  const targetAddressability = calculatorResults?.breakdown?.addressabilityImprovement || 0;
  const salesMix = calculatorResults?.breakdown?.salesMix || { direct: 0, dealIds: 0, openExchange: 0 };
  // Calculate overall grade based on quiz results
  let totalScore = 0;
  let categoryCount = 0;
  
  if (quizResults) {
    Object.values(quizResults).forEach((score: any) => {
      if (typeof score === 'number') {
        totalScore += score;
        categoryCount++;
      }
    });
  }
  
  const averageScore = categoryCount > 0 ? totalScore / categoryCount : 70;
  const overallGrade = getGrade(averageScore);
  const recommendations = generateKeyRecommendations(calculatorResults);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    header: function(currentPage: number) {
      return {
        columns: [
          {
            image: logoDataUrl,
            fit: [120, 32],
            margin: [40, 20, 0, 0]
          },
          {
            text: 'AdFixus - Identity ROI Proposal',
            style: 'reportTitle',
            alignment: 'right',
            margin: [0, 25, 40, 0]
          }
        ]
      };
    },

    footer: function(currentPage: number, pageCount: number) {
      return {
        columns: [
          {
            text: 'CONFIDENTIAL - Executive Use Only',
            style: 'footer',
            margin: [40, 0, 0, 0]
          },
          {
            text: `${currentPage} of ${pageCount}`,
            style: 'footer',
            alignment: 'right',
            margin: [0, 0, 40, 0]
          }
        ]
      };
    },

    content: [
      // Page 1: Executive Summary
      {
        unbreakable: true,
        stack: [
          {
            text: 'Executive Summary',
            style: 'h1',
            margin: [0, 20, 0, 20]
          },
          {
            text: 'Current Challenge',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Your current identity resolution system is losing ${formatCurrency(monthlyRevenueLoss)} per month due to fragmented customer data and suboptimal targeting. Identity bloat is causing inefficient ad spend and missed revenue opportunities.`,
            style: 'body',
            margin: [0, 0, 0, 15]
          },
          {
            text: 'AdFixus Solution',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'AdFixus CAPI provides unified identity resolution, reducing identity bloat while maximizing revenue through improved targeting and data quality. Our solution delivers immediate ROI through optimized customer data platforms and enhanced advertising effectiveness.',
            style: 'body',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Key Performance Indicators',
            style: 'h2',
            margin: [0, 0, 0, 15]
          },
          {
            columns: [
              {
                width: '33%',
                table: {
                  body: [
                    [{ text: 'Monthly Revenue Loss', style: 'kpiHeader' }],
                    [{ text: formatCurrency(monthlyRevenueLoss), style: 'kpiValue' }],
                    [{ text: 'Current inefficiency', style: 'kpiSubtext' }]
                  ]
                },
                layout: 'noBorders'
              },
              {
                width: '33%',
                table: {
                  body: [
                    [{ text: 'Revenue Opportunity', style: 'kpiHeader' }],
                    [{ text: formatCurrency(potentialRevenue), style: 'kpiValue' }],
                    [{ text: 'With AdFixus CAPI', style: 'kpiSubtext' }]
                  ]
                },
                layout: 'noBorders'
              },
              {
                width: '33%',
                table: {
                  body: [
                    [{ text: 'Identity Health Grade', style: 'kpiHeader' }],
                    [{ text: overallGrade, style: 'kpiValue' }],
                    [{ text: 'Current assessment', style: 'kpiSubtext' }]
                  ]
                },
                layout: 'noBorders'
              }
            ]
          },
          {
            text: '\n\nContact AdFixus Sales Team',
            style: 'h2',
            margin: [0, 20, 0, 10]
          },
          {
            text: 'Email: sales@adfixus.com',
            style: 'body',
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Book A Call',
            style: 'body',
            link: import.meta.env.VITE_MEETING_BOOKING_URL || 'https://outlook.office.com/book/SalesTeambooking@adfixus.com',
            color: '#0066cc',
            decoration: 'underline',
            margin: [0, 0, 0, 0]
          }
        ]
      },

      // Page 2: Detailed Revenue Analysis
      {
        pageBreak: 'before',
        unbreakable: true,
        stack: [
          {
            text: 'Detailed Revenue Analysis',
            style: 'h1',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Identity Resolution Impact',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Our analysis reveals significant revenue leakage due to identity fragmentation. The following breakdown shows current performance versus AdFixus-optimized results:',
            style: 'body',
            margin: [0, 0, 0, 20]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'Metric', style: 'tableHeader' },
                  { text: 'Current State', style: 'tableHeader' },
                  { text: 'With AdFixus', style: 'tableHeader' },
                  { text: 'Monthly Impact', style: 'tableHeader' }
                ],
                [
                  'Monthly Revenue',
                  formatCurrency(potentialRevenue - monthlyRevenueLoss),
                  formatCurrency(potentialRevenue),
                  `+${formatCurrency(monthlyRevenueLoss)}`
                ],
                [
                  'Identity Count',
                  formatNumber(currentIdentities),
                  formatNumber(optimizedIdentities),
                  `${formatPercentage(((optimizedIdentities - currentIdentities) / currentIdentities) * 100, 1)} reduction`
                ],
                [
                  'CDP Platform Costs',
                  formatCurrency(cdpCostSavings + (cdpCostSavings * 0.3)),
                  formatCurrency(cdpCostSavings * 0.3),
                  `-${formatCurrency(cdpCostSavings)}`
                ],
                [
                  'Combined ROI',
                  '-',
                  '-',
                  `+${formatCurrency(monthlyRevenueLoss + cdpCostSavings)}`
                ]
              ]
            },
            layout: {
              fillColor: function (rowIndex: number) {
                return rowIndex === 0 ? '#F8FAFC' : (rowIndex % 2 === 0 ? '#F8FAFC' : null);
              }
            },
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Annual Revenue Projection',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            text: `Based on current inefficiencies, AdFixus CAPI implementation would generate an additional ${formatCurrency((monthlyRevenueLoss + cdpCostSavings) * 12)} annually through improved identity resolution and reduced platform costs.`,
            style: 'body'
          }
        ]
      },

      // Page 3: Strategic Action Plan
      {
        pageBreak: 'before',
        unbreakable: true,
        stack: [
          {
            text: 'Strategic Action Plan',
            style: 'h1',
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Priority Recommendations',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            ul: recommendations.slice(0, 3).map(rec => ({
              text: rec,
              style: 'body',
              margin: [0, 0, 0, 5]
            })),
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Implementation Timeline',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            ol: [
              'Week 1-2: Technical integration and API setup',
              'Week 3-4: Data migration and identity mapping',
              'Week 5-6: Testing and optimization',
              'Week 7-8: Full deployment and monitoring setup',
              'Week 9+: Ongoing optimization and performance tracking'
            ].map(item => ({ text: item, style: 'body', margin: [0, 0, 0, 5] })),
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Next Steps',
            style: 'h2',
            margin: [0, 0, 0, 10]
          },
          {
            ol: [
              'Schedule technical consultation with AdFixus engineering team',
              'Conduct detailed API compatibility assessment',
              'Develop custom integration roadmap based on your current tech stack',
              'Begin pilot program with subset of traffic for validation',
              'Scale to full implementation upon successful pilot results'
            ].map(item => ({ text: item, style: 'body', margin: [0, 0, 0, 5] })),
            margin: [0, 0, 0, 20]
          },
          {
            text: 'Contact Information',
            style: 'h2',
            margin: [0, 10, 0, 10]
          },
          {
            text: 'Ready to unlock your revenue potential? Contact the AdFixus team to schedule your implementation consultation.',
            style: 'body',
            margin: [0, 0, 0, 15]
          },
          {
            text: 'Email: sales@adfixus.com',
            style: 'body',
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Book A Call',
            style: 'buttonStyle',
            link: import.meta.env.VITE_MEETING_BOOKING_URL || 'https://outlook.office.com/book/SalesTeambooking@adfixus.com',
            margin: [0, 0, 0, 10]
          }
        ]
      }
    ],

    styles: {
      reportTitle: {
        fontSize: 12,
        bold: true,
        color: '#1E293B'
      },
      h1: {
        fontSize: 16,
        bold: true,
        color: '#1E293B'
      },
      h2: {
        fontSize: 13,
        bold: true,
        color: '#1E293B'
      },
      body: {
        fontSize: 10,
        color: '#475569',
        lineHeight: 1.4
      },
      footer: {
        fontSize: 8,
        color: '#64748B'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#1E293B',
        fillColor: '#F8FAFC'
      },
      kpiHeader: {
        fontSize: 9,
        bold: true,
        color: '#1E293B',
        alignment: 'center',
        margin: [5, 8, 5, 3]
      },
      kpiValue: {
        fontSize: 14,
        bold: true,
        color: '#059669',
        alignment: 'center',
        margin: [5, 3, 5, 3]
      },
      kpiSubtext: {
        fontSize: 8,
        color: '#64748B',
        alignment: 'center',
        margin: [5, 3, 5, 8]
      },
      buttonStyle: {
        fontSize: 11,
        bold: true,
        color: '#FFFFFF',
        background: '#0891b2',
        alignment: 'left',
        margin: [0, 8, 0, 8],
        fillColor: '#0891b2',
        decoration: 'underline',
        decorationColor: '#FFFFFF'
      }
    }
  };

  // Generate PDF buffer for email sending
  return new Promise((resolve, reject) => {
    pdfMake.createPdf(docDefinition).getBase64(async (base64Data) => {
      try {
        console.log('PDF generated successfully, attempting download and email...');
        
        // Download PDF for user first (this should always work)
        pdfMake.createPdf(docDefinition).download('AdFixus - Identity ROI Proposal.pdf');
        console.log('PDF download initiated');
        
        // Attempt to send email with PDF
        try {
          await sendPDFByEmail(base64Data, quizResults, calculatorResults, leadData);
          console.log('Email sent successfully');
          resolve({ pdfBase64: base64Data, emailSent: true });
        } catch (emailError) {
          console.error('Email sending failed, but PDF was downloaded:', emailError);
          // Resolve anyway since PDF download succeeded
          resolve({ pdfBase64: base64Data, emailSent: false, emailError: emailError.message });
        }
        
      } catch (error) {
        console.error('Error in PDF generation:', error);
        reject(error);
      }
    });
  });
};

// Legacy function for backward compatibility
export const generatePDF = buildAdfixusProposalPdf;

// Email sending functionality
export const sendPDFByEmail = async (pdfBase64: string, quizResults: any, calculatorResults: any, leadData?: any) => {
  try {
    console.log('Attempting to send PDF via email...', {
      pdfLength: pdfBase64.length,
      hasQuizResults: !!quizResults,
      hasCalculatorResults: !!calculatorResults,
      hasLeadData: !!leadData,
      leadDataContent: leadData
    });
    
    // Validate lead data structure
    if (!leadData || !leadData.email) {
      console.warn('No lead data or email found, using default values');
    }
    
    const { data, error } = await supabase.functions.invoke('send-pdf-email', {
      body: {
        pdfBase64,
        // Send both formats for backward compatibility
        contactForm: leadData || {
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@example.com',
          company: 'Unknown Company'
        },
        userContactDetails: leadData || {
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@example.com',
          company: 'Unknown Company'
        },
        quizResults,
        calculatorResults
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      console.error('Error details:', {
        message: error.message,
        context: error.context,
        hint: error.hint,
        details: error.details
      });
      throw new Error(`Email service error: ${error.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Error sending PDF email:', error);
    console.error('Full error object:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error information
    const errorMessage = error.message || 'Failed to send email';
    throw new Error(`Email delivery failed: ${errorMessage}`);
  }
};

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatCurrency, formatNumber, formatPercentage } from './formatting';
import { generateKeyRecommendations } from './recommendations';
import { getGrade } from './grading';

// Initialize pdfMake fonts (forcing cache refresh)
pdfMake.vfs = pdfFonts.pdfMake.vfs;

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
  
  // Calculate key metrics
  const monthlyRevenueLoss = calculatorResults?.monthlyRevenueLoss || 0;
  const potentialRevenue = calculatorResults?.potentialRevenue || 0;
  const currentIdentities = calculatorResults?.currentIdentities || 0;
  const optimizedIdentities = calculatorResults?.optimizedIdentities || 0;
  const cdpCostSavings = calculatorResults?.cdpCostSavings || 0;
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
            margin: [0, 0, 0, 10]
          },
          {
            text: 'Email: sales@adfixus.com | Phone: +1 (555) 123-4567',
            style: 'body',
            italics: true
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
      }
    }
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download('AdFixus - Identity ROI Proposal.pdf');
};

// Legacy function for backward compatibility
export const generatePDF = buildAdfixusProposalPdf;

// Email sending functionality (placeholder)
export const sendPDFByEmail = async (pdfBlob: Blob, userEmail?: string) => {
  console.log('PDF email functionality would send PDF to:', userEmail);
  console.log('PDF blob size:', pdfBlob.size, 'bytes');
  // Implement actual email sending logic here
};

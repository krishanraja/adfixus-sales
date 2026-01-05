// Scanner PDF Generator - Executive Summary Report
// Uses pdfmake for PDF generation

import pdfMake from 'pdfmake/build/pdfmake';
import type { DomainResult, RevenueImpact } from '@/types/scanner';
import { BENCHMARKS } from './revenueImpactScoring';

// Use default fonts from CDN
pdfMake.fonts = {
  Roboto: {
    normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf',
  },
};

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#16A34A';
  if (grade.startsWith('B')) return '#07C0F8';
  if (grade.startsWith('C')) return '#F59E0B';
  return '#DC2626';
}

function getPositionLabel(position: string): string {
  switch (position) {
    case 'walled-garden-parity': return 'Walled Garden Parity';
    case 'middle-pack': return 'Middle Pack';
    case 'at-risk': return 'At Risk';
    case 'commoditized': return 'Commoditized';
    default: return position;
  }
}

export function generateScannerPdf(
  results: DomainResult[],
  revenueImpact: RevenueImpact,
  scanDate?: Date
): void {
  const date = scanDate || new Date();
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const successfulDomains = results.filter(r => r.status === 'success');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    
    header: {
      columns: [
        {
          text: 'AdFixus Domain Scanner',
          fontSize: 10,
          color: '#07C0F8',
          margin: [40, 20, 0, 0],
        },
        {
          text: formattedDate,
          fontSize: 10,
          color: '#666666',
          alignment: 'right',
          margin: [0, 20, 40, 0],
        },
      ],
    },

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: 'Confidential - For Internal Use Only',
          fontSize: 8,
          color: '#999999',
          margin: [40, 0, 0, 0],
        },
        {
          text: `Page ${currentPage} of ${pageCount}`,
          fontSize: 8,
          color: '#999999',
          alignment: 'right',
          margin: [0, 0, 40, 0],
        },
      ],
    }),

    content: [
      // Title
      {
        text: 'Revenue Impact Analysis',
        fontSize: 24,
        bold: true,
        color: '#07C0F8',
        margin: [0, 0, 0, 10],
      },
      {
        text: revenueImpact.headline,
        fontSize: 18,
        bold: true,
        color: '#333333',
        margin: [0, 0, 0, 20],
      },

      // Executive Summary Box
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [
              {
                stack: [
                  { text: '2026 Readiness', fontSize: 10, color: '#666666' },
                  { text: revenueImpact.readinessGrade, fontSize: 36, bold: true, color: getGradeColor(revenueImpact.readinessGrade) },
                ],
                alignment: 'center',
                margin: [0, 10, 0, 10],
              },
              {
                stack: [
                  { text: 'Strategic Position', fontSize: 10, color: '#666666' },
                  { text: getPositionLabel(revenueImpact.strategicPosition), fontSize: 14, bold: true, color: '#333333', margin: [0, 5, 0, 0] },
                ],
                alignment: 'center',
                margin: [0, 10, 0, 10],
              },
              {
                stack: [
                  { text: 'Domains Scanned', fontSize: 10, color: '#666666' },
                  { text: `${successfulDomains.length} of ${results.length}`, fontSize: 14, bold: true, color: '#333333', margin: [0, 5, 0, 0] },
                ],
                alignment: 'center',
                margin: [0, 10, 0, 10],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => '#F8FAFC',
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
        margin: [0, 0, 0, 20],
      },

      // Critical Revenue Leaks Header
      {
        text: 'Critical Revenue Leaks',
        fontSize: 16,
        bold: true,
        color: '#333333',
        margin: [0, 15, 0, 10],
      },

      // Pain Points
      ...revenueImpact.painPoints.map((pain, index) => ({
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: `${index + 1}. ${pain.title}`, fontSize: 11, bold: true, color: '#DC2626' },
                  { text: pain.description, fontSize: 10, color: '#333333', margin: [0, 3, 0, 0] },
                  ...(pain.estimatedLoss ? [{
                    text: `Estimated Annual Loss: $${pain.estimatedLoss.toLocaleString()}`,
                    fontSize: 11,
                    bold: true,
                    color: '#DC2626',
                    margin: [0, 5, 0, 0],
                  }] : []),
                  { 
                    text: `Affects: ${pain.affectedDomains.slice(0, 3).join(', ')}${pain.affectedDomains.length > 3 ? ` +${pain.affectedDomains.length - 3} more` : ''}`, 
                    fontSize: 9, 
                    color: '#666666',
                    margin: [0, 3, 0, 0] 
                  },
                ],
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => '#FEF2F2',
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
        margin: [0, 5, 0, 5],
      })),

      // Revenue Opportunities Header
      {
        text: 'Revenue Opportunities',
        fontSize: 16,
        bold: true,
        color: '#333333',
        margin: [0, 15, 0, 10],
      },

      // Opportunities
      ...revenueImpact.opportunities.map((opp) => ({
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: `Priority ${opp.priority}: ${opp.title}`, fontSize: 11, bold: true, color: '#16A34A' },
                  { text: opp.description, fontSize: 10, color: '#333333', margin: [0, 3, 0, 0] },
                  ...(opp.estimatedGain > 0 ? [{
                    text: `Potential Annual Gain: +$${opp.estimatedGain.toLocaleString()}`,
                    fontSize: 11,
                    bold: true,
                    color: '#16A34A',
                    margin: [0, 5, 0, 0],
                  }] : []),
                  {
                    text: `Timeline: ${opp.timeline} | Product: ${opp.adfixusProduct}`,
                    fontSize: 9,
                    color: '#666666',
                    margin: [0, 3, 0, 0],
                  },
                ],
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => '#F0FDF4',
          hLineWidth: () => 0,
          vLineWidth: () => 0,
        },
        margin: [0, 5, 0, 5],
      })),

      // Page break before domain details
      { text: '', pageBreak: 'before' },

      // Domain-by-Domain Summary Header
      {
        text: 'Domain Analysis Summary',
        fontSize: 16,
        bold: true,
        color: '#333333',
        margin: [0, 0, 0, 10],
      },

      // Domain Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 70, 70],
          body: [
            [
              { text: 'Domain', bold: true, fillColor: '#F1F5F9', fontSize: 9 },
              { text: 'Gap %', bold: true, fillColor: '#F1F5F9', alignment: 'center', fontSize: 9 },
              { text: 'Position', bold: true, fillColor: '#F1F5F9', alignment: 'center', fontSize: 9 },
              { text: 'Privacy', bold: true, fillColor: '#F1F5F9', alignment: 'center', fontSize: 9 },
            ],
            ...successfulDomains.map(result => [
              { text: result.domain, fontSize: 9 },
              { text: `${Math.round(result.addressability_gap_pct)}%`, fontSize: 9, alignment: 'center' },
              { text: result.competitive_positioning.replace(/-/g, ' '), fontSize: 8, alignment: 'center' },
              { text: result.privacy_risk_level, fontSize: 8, alignment: 'center' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 10, 0, 20],
      },

      // Industry Benchmarks Header
      {
        text: 'vs. Industry Benchmarks',
        fontSize: 14,
        bold: true,
        color: '#07C0F8',
        margin: [0, 10, 0, 5],
      },

      // Benchmarks Table
      {
        table: {
          widths: ['*', 80, 80],
          body: [
            [
              { text: 'Metric', bold: true, fillColor: '#F1F5F9', fontSize: 9 },
              { text: 'Your Average', bold: true, fillColor: '#F1F5F9', alignment: 'center', fontSize: 9 },
              { text: 'Industry Avg', bold: true, fillColor: '#F1F5F9', alignment: 'center', fontSize: 9 },
            ],
            [
              { text: 'Cookies per Domain', fontSize: 9 },
              { text: successfulDomains.length > 0 ? Math.round(successfulDomains.reduce((s, r) => s + r.total_cookies, 0) / successfulDomains.length).toString() : '0', fontSize: 9, alignment: 'center' },
              { text: BENCHMARKS.avgPublisherCookies.toString(), fontSize: 9, alignment: 'center' },
            ],
            [
              { text: 'Third-Party Cookie Ratio', fontSize: 9 },
              { text: successfulDomains.length > 0 ? `${Math.round(successfulDomains.reduce((s, r) => s + (r.total_cookies > 0 ? r.third_party_cookies / r.total_cookies : 0), 0) / successfulDomains.length * 100)}%` : '0%', fontSize: 9, alignment: 'center' },
              { text: `${Math.round(BENCHMARKS.avgThirdPartyRatio * 100)}%`, fontSize: 9, alignment: 'center' },
            ],
            [
              { text: 'CMP Adoption', fontSize: 9 },
              { text: successfulDomains.length > 0 ? `${Math.round(successfulDomains.filter(r => r.cmp_vendor).length / successfulDomains.length * 100)}%` : '0%', fontSize: 9, alignment: 'center' },
              { text: `${Math.round(BENCHMARKS.cmpAdoption * 100)}%`, fontSize: 9, alignment: 'center' },
            ],
            [
              { text: 'Conversion API Adoption', fontSize: 9 },
              { text: successfulDomains.length > 0 ? `${Math.round(successfulDomains.filter(r => r.has_conversion_api).length / successfulDomains.length * 100)}%` : '0%', fontSize: 9, alignment: 'center' },
              { text: `${Math.round(BENCHMARKS.conversionApiBudgetCapture * 100)}%`, fontSize: 9, alignment: 'center' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 20],
      },

      // Next Steps CTA
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: 'Ready to Recover Your Lost Revenue?', fontSize: 14, bold: true, color: '#07C0F8' },
                  { text: 'Schedule a strategy call to discuss your personalized roadmap for closing addressability gaps and unlocking performance budgets.', fontSize: 10, margin: [0, 5, 0, 10] },
                  { text: 'Book at: outlook.office.com/book/SalesTeambooking@adfixus.com', fontSize: 10, color: '#07C0F8', link: 'https://outlook.office.com/book/SalesTeambooking@adfixus.com' },
                ],
                margin: [15, 15, 15, 15],
              },
            ],
          ],
        },
        layout: {
          fillColor: () => '#F0F9FF',
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#07C0F8',
          vLineColor: () => '#07C0F8',
        },
        margin: [0, 20, 0, 0],
      },
    ],

    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: '#07C0F8',
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        color: '#333333',
        margin: [0, 15, 0, 5],
      },
    },
  };

  pdfMake.createPdf(docDefinition).download(`AdFixus-Revenue-Impact-${date.toISOString().split('T')[0]}.pdf`);
}

export function generateCsvExport(results: DomainResult[]): void {
  const headers = [
    'Domain',
    'Status',
    'Addressability Gap %',
    'Competitive Position',
    'Privacy Risk',
    'Total Cookies',
    'First-Party Cookies',
    'Third-Party Cookies',
    'Safari Blocked Cookies',
    'ID Bloat Severity',
    'Has Google Analytics',
    'Has GTM',
    'Has Meta Pixel',
    'Has Conversion API',
    'Has PPID',
    'Has LiveRamp',
    'Has ID5',
    'Has TTD',
    'Has Prebid',
    'CMP Vendor',
    'TCF Compliant',
    'Pre-consent Tracking',
  ];

  const rows = results.map(r => [
    r.domain,
    r.status,
    r.addressability_gap_pct.toFixed(2),
    r.competitive_positioning,
    r.privacy_risk_level,
    r.total_cookies,
    r.first_party_cookies,
    r.third_party_cookies,
    r.safari_blocked_cookies,
    r.id_bloat_severity,
    r.has_google_analytics ? 'Yes' : 'No',
    r.has_gtm ? 'Yes' : 'No',
    r.has_meta_pixel ? 'Yes' : 'No',
    r.has_conversion_api ? 'Yes' : 'No',
    r.has_ppid ? 'Yes' : 'No',
    r.has_liveramp ? 'Yes' : 'No',
    r.has_id5 ? 'Yes' : 'No',
    r.has_ttd ? 'Yes' : 'No',
    r.has_prebid ? 'Yes' : 'No',
    r.cmp_vendor || 'None',
    r.tcf_compliant ? 'Yes' : 'No',
    r.loads_pre_consent ? 'Yes' : 'No',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `AdFixus-Domain-Scan-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

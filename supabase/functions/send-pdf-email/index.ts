import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  pdfBase64: string;
  // Support both formats for backward compatibility
  userContactDetails?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
  };
  contactForm?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    company?: string;
  };
  quizResults: any;
  calculatorResults: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Send PDF Email function called");
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Validate RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not found in environment");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("RESEND_API_KEY found successfully");

    const resend = new Resend(resendApiKey);
    
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody, null, 2));
    console.log("Request body structure:", {
      hasPdfBase64: !!requestBody.pdfBase64,
      hasUserContactDetails: !!requestBody.userContactDetails,
      hasContactForm: !!requestBody.contactForm,
      hasQuizResults: !!requestBody.quizResults,
      hasCalculatorResults: !!requestBody.calculatorResults,
      pdfBase64Length: requestBody.pdfBase64?.length || 0
    });
    
    const { pdfBase64, userContactDetails, contactForm, quizResults, calculatorResults }: EmailRequest = requestBody;

    // Validate required data
    if (!pdfBase64) {
      console.error("PDF data missing");
      return new Response(
        JSON.stringify({ error: "PDF data is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Support both contactForm and userContactDetails for backward compatibility
    const userInfo = contactForm || userContactDetails;
    if (!userInfo) {
      console.error("Missing or invalid contactForm data:", userInfo);
      return new Response(
        JSON.stringify({ error: "Contact form data is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Safely extract user information with fallbacks
    const userName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Unknown User';
    const userCompany = userInfo.company || 'Unknown Company';
    const userEmail = userInfo.email || 'Unknown Email';
    
    console.log("Sending PDF email for:", userEmail);
    console.log("Processing email for:", { userName, userCompany, userEmail });

    // Generate comprehensive email content that matches PDF depth
    const getGradeColor = (grade: string) => {
      const colors = {
        'A+': '#059669', 'A': '#10b981', 'B': '#3b82f6', 
        'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444'
      };
      return colors[grade] || '#ef4444';
    };

    const generateDetailedRecommendations = () => {
      const recommendations = [];
      
      if (calculatorResults?.unaddressableInventory?.percentage > 20) {
        recommendations.push('Implement comprehensive identity resolution to address significant unaddressable inventory');
      } else if (calculatorResults?.unaddressableInventory?.percentage > 10) {
        recommendations.push('Optimize identity resolution to capture remaining unaddressable inventory');
      } else {
        recommendations.push('Fine-tune identity resolution for maximum addressability rates');
      }

      const safariFirefoxShare = 100 - (calculatorResults?.inputs?.chromeShare || 70);
      if (safariFirefoxShare > 25) {
        recommendations.push('Implement Safari/Firefox-specific optimization strategies');
      }
      
      if ((calculatorResults?.breakdown?.currentAddressability || 0) < 70) {
        recommendations.push('Priority focus on improving overall addressability rates');
      }
      
      const salesMix = calculatorResults?.breakdown?.salesMix;
      if (salesMix) {
        if (salesMix.openExchange > 50) {
          recommendations.push('Consider increasing direct sales and deal ID usage to improve margins');
        }
        if (salesMix.direct < 30) {
          recommendations.push('Explore opportunities to grow direct sales relationships');
        }
      }
      
      if ((calculatorResults?.inputs?.displayVideoSplit || 0) < 20) {
        recommendations.push('Optimize video inventory monetization strategies');
      } else if ((calculatorResults?.inputs?.displayVideoSplit || 0) > 90) {
        recommendations.push('Consider expanding video inventory opportunities');
      }
      
      if ((calculatorResults?.inputs?.numDomains || 1) > 3) {
        recommendations.push('Implement cross-domain identity resolution for multi-domain operations');
      }
      
      if (recommendations.length < 3) {
        recommendations.push('Leverage privacy-compliant targeting to maximize CPMs');
        if (recommendations.length < 3) {
          recommendations.push('Implement real-time optimization for inventory management');
        }
      }
      
      return recommendations.slice(0, 6);
    };

    // Calculate monthly projection data
    const generateMonthlyProjection = () => {
      return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const baseCurrentRevenue = calculatorResults?.currentRevenue || 0;
        const maxUplift = calculatorResults?.uplift?.totalMonthlyUplift || 0;
        
        let rampFactor;
        if (month === 1) {
          rampFactor = 0.15;
        } else if (month === 2) {
          rampFactor = 0.35;
        } else {
          rampFactor = 1.0;
        }
        
        const fluctuationSeed = Math.sin(month * 0.8) * 0.05;
        const currentFluctuation = 1 + (fluctuationSeed * 0.5);
        const adFixusFluctuation = 1 + fluctuationSeed;
        
        const currentRevenue = baseCurrentRevenue * currentFluctuation;
        const upliftAmount = maxUplift * rampFactor * adFixusFluctuation;
        
        return {
          month: `Month ${month}`,
          current: Math.round(currentRevenue),
          withAdFixus: Math.round(currentRevenue + upliftAmount),
          uplift: Math.round(upliftAmount)
        };
      });
    };

    const monthlyProjectionData = generateMonthlyProjection();

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AdFixus Identity ROI Analysis Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f8fafc; }
          .container { max-width: 900px; margin: 0 auto; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 40px; text-align: center; }
          .content { padding: 40px; }
          .section { margin-bottom: 40px; padding: 25px; border-left: 4px solid #0891b2; background: #f8fafc; border-radius: 0 8px 8px 0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0; }
          .metric-card { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .metric-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
          .metric-label { font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .grade-badge { display: inline-block; padding: 12px 20px; border-radius: 25px; color: white; font-weight: bold; font-size: 20px; margin: 10px; }
          .recommendations li { margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .success { background: #d1fae5; border: 1px solid #10b981; }
          .info { background: #dbeafe; border: 1px solid #3b82f6; }
          .footer { text-align: center; padding: 30px; color: #64748b; font-size: 14px; border-top: 2px solid #e2e8f0; margin-top: 40px; background: #f8fafc; }
          .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          .data-table th { background: #f8fafc; font-weight: 600; color: #374151; }
          .projection-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .projection-table th { background: #0891b2; color: white; padding: 10px; }
          .projection-table td { padding: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .inventory-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .inventory-card { background: white; padding: 20px; border-radius: 8px; border: 2px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">Complete Identity ROI Analysis Results</h1>
            <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Comprehensive analysis with all user inputs, identity health assessment, and revenue optimization opportunities</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📋 Client Information & Contact Details</h2>
              <table class="data-table">
                <tr><td><strong>Contact Name:</strong></td><td>${userName}</td></tr>
                <tr><td><strong>Company:</strong></td><td>${userCompany}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${userEmail}</td></tr>
                <tr><td><strong>Analysis Date:</strong></td><td>${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</td></tr>
                <tr><td><strong>Analysis Time:</strong></td><td>${new Date().toLocaleTimeString('en-US')}</td></tr>
              </table>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📊 Complete User Input Parameters</h2>
              <div class="alert info">
                <p><strong>All calculator inputs provided by ${userCompany}:</strong></p>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Value</th>
                    <th>Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Monthly Pageviews</strong></td>
                    <td>${calculatorResults?.inputs?.monthlyPageviews?.toLocaleString() || 'N/A'}</td>
                    <td>Base inventory volume for revenue calculations</td>
                  </tr>
                  <tr>
                    <td><strong>Average CPM</strong></td>
                    <td>$${calculatorResults?.inputs?.avgCpm || 'N/A'}</td>
                    <td>Revenue per 1,000 ad impressions</td>
                  </tr>
                  <tr>
                    <td><strong>Chrome Browser Share</strong></td>
                    <td>${calculatorResults?.inputs?.chromeShare || 'N/A'}%</td>
                    <td>Affects current addressability rates</td>
                  </tr>
                  <tr>
                    <td><strong>Safari/Firefox Share</strong></td>
                    <td>${100 - (calculatorResults?.inputs?.chromeShare || 70)}%</td>
                    <td>Privacy-focused browsers with limited tracking</td>
                  </tr>
                  <tr>
                    <td><strong>Number of Domains</strong></td>
                    <td>${calculatorResults?.inputs?.numDomains || 'N/A'}</td>
                    <td>Cross-domain identity complexity</td>
                  </tr>
                  <tr>
                    <td><strong>Display/Video Split</strong></td>
                    <td>${calculatorResults?.inputs?.displayVideoSplit || 'N/A'}% Display / ${100 - (calculatorResults?.inputs?.displayVideoSplit || 50)}% Video</td>
                    <td>Inventory composition affects CPM rates</td>
                  </tr>
                  <tr>
                    <td><strong>Estimated Ad Impressions</strong></td>
                    <td>${calculatorResults?.breakdown?.totalAdImpressions?.toLocaleString() || 'N/A'}</td>
                    <td>Total monthly monetizable inventory</td>
                  </tr>
                  <tr>
                    <td><strong>Estimated Monthly Users</strong></td>
                    <td>${calculatorResults?.inputs?.monthlyPageviews ? Math.round(calculatorResults.inputs.monthlyPageviews / 2.5).toLocaleString() : 'N/A'}</td>
                    <td>Unique user base for identity analysis</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🎯 Executive Summary</h2>
              ${quizResults ? `
                <div style="text-align: center; margin: 30px 0;">
                  <span class="grade-badge" style="background-color: ${getGradeColor(quizResults.overallGrade)};">
                    Overall Identity Health Grade: ${quizResults.overallGrade}
                  </span>
                  <p style="margin: 15px 0; font-size: 18px;"><strong>Identity Health Score:</strong> ${Math.round(quizResults.overallScore)}/4</p>
                </div>
              ` : ''}
              
              ${calculatorResults ? `
                <div class="alert success">
                  <p style="font-size: 18px;"><strong>💰 Revenue Opportunity Identified:</strong> ${userCompany} has the potential to generate an additional 
                  <strong style="font-size: 24px; color: #059669;">$${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}/month</strong> 
                  in advertising revenue through identity optimization.</p>
                  <p><strong>Annual Revenue Opportunity:</strong> $${calculatorResults.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</p>
                  <p><strong>Revenue Improvement:</strong> +${calculatorResults.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}% increase</p>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">💰 Complete Revenue Impact Overview</h2>
              <div class="metrics-grid">
                <div class="metric-card" style="border-left: 4px solid #ef4444;">
                  <div class="metric-value" style="color: #ef4444;">$${calculatorResults?.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly Revenue Loss</div>
                  <p style="font-size: 12px; margin-top: 5px;">${calculatorResults?.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}% unaddressable inventory</p>
                </div>
                <div class="metric-card" style="border-left: 4px solid #0891b2;">
                  <div class="metric-value" style="color: #0891b2;">$${calculatorResults?.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly Uplift Potential</div>
                  <p style="font-size: 12px; margin-top: 5px;">+${calculatorResults?.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}% revenue increase</p>
                </div>
                <div class="metric-card" style="border-left: 4px solid #7c3aed;">
                  <div class="metric-value" style="color: #7c3aed;">$${calculatorResults?.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Annual Opportunity</div>
                  <p style="font-size: 12px; margin-top: 5px;">12-month projection</p>
                </div>
                <div class="metric-card" style="border-left: 4px solid #8b5cf6;">
                  <div class="metric-value" style="color: #8b5cf6;">+${calculatorResults?.breakdown?.addressabilityImprovement?.toFixed(1) || 'N/A'}%</div>
                  <div class="metric-label">Addressability Improvement</div>
                  <p style="font-size: 12px; margin-top: 5px;">From ${calculatorResults?.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}% to 100%</p>
                </div>
                <div class="metric-card" style="border-left: 4px solid #059669;">
                  <div class="metric-value" style="color: #059669;">$${calculatorResults?.idBloatReduction?.monthlyCdpSavings?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly CDP Savings</div>
                  <p style="font-size: 12px; margin-top: 5px;">${calculatorResults?.idBloatReduction?.reductionPercentage?.toFixed(1) || 'N/A'}% ID bloat reduction</p>
                </div>
              </div>
            </div>

            ${quizResults ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🏥 Complete Identity Health Scorecard</h2>
              <div style="text-align: center; margin: 30px 0;">
                <span class="grade-badge" style="background-color: ${getGradeColor(quizResults.overallGrade)}; font-size: 24px; padding: 15px 25px;">
                  Overall Grade: ${quizResults.overallGrade}
                </span>
                <p style="margin: 15px 0; font-size: 18px;"><strong>Overall Score:</strong> ${Math.round(quizResults.overallScore)}/4</p>
              </div>
              
              <h3 style="color: #0891b2;">Detailed Category Breakdown:</h3>
              ${Object.entries(quizResults.scores || {})
                .filter(([category]) => category !== 'sales-mix')
                .map(([category, data]: [string, any]) => {
                  const categoryNames = {
                    'durability': 'Identity Durability',
                    'cross-domain': 'Cross-Domain Visibility', 
                    'privacy': 'Privacy & Compliance',
                    'browser': 'Browser Resilience'
                  };
                  return `
                    <div style="margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border-left: 6px solid ${getGradeColor(data.grade)};">
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span class="grade-badge" style="background-color: ${getGradeColor(data.grade)}; font-size: 16px; padding: 8px 16px; margin-right: 15px;">
                          ${data.grade}
                        </span>
                        <h4 style="margin: 0; font-size: 18px;">${categoryNames[category] || category}</h4>
                      </div>
                      <p style="margin: 5px 0; color: #64748b;"><strong>Score:</strong> ${Math.round(data.score)}/4</p>
                      <p style="margin: 5px 0; font-size: 14px; line-height: 1.5;">Category performance indicates ${data.grade === 'A+' || data.grade === 'A' ? 'excellent' : data.grade === 'B' ? 'good' : data.grade === 'C' ? 'moderate' : 'significant improvement needed'} ${categoryNames[category]?.toLowerCase()} capabilities.</p>
                    </div>
                  `;
                }).join('')}

              ${calculatorResults?.breakdown?.salesMix ? `
              <div style="margin-top: 30px; padding: 25px; background: #dbeafe; border-radius: 8px;">
                <h4 style="color: #1e40af; margin-top: 0;">💼 Sales Mix Analysis</h4>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value" style="color: #0891b2;">${calculatorResults.breakdown.salesMix.direct}%</div>
                    <div class="metric-label">Direct Sales</div>
                    <p style="font-size: 12px; margin-top: 5px;">Premium inventory with highest CPMs</p>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value" style="color: #059669;">${calculatorResults.breakdown.salesMix.dealIds}%</div>
                    <div class="metric-label">Deal IDs</div>
                    <p style="font-size: 12px; margin-top: 5px;">Programmatic guaranteed inventory</p>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value" style="color: #dc2626;">${calculatorResults.breakdown.salesMix.openExchange}%</div>
                    <div class="metric-label">Open Exchange</div>
                    <p style="font-size: 12px; margin-top: 5px;">Lower CPM open market inventory</p>
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${calculatorResults?.idBloatReduction ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🔧 Complete ID Bloat Reduction & CDP Cost Analysis</h2>
              <div class="alert">
                <p><strong>Current Challenge:</strong> Cross-browser fragmentation and poor identity resolution creates duplicate IDs that must be manually stitched together, inflating CDP costs.</p>
              </div>
              
              <div class="inventory-breakdown">
                <div class="inventory-card">
                  <h4 style="color: #dc2626; margin-top: 0;">Current State: Identity Fragmentation</h4>
                  <table class="data-table">
                    <tr><td><strong>Estimated Monthly Unique Users:</strong></td><td>${calculatorResults.inputs?.monthlyPageviews ? Math.round(calculatorResults.inputs.monthlyPageviews / 2.5).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td><strong>Current Monthly ID Count:</strong></td><td style="color: #dc2626; font-weight: bold;">${calculatorResults.idBloatReduction.currentMonthlyIds?.toLocaleString() || 'N/A'}</td></tr>
                    <tr><td><strong>ID Multiplication Factor:</strong></td><td style="color: #ea580c; font-weight: bold;">${calculatorResults.inputs?.monthlyPageviews ? (calculatorResults.idBloatReduction.currentMonthlyIds / (calculatorResults.inputs.monthlyPageviews / 2.5)).toFixed(2) : 'N/A'}x</td></tr>
                  </table>
                  <div style="margin-top: 15px; padding: 15px; background: #fef2f2; border-radius: 6px; border-left: 4px solid #dc2626;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;"><strong>Problem:</strong> Cross-browser fragmentation creates duplicate IDs that inflate CDP costs.</p>
                  </div>
                </div>

                <div class="inventory-card">
                  <h4 style="color: #059669; margin-top: 0;">With AdFixus: Unified Identity</h4>
                  <table class="data-table">
                    <tr><td><strong>Optimized Monthly ID Count:</strong></td><td style="color: #059669; font-weight: bold;">${calculatorResults.idBloatReduction.optimizedMonthlyIds?.toLocaleString() || 'N/A'}</td></tr>
                    <tr><td><strong>IDs Eliminated:</strong></td><td style="color: #10b981; font-weight: bold;">${calculatorResults.idBloatReduction.currentMonthlyIds && calculatorResults.idBloatReduction.optimizedMonthlyIds ? (calculatorResults.idBloatReduction.currentMonthlyIds - calculatorResults.idBloatReduction.optimizedMonthlyIds).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td><strong>Reduction Percentage:</strong></td><td style="color: #059669; font-weight: bold;">${calculatorResults.idBloatReduction.reductionPercentage?.toFixed(1) || 'N/A'}%</td></tr>
                  </table>
                  <div style="margin-top: 15px; padding: 15px; background: #f0fdf4; border-radius: 6px; border-left: 4px solid #059669;">
                    <p style="margin: 0; color: #14532d; font-size: 14px;"><strong>Solution:</strong> Unified identity reduces duplicate IDs and CDP costs.</p>
                  </div>
                </div>
              </div>

              <div style="margin-top: 25px;">
                <h4 style="color: #0891b2;">💰 Total ROI Calculation:</h4>
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value" style="color: #059669;">$${calculatorResults.idBloatReduction.monthlyCdpSavings?.toLocaleString() || 'N/A'}</div>
                    <div class="metric-label">Monthly CDP Savings</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value" style="color: #0891b2;">$${calculatorResults.idBloatReduction.monthlyCdpSavings ? (calculatorResults.idBloatReduction.monthlyCdpSavings * 12).toLocaleString() : 'N/A'}</div>
                    <div class="metric-label">Annual CDP Savings</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value" style="color: #7c3aed;">$${calculatorResults.uplift?.totalMonthlyUplift && calculatorResults.idBloatReduction.monthlyCdpSavings ? (calculatorResults.uplift.totalMonthlyUplift + calculatorResults.idBloatReduction.monthlyCdpSavings).toLocaleString() : 'N/A'}</div>
                    <div class="metric-label">Total Monthly Value</div>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📊 Inventory Addressability Analysis</h2>
              <div class="inventory-breakdown">
                <div class="inventory-card" style="border-left: 4px solid #22c55e;">
                  <h4 style="color: #22c55e; margin-top: 0;">✅ Addressable Inventory</h4>
                  <div class="metric-value" style="color: #22c55e;">${calculatorResults?.breakdown?.totalAdImpressions && calculatorResults?.unaddressableInventory?.impressions ? (calculatorResults.breakdown.totalAdImpressions - calculatorResults.unaddressableInventory.impressions).toLocaleString() : 'N/A'}</div>
                  <p>Monthly impressions with proper user identification</p>
                  <p><strong>Percentage:</strong> ${calculatorResults?.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}%</p>
                </div>
                <div class="inventory-card" style="border-left: 4px solid #ef4444;">
                  <h4 style="color: #ef4444; margin-top: 0;">❌ Unaddressable Inventory</h4>
                  <div class="metric-value" style="color: #ef4444;">${calculatorResults?.unaddressableInventory?.impressions?.toLocaleString() || 'N/A'}</div>
                  <p>Monthly impressions without user identification</p>
                  <p><strong>Percentage:</strong> ${calculatorResults?.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}%</p>
                  <p><strong>Revenue Impact:</strong> -$${calculatorResults?.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}/month</p>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📈 12-Month Revenue Projection</h2>
              <p>Complete month-by-month revenue projection showing ramp-up timeline and seasonal variations:</p>
              <table class="projection-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Current Revenue</th>
                    <th>With AdFixus</th>
                    <th>Monthly Uplift</th>
                    <th>Cumulative Uplift</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyProjectionData.map((month, index) => {
                    const cumulativeUplift = monthlyProjectionData.slice(0, index + 1).reduce((sum, m) => sum + m.uplift, 0);
                    return `
                      <tr>
                        <td><strong>${month.month}</strong></td>
                        <td>$${month.current.toLocaleString()}</td>
                        <td style="color: #059669; font-weight: bold;">$${month.withAdFixus.toLocaleString()}</td>
                        <td style="color: #0891b2; font-weight: bold;">$${month.uplift.toLocaleString()}</td>
                        <td style="color: #7c3aed; font-weight: bold;">$${cumulativeUplift.toLocaleString()}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div class="alert info">
                <p><strong>Projection Notes:</strong></p>
                <ul>
                  <li>Month 1: 15% ramp-up as implementation begins</li>
                  <li>Month 2: 35% ramp-up as optimization continues</li>
                  <li>Month 3+: Full optimization achieved</li>
                  <li>Seasonal fluctuations included in projections</li>
                </ul>
              </div>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🎯 Complete Strategic Recommendations</h2>
              <p style="font-size: 16px;"><strong>Priority Actions for ${userCompany}:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${generateDetailedRecommendations().map((rec, index) => `
                  <li style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #0891b2; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <strong style="color: #0891b2;">Priority ${index + 1}:</strong> ${rec}
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📈 Implementation Impact & ROI Analysis</h2>
              ${calculatorResults ? `
                <div class="alert success">
                  <h4 style="margin-top: 0; color: #065f46;">Projected Results with AdFixus Implementation:</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div>
                      <h5 style="color: #065f46; margin-bottom: 10px;">Revenue Improvements:</h5>
                      <ul>
                        <li><strong>Monthly Revenue Increase:</strong> +${calculatorResults.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}%</li>
                        <li><strong>Additional Monthly Revenue:</strong> $${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</li>
                        <li><strong>Annual Revenue Uplift:</strong> $${calculatorResults.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</li>
                        <li><strong>Addressability Improvement:</strong> From ${calculatorResults.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}% to 100%</li>
                      </ul>
                    </div>
                    <div>
                      <h5 style="color: #065f46; margin-bottom: 10px;">Cost Optimizations:</h5>
                      <ul>
                        <li><strong>ID Bloat Reduction:</strong> ${calculatorResults.idBloatReduction?.reductionPercentage?.toFixed(1) || 'N/A'}%</li>
                        <li><strong>Monthly CDP Savings:</strong> $${calculatorResults.idBloatReduction?.monthlyCdpSavings?.toLocaleString() || 'N/A'}</li>
                        <li><strong>Annual CDP Savings:</strong> $${calculatorResults.idBloatReduction?.monthlyCdpSavings ? (calculatorResults.idBloatReduction.monthlyCdpSavings * 12).toLocaleString() : 'N/A'}</li>
                        <li><strong>ROI Timeline:</strong> Results within 30 days, full optimization by month 3</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📋 Detailed Next Steps & Implementation Plan</h2>
              <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <div>
                  <h4 style="color: #374151;">Phase 1: Assessment & Planning (Week 1-2)</h4>
                  <ol>
                    <li><strong>Technical Infrastructure Review:</strong> Deep-dive analysis of current identity management setup</li>
                    <li><strong>Data Flow Mapping:</strong> Document current user identification processes across all domains</li>
                    <li><strong>Integration Planning:</strong> Develop detailed implementation roadmap and timeline</li>
                    <li><strong>Stakeholder Alignment:</strong> Ensure all teams understand the implementation plan</li>
                  </ol>
                </div>
                
                <div>
                  <h4 style="color: #374151;">Phase 2: Implementation (Week 3-6)</h4>
                  <ol>
                    <li><strong>AdFixus Integration Setup:</strong> Configure identity resolution platform</li>
                    <li><strong>Cross-Domain Configuration:</strong> Implement unified tracking across all properties</li>
                    <li><strong>Testing & Validation:</strong> Comprehensive testing of identity resolution accuracy</li>
                    <li><strong>Gradual Rollout:</strong> Phased deployment to minimize risk</li>
                  </ol>
                </div>

                <div>
                  <h4 style="color: #374151;">Phase 3: Optimization (Week 7-12)</h4>
                  <ol>
                    <li><strong>Performance Monitoring:</strong> Track KPIs and optimization progress</li>
                    <li><strong>Revenue Optimization:</strong> Fine-tune targeting and inventory utilization</li>
                    <li><strong>CDP Integration:</strong> Optimize customer data platform efficiency</li>
                    <li><strong>Quarterly Business Review:</strong> Assess results and plan expansion opportunities</li>
                  </ol>
                </div>
              </div>
            </div>

            <div class="footer">
              <h3 style="color: #0891b2; margin-top: 0;">📎 Complete Analysis Package</h3>
              <p><strong>This email contains the complete analysis that matches your downloaded PDF report.</strong></p>
              <div style="margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
                <p><strong>What's Included:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                  <li>All user input parameters and calculations</li>
                  <li>Complete identity health assessment</li>
                  <li>Detailed revenue impact analysis</li>
                  <li>12-month financial projections</li>
                  <li>ID bloat reduction and CDP cost savings</li>
                  <li>Strategic recommendations and implementation roadmap</li>
                </ul>
              </div>
              <p>This comprehensive analysis was generated using the AdFixus Identity ROI Calculator.</p>
              <p><em>Generated on ${new Date().toLocaleString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                hour: 'numeric', minute: 'numeric', timeZoneName: 'short' 
              })}</em></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert base64 to buffer for attachment
    let pdfBuffer;
    try {
      pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));
      console.log("PDF buffer created successfully, size:", pdfBuffer.length);
    } catch (error) {
      console.error("Error converting base64 to buffer:", error);
      return new Response(
        JSON.stringify({ error: "Invalid PDF data format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Attempting to send email with Resend...");
    const emailResponse = await resend.emails.send({
      from: "AdFixus ROI Calculator <noreply@adfixus.com>",
      to: ["krish.raja@adfixus.com", "roland.irwin@adfixus.com"],
      subject: `New AdFixus Analysis: ${userName} from ${userCompany}`,
      html: emailBody,
      attachments: [
        {
          filename: `AdFixus_Analysis_${userName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-pdf-email function:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return more specific error information
    const errorMessage = error.message || "Unknown error occurred";
    const statusCode = error.name === "ResendError" ? 400 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.name || "UnknownError"
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
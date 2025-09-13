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
      }

      const safariFirefoxShare = 100 - (calculatorResults?.inputs?.chromeShare || 70);
      if (safariFirefoxShare > 25) {
        recommendations.push('Implement Safari/Firefox-specific optimization strategies for privacy compliance');
      }
      
      if ((calculatorResults?.breakdown?.currentAddressability || 0) < 70) {
        recommendations.push('Priority focus on improving overall addressability rates across all inventory');
      }
      
      const salesMix = calculatorResults?.breakdown?.salesMix;
      if (salesMix) {
        if (salesMix.openExchange > 50) {
          recommendations.push('Consider increasing direct sales and deal ID usage to improve profit margins');
        }
        if (salesMix.direct < 30) {
          recommendations.push('Explore opportunities to grow direct sales relationships and premium inventory');
        }
      }
      
      if ((calculatorResults?.inputs?.displayVideoSplit || 0) < 20) {
        recommendations.push('Optimize video inventory monetization strategies for higher CPMs');
      }
      
      if ((calculatorResults?.inputs?.numDomains || 1) > 3) {
        recommendations.push('Implement cross-domain identity resolution for unified user tracking');
      }
      
      recommendations.push('Leverage privacy-compliant targeting to maximize CPMs and user engagement');
      recommendations.push('Implement real-time optimization for dynamic inventory management');
      
      return recommendations.slice(0, 8);
    };

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AdFixus Identity ROI Analysis Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; background: #fff; }
          .header { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; }
          .section { margin-bottom: 30px; padding: 20px; border-left: 4px solid #0891b2; background: #f8fafc; border-radius: 0 8px 8px 0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
          .metric-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .metric-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .grade-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; font-size: 18px; }
          .recommendations li { margin-bottom: 8px; padding: 5px 0; }
          .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .success { background: #d1fae5; border: 1px solid #10b981; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">AdFixus Identity ROI Analysis</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Comprehensive Identity Health & Revenue Optimization Report</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📋 Client Information</h2>
              <p><strong>Contact:</strong> ${userName}</p>
              <p><strong>Company:</strong> ${userCompany}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}</p>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🎯 Executive Summary</h2>
              ${quizResults ? `
                <div style="text-align: center; margin: 20px 0;">
                  <span class="grade-badge" style="background-color: ${getGradeColor(quizResults.overallGrade)};">
                    Overall Identity Health: ${quizResults.overallGrade}
                  </span>
                  <p style="margin: 10px 0;"><strong>Identity Health Score:</strong> ${Math.round(quizResults.overallScore)}/4</p>
                </div>
              ` : ''}
              
              ${calculatorResults ? `
                <div class="alert success">
                  <p><strong>💰 Revenue Opportunity Identified:</strong> ${userCompany} has the potential to generate an additional 
                  <strong>$${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}/month</strong> 
                  in advertising revenue through identity optimization.</p>
                </div>
              ` : ''}
            </div>

            ${calculatorResults ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📊 Key Revenue Metrics</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value" style="color: #059669;">$${calculatorResults.currentRevenue?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Current Monthly Revenue</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #0891b2;">$${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly Uplift Potential</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #7c3aed;">$${calculatorResults.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Annual Revenue Opportunity</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #dc2626;">${calculatorResults.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}%</div>
                  <div class="metric-label">Unaddressable Inventory</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #ea580c;">$${calculatorResults.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly Revenue Loss</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #059669;">$${calculatorResults.idBloatReduction?.monthlyCdpSavings?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Monthly CDP Savings</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${quizResults ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🏥 Identity Health Breakdown</h2>
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
                    <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid ${getGradeColor(data.grade)};">
                      <strong>${categoryNames[category] || category}:</strong> 
                      <span class="grade-badge" style="background-color: ${getGradeColor(data.grade)}; font-size: 14px; padding: 4px 12px;">
                        ${data.grade}
                      </span>
                      <span style="margin-left: 10px; color: #64748b;">Score: ${Math.round(data.score)}/4</span>
                    </div>
                  `;
                }).join('')}
            </div>
            ` : ''}

            ${calculatorResults?.breakdown?.salesMix ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">💼 Sales Mix Analysis</h2>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value" style="color: #0891b2;">${calculatorResults.breakdown.salesMix.direct}%</div>
                  <div class="metric-label">Direct Sales</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #059669;">${calculatorResults.breakdown.salesMix.dealIds}%</div>
                  <div class="metric-label">Deal IDs</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #0891b2;">${calculatorResults.breakdown.salesMix.openExchange}%</div>
                  <div class="metric-label">Open Exchange</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${calculatorResults?.idBloatReduction ? `
            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🔧 ID Bloat Reduction Analysis</h2>
              <div class="alert">
                <p><strong>Current Challenge:</strong> Identity fragmentation across browsers creates duplicate IDs, inflating CDP costs.</p>
              </div>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value" style="color: #dc2626;">${calculatorResults.idBloatReduction.currentMonthlyIds?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Current Monthly IDs</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #059669;">${calculatorResults.idBloatReduction.optimizedMonthlyIds?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label">Optimized Monthly IDs</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value" style="color: #7c3aed;">${calculatorResults.idBloatReduction.reductionPercentage?.toFixed(1) || 'N/A'}%</div>
                  <div class="metric-label">ID Reduction</div>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">🎯 Strategic Recommendations</h2>
              <p><strong>Priority Actions for ${userCompany}:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${generateDetailedRecommendations().map(rec => `<li style="margin: 10px 0; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #0891b2;">• ${rec}</li>`).join('')}
              </ul>
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📈 Implementation Impact</h2>
              ${calculatorResults ? `
                <div class="alert success">
                  <p><strong>Projected Results with AdFixus Implementation:</strong></p>
                  <ul>
                    <li><strong>Revenue Increase:</strong> +${calculatorResults.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}% monthly growth</li>
                    <li><strong>Addressability:</strong> From ${calculatorResults.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}% to 100%</li>
                    <li><strong>Cost Optimization:</strong> ${calculatorResults.idBloatReduction?.reductionPercentage?.toFixed(1) || 'N/A'}% reduction in CDP costs</li>
                    <li><strong>ROI Timeline:</strong> Initial results within 30 days, full optimization by month 3</li>
                  </ul>
                </div>
              ` : ''}
            </div>

            <div class="section">
              <h2 style="color: #0891b2; margin-top: 0;">📋 Next Steps</h2>
              <ol>
                <li><strong>Technical Review:</strong> Deep-dive into current identity infrastructure</li>
                <li><strong>Implementation Planning:</strong> Develop phased rollout strategy</li>
                <li><strong>Integration Setup:</strong> Configure AdFixus identity resolution</li>
                <li><strong>Performance Monitoring:</strong> Track KPIs and optimization progress</li>
                <li><strong>Quarterly Business Review:</strong> Assess results and expansion opportunities</li>
              </ol>
            </div>

            <div class="footer">
              <p><strong>📎 Comprehensive PDF Report Attached</strong></p>
              <p>This analysis was generated using the AdFixus Identity ROI Calculator. The attached PDF contains detailed technical specifications, implementation timelines, and competitive analysis.</p>
              <p><em>Generated on ${new Date().toLocaleString()}</em></p>
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
      from: "AdFixus ROI Calculator <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
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
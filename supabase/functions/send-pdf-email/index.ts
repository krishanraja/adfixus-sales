import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Resend API wrapper
async function sendEmail(apiKey: string, options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string | Uint8Array }>;
}) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
  
  return response.json();
}

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
      const colors: Record<string, string> = {
        'A+': '#059669', 'A': '#10b981', 'B': '#3b82f6', 
        'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444'
      };
      return colors[grade] || '#ef4444';
    };
    
    const categoryNames: Record<string, string> = {
      durability: 'ID Durability',
      'cross-domain': 'Cross-Domain',
      privacy: 'Privacy',
      browser: 'Browser Support'
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
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #ffffff; margin: 0; padding: 20px; background: #000000; }
          .container { max-width: 900px; margin: 0 auto; background: #000000; }
          .header { background-color: #000000; color: #ffffff; padding: 40px; text-align: center; border-bottom: 3px solid #07C0F8; }
          .content { padding: 40px; background: #000000; }
          .section { margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background: #0a2630; border-radius: 0 8px 8px 0; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0; }
          .metric-card { background: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center; }
          .metric-value { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
          .metric-label { font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px; }
          .grade-badge { display: inline-block; padding: 12px 20px; border-radius: 25px; color: #ffffff; font-weight: bold; font-size: 20px; margin: 10px; }
          .recommendations li { margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid #333333; color: #ffffff; }
          .alert { background: #1a2a1a; border: 1px solid #2d5a2d; padding: 20px; border-radius: 8px; margin: 20px 0; color: #ffffff; }
          .success { background: #0a2610; border: 1px solid #166534; }
          .info { background: #0a2630; border: 1px solid #07C0F8; }
          .footer { text-align: center; padding: 30px; color: #a0a0a0; font-size: 14px; border-top: 2px solid #07C0F8; margin-top: 40px; background: #0a2630; }
          .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #333333; color: #ffffff; }
          .data-table th { background: #1a1a1a; font-weight: 600; color: #07C0F8; }
          .projection-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .projection-table th { background: #07C0F8; color: #000000; padding: 10px; font-weight: 600; }
          .projection-table td { padding: 8px; border: 1px solid #333333; text-align: center; background: #1a1a1a; color: #ffffff; }
          .inventory-breakdown { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .inventory-card { background: #1a1a1a; padding: 20px; border-radius: 8px; border: 2px solid #333333; color: #ffffff; }
          h1, h2, h3, h4, h5, p, li, td, th { color: #ffffff; }
          a { color: #07C0F8; }
        </style>
      </head>
      <body style="font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 20px;">
        <div class="container" style="max-width: 900px; margin: 0 auto; background-color: #000000;">
          <div class="header" style="background-color: #000000; color: #ffffff; padding: 40px; text-align: center; border-bottom: 3px solid #07C0F8;">
            <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-family: 'Montserrat', sans-serif; font-weight: 700;">Complete Identity ROI Analysis Results</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; color: #a0a0a0; font-family: 'Montserrat', sans-serif;">Comprehensive analysis with all user inputs, identity health assessment, and revenue optimization opportunities</p>
          </div>
          
          <div class="content" style="padding: 40px; background-color: #000000;">
            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📋 Client Information & Contact Details</h2>
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Contact Name:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${userName}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Company:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${userCompany}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Email:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${userEmail}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Analysis Date:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                })}</td></tr>
                <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Analysis Time:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${new Date().toLocaleTimeString('en-US')}</td></tr>
              </table>
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📊 Complete User Input Parameters</h2>
              <div class="alert info" style="background-color: #0a2630; border: 1px solid #07C0F8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #ffffff; margin: 0;"><strong style="color: #ffffff;">All calculator inputs provided by ${userCompany}:</strong></p>
              </div>
              <table class="data-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="padding: 12px; text-align: left; background-color: #1a1a1a; color: #07C0F8; font-weight: 600; border-bottom: 1px solid #333333;">Parameter</th>
                    <th style="padding: 12px; text-align: left; background-color: #1a1a1a; color: #07C0F8; font-weight: 600; border-bottom: 1px solid #333333;">Value</th>
                    <th style="padding: 12px; text-align: left; background-color: #1a1a1a; color: #07C0F8; font-weight: 600; border-bottom: 1px solid #333333;">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Monthly Pageviews</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.inputs?.monthlyPageviews?.toLocaleString() || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Base inventory volume for revenue calculations</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Average CPM</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">$${calculatorResults?.inputs?.avgCpm || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Revenue per 1,000 ad impressions</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Chrome Browser Share</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.inputs?.chromeShare || 'N/A'}%</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Affects current addressability rates</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Safari/Firefox Share</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${100 - (calculatorResults?.inputs?.chromeShare || 70)}%</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Privacy-focused browsers with limited tracking</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Number of Domains</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.inputs?.numDomains || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Cross-domain identity complexity</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Display/Video Split</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.inputs?.displayVideoSplit || 'N/A'}% Display / ${100 - (calculatorResults?.inputs?.displayVideoSplit || 50)}% Video</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Inventory composition affects CPM rates</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Estimated Ad Impressions</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.breakdown?.totalAdImpressions?.toLocaleString() || 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Total monthly monetizable inventory</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Estimated Monthly Users</strong></td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults?.inputs?.monthlyPageviews ? Math.round(calculatorResults.inputs.monthlyPageviews / 2.5).toLocaleString() : 'N/A'}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #333333; color: #a0a0a0;">Unique user base for identity analysis</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">🎯 Executive Summary</h2>
              ${quizResults ? `
                <div style="text-align: center; margin: 30px 0;">
                  <span class="grade-badge" style="background-color: ${getGradeColor(quizResults.overallGrade)}; display: inline-block; padding: 12px 20px; border-radius: 25px; color: #ffffff; font-weight: bold; font-size: 20px;">
                    Overall Identity Health Grade: ${quizResults.overallGrade}
                  </span>
                  <p style="margin: 15px 0; font-size: 18px; color: #ffffff;"><strong style="color: #ffffff;">Identity Health Score:</strong> ${Math.round(quizResults.overallScore)}/4</p>
                </div>
              ` : ''}
              
              ${calculatorResults ? `
                <div class="alert success" style="background-color: #0a2610; border: 1px solid #166534; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 18px; color: #ffffff;"><strong style="color: #ffffff;">💰 Revenue Opportunity Identified:</strong> ${userCompany} has the potential to generate an additional 
                  <strong style="font-size: 24px; color: #07C0F8;">$${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}/month</strong> 
                  in advertising revenue through identity optimization.</p>
                  <p style="color: #ffffff;"><strong style="color: #ffffff;">Annual Revenue Opportunity:</strong> $${calculatorResults.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</p>
                  <p style="color: #ffffff;"><strong style="color: #ffffff;">Revenue Improvement:</strong> +${calculatorResults.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}% increase</p>
                </div>
              ` : ''}
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">💰 Complete Revenue Impact Overview</h2>
              <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 25px 0;">
                <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; border-left: 4px solid #ef4444; text-align: center;">
                  <div class="metric-value" style="color: #ef4444; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults?.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Monthly Revenue Loss</div>
                  <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">${calculatorResults?.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}% unaddressable inventory</p>
                </div>
                <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; border-left: 4px solid #07C0F8; text-align: center;">
                  <div class="metric-value" style="color: #07C0F8; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults?.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Monthly Uplift Potential</div>
                  <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">+${calculatorResults?.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}% revenue increase</p>
                </div>
                <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; border-left: 4px solid #7c3aed; text-align: center;">
                  <div class="metric-value" style="color: #7c3aed; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults?.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Annual Opportunity</div>
                  <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">12-month projection</p>
                </div>
                <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; border-left: 4px solid #8b5cf6; text-align: center;">
                  <div class="metric-value" style="color: #8b5cf6; font-size: 28px; font-weight: bold; margin-bottom: 8px;">+${calculatorResults?.breakdown?.addressabilityImprovement?.toFixed(1) || 'N/A'}%</div>
                  <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Addressability Improvement</div>
                  <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">From ${calculatorResults?.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}% to 100%</p>
                </div>
                <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; border-left: 4px solid #059669; text-align: center;">
                  <div class="metric-value" style="color: #059669; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults?.idBloatReduction?.monthlyCdpSavings?.toLocaleString() || 'N/A'}</div>
                  <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Monthly CDP Savings</div>
                  <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">${calculatorResults?.idBloatReduction?.reductionPercentage?.toFixed(1) || 'N/A'}% ID bloat reduction</p>
                </div>
              </div>
            </div>

            ${quizResults ? `
            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">🏥 Complete Identity Health Scorecard</h2>
              <div style="text-align: center; margin: 30px 0;">
                <span class="grade-badge" style="background-color: ${getGradeColor(quizResults.overallGrade)}; display: inline-block; padding: 15px 25px; border-radius: 25px; color: #ffffff; font-weight: bold; font-size: 24px;">
                  Overall Grade: ${quizResults.overallGrade}
                </span>
                <p style="margin: 15px 0; font-size: 18px; color: #ffffff;"><strong style="color: #ffffff;">Overall Score:</strong> ${Math.round(quizResults.overallScore)}/4</p>
              </div>
              
              <h3 style="color: #07C0F8; font-family: 'Montserrat', sans-serif; font-weight: 600;">Detailed Category Breakdown:</h3>
              ${Object.entries(quizResults.scores || {})
                .filter(([category]) => category !== 'sales-mix')
                .map(([category, data]: [string, any]) => {
                  const catNames: Record<string, string> = {
                    'durability': 'Identity Durability',
                    'cross-domain': 'Cross-Domain Visibility', 
                    'privacy': 'Privacy & Compliance',
                    'browser': 'Browser Resilience'
                  };
                  const catName = catNames[category] || category;
                  return `
                    <div style="margin: 20px 0; padding: 20px; background-color: #1a1a1a; border-radius: 8px; border-left: 6px solid ${getGradeColor(data.grade)};">
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span class="grade-badge" style="background-color: ${getGradeColor(data.grade)}; display: inline-block; padding: 8px 16px; border-radius: 25px; color: #ffffff; font-weight: bold; font-size: 16px; margin-right: 15px;">
                          ${data.grade}
                        </span>
                        <h4 style="margin: 0; font-size: 18px; color: #ffffff; font-family: 'Montserrat', sans-serif;">${catName}</h4>
                      </div>
                      <p style="margin: 5px 0; color: #a0a0a0;"><strong style="color: #ffffff;">Score:</strong> ${Math.round(data.score)}/4</p>
                      <p style="margin: 5px 0; font-size: 14px; line-height: 1.5; color: #a0a0a0;">Category performance indicates ${data.grade === 'A+' || data.grade === 'A' ? 'excellent' : data.grade === 'B' ? 'good' : data.grade === 'C' ? 'moderate' : 'significant improvement needed'} ${catName.toLowerCase()} capabilities.</p>
                    </div>
                  `;
                }).join('')}

              ${calculatorResults?.breakdown?.salesMix ? `
              <div style="margin-top: 30px; padding: 25px; background-color: #0a2630; border-radius: 8px; border: 1px solid #07C0F8;">
                <h4 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">💼 Sales Mix Analysis</h4>
                <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin: 25px 0;">
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #07C0F8; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${calculatorResults.breakdown.salesMix.direct}%</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Direct Sales</div>
                    <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">Premium inventory with highest CPMs</p>
                  </div>
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #059669; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${calculatorResults.breakdown.salesMix.dealIds}%</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Deal IDs</div>
                    <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">Programmatic guaranteed inventory</p>
                  </div>
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #dc2626; font-size: 28px; font-weight: bold; margin-bottom: 8px;">${calculatorResults.breakdown.salesMix.openExchange}%</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Open Exchange</div>
                    <p style="font-size: 12px; margin-top: 5px; color: #a0a0a0;">Lower CPM open market inventory</p>
                  </div>
                </div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            ${calculatorResults?.idBloatReduction ? `
            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">🔧 Complete ID Bloat Reduction & CDP Cost Analysis</h2>
              <div class="alert" style="background-color: #261a0a; border: 1px solid #d97706; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #ffffff; margin: 0;"><strong style="color: #ffffff;">Current Challenge:</strong> Cross-browser fragmentation and poor identity resolution creates duplicate IDs that must be manually stitched together, inflating CDP costs.</p>
              </div>
              
              <div class="inventory-breakdown" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div class="inventory-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 2px solid #333333;">
                  <h4 style="color: #ef4444; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">Current State: Identity Fragmentation</h4>
                  <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Estimated Monthly Unique Users:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;">${calculatorResults.inputs?.monthlyPageviews ? Math.round(calculatorResults.inputs.monthlyPageviews / 2.5).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Current Monthly ID Count:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ef4444; font-weight: bold;">${calculatorResults.idBloatReduction.currentMonthlyIds?.toLocaleString() || 'N/A'}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">ID Multiplication Factor:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #f97316; font-weight: bold;">${calculatorResults.inputs?.monthlyPageviews ? (calculatorResults.idBloatReduction.currentMonthlyIds / (calculatorResults.inputs.monthlyPageviews / 2.5)).toFixed(2) : 'N/A'}x</td></tr>
                  </table>
                  <div style="margin-top: 15px; padding: 15px; background-color: #2a1515; border-radius: 6px; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; color: #fca5a5; font-size: 14px;"><strong style="color: #ffffff;">Problem:</strong> Cross-browser fragmentation creates duplicate IDs that inflate CDP costs.</p>
                  </div>
                </div>

                <div class="inventory-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 2px solid #333333;">
                  <h4 style="color: #059669; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">With AdFixus: Unified Identity</h4>
                  <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Optimized Monthly ID Count:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #059669; font-weight: bold;">${calculatorResults.idBloatReduction.optimizedMonthlyIds?.toLocaleString() || 'N/A'}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">IDs Eliminated:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #10b981; font-weight: bold;">${calculatorResults.idBloatReduction.currentMonthlyIds && calculatorResults.idBloatReduction.optimizedMonthlyIds ? (calculatorResults.idBloatReduction.currentMonthlyIds - calculatorResults.idBloatReduction.optimizedMonthlyIds).toLocaleString() : 'N/A'}</td></tr>
                    <tr><td style="padding: 12px; border-bottom: 1px solid #333333; color: #ffffff;"><strong style="color: #ffffff;">Reduction Percentage:</strong></td><td style="padding: 12px; border-bottom: 1px solid #333333; color: #059669; font-weight: bold;">${calculatorResults.idBloatReduction.reductionPercentage?.toFixed(1) || 'N/A'}%</td></tr>
                  </table>
                  <div style="margin-top: 15px; padding: 15px; background-color: #0a2610; border-radius: 6px; border-left: 4px solid #059669;">
                    <p style="margin: 0; color: #86efac; font-size: 14px;"><strong style="color: #ffffff;">Solution:</strong> Unified identity reduces duplicate IDs and CDP costs.</p>
                  </div>
                </div>
              </div>

              <div style="margin-top: 25px;">
                <h4 style="color: #07C0F8; font-family: 'Montserrat', sans-serif; font-weight: 600;">💰 Total ROI Calculation:</h4>
                <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0;">
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #059669; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults.idBloatReduction.monthlyCdpSavings?.toLocaleString() || 'N/A'}</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Monthly CDP Savings</div>
                  </div>
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #07C0F8; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults.idBloatReduction.monthlyCdpSavings ? (calculatorResults.idBloatReduction.monthlyCdpSavings * 12).toLocaleString() : 'N/A'}</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Annual CDP Savings</div>
                  </div>
                  <div class="metric-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border: 1px solid #333333; text-align: center;">
                    <div class="metric-value" style="color: #7c3aed; font-size: 28px; font-weight: bold; margin-bottom: 8px;">$${calculatorResults.uplift?.totalMonthlyUplift && calculatorResults.idBloatReduction.monthlyCdpSavings ? (calculatorResults.uplift.totalMonthlyUplift + calculatorResults.idBloatReduction.monthlyCdpSavings).toLocaleString() : 'N/A'}</div>
                    <div class="metric-label" style="font-size: 14px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px;">Total Monthly Value</div>
                  </div>
                </div>
              </div>
            </div>
            ` : ''}

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📊 Inventory Addressability Analysis</h2>
              <div class="inventory-breakdown" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div class="inventory-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; border: 2px solid #333333;">
                  <h4 style="color: #22c55e; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">✅ Addressable Inventory</h4>
                  <div class="metric-value" style="color: #22c55e; font-size: 28px; font-weight: bold;">${calculatorResults?.breakdown?.totalAdImpressions && calculatorResults?.unaddressableInventory?.impressions ? (calculatorResults.breakdown.totalAdImpressions - calculatorResults.unaddressableInventory.impressions).toLocaleString() : 'N/A'}</div>
                  <p style="color: #a0a0a0;">Monthly impressions with proper user identification</p>
                  <p style="color: #ffffff;"><strong style="color: #ffffff;">Percentage:</strong> ${calculatorResults?.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}%</p>
                </div>
                <div class="inventory-card" style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; border: 2px solid #333333;">
                  <h4 style="color: #ef4444; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">❌ Unaddressable Inventory</h4>
                  <div class="metric-value" style="color: #ef4444; font-size: 28px; font-weight: bold;">${calculatorResults?.unaddressableInventory?.impressions?.toLocaleString() || 'N/A'}</div>
                  <p style="color: #a0a0a0;">Monthly impressions without user identification</p>
                  <p style="color: #ffffff;"><strong style="color: #ffffff;">Percentage:</strong> ${calculatorResults?.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}%</p>
                  <p style="color: #ffffff;"><strong style="color: #ffffff;">Revenue Impact:</strong> -$${calculatorResults?.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}/month</p>
                </div>
              </div>
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📈 12-Month Revenue Projection</h2>
              <p style="color: #a0a0a0;">Complete month-by-month revenue projection showing ramp-up timeline and seasonal variations:</p>
              <table class="projection-table" style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                <thead>
                  <tr>
                    <th style="background-color: #07C0F8; color: #000000; padding: 10px; font-weight: 600;">Month</th>
                    <th style="background-color: #07C0F8; color: #000000; padding: 10px; font-weight: 600;">Current Revenue</th>
                    <th style="background-color: #07C0F8; color: #000000; padding: 10px; font-weight: 600;">With AdFixus</th>
                    <th style="background-color: #07C0F8; color: #000000; padding: 10px; font-weight: 600;">Monthly Uplift</th>
                    <th style="background-color: #07C0F8; color: #000000; padding: 10px; font-weight: 600;">Cumulative Uplift</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyProjectionData.map((month, index) => {
                    const cumulativeUplift = monthlyProjectionData.slice(0, index + 1).reduce((sum, m) => sum + m.uplift, 0);
                    return `
                      <tr>
                        <td style="padding: 8px; border: 1px solid #333333; background-color: #1a1a1a; color: #ffffff; text-align: center;"><strong style="color: #ffffff;">${month.month}</strong></td>
                        <td style="padding: 8px; border: 1px solid #333333; background-color: #1a1a1a; color: #ffffff; text-align: center;">$${month.current.toLocaleString()}</td>
                        <td style="padding: 8px; border: 1px solid #333333; background-color: #1a1a1a; color: #059669; font-weight: bold; text-align: center;">$${month.withAdFixus.toLocaleString()}</td>
                        <td style="padding: 8px; border: 1px solid #333333; background-color: #1a1a1a; color: #07C0F8; font-weight: bold; text-align: center;">$${month.uplift.toLocaleString()}</td>
                        <td style="padding: 8px; border: 1px solid #333333; background-color: #1a1a1a; color: #7c3aed; font-weight: bold; text-align: center;">$${cumulativeUplift.toLocaleString()}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div class="alert info" style="background-color: #0a2630; border: 1px solid #07C0F8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #ffffff; margin: 0 0 10px 0;"><strong style="color: #ffffff;">Projection Notes:</strong></p>
                <ul style="color: #a0a0a0; margin: 0; padding-left: 20px;">
                  <li style="color: #a0a0a0;">Month 1: 15% ramp-up as implementation begins</li>
                  <li style="color: #a0a0a0;">Month 2: 35% ramp-up as optimization continues</li>
                  <li style="color: #a0a0a0;">Month 3+: Full optimization achieved</li>
                  <li style="color: #a0a0a0;">Seasonal fluctuations included in projections</li>
                </ul>
              </div>
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">🎯 Complete Strategic Recommendations</h2>
              <p style="font-size: 16px; color: #ffffff;"><strong style="color: #ffffff;">Priority Actions for ${userCompany}:</strong></p>
              <ul style="list-style-type: none; padding-left: 0;">
                ${generateDetailedRecommendations().map((rec, index) => `
                  <li style="margin: 15px 0; padding: 15px; background-color: #1a1a1a; border-radius: 8px; border-left: 4px solid #07C0F8;">
                    <strong style="color: #07C0F8;">Priority ${index + 1}:</strong> <span style="color: #ffffff;">${rec}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📈 Implementation Impact & ROI Analysis</h2>
              ${calculatorResults ? `
                <div class="alert success" style="background-color: #0a2610; border: 1px solid #166534; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="margin-top: 0; color: #22c55e; font-family: 'Montserrat', sans-serif; font-weight: 600;">Projected Results with AdFixus Implementation:</h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                    <div>
                      <h5 style="color: #22c55e; margin-bottom: 10px; font-family: 'Montserrat', sans-serif;">Revenue Improvements:</h5>
                      <ul style="color: #ffffff; padding-left: 20px;">
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Monthly Revenue Increase:</strong> +${calculatorResults.uplift?.percentageImprovement?.toFixed(1) || 'N/A'}%</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Additional Monthly Revenue:</strong> $${calculatorResults.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Annual Revenue Uplift:</strong> $${calculatorResults.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Addressability Improvement:</strong> From ${calculatorResults.breakdown?.currentAddressability?.toFixed(1) || 'N/A'}% to 100%</li>
                      </ul>
                    </div>
                    <div>
                      <h5 style="color: #22c55e; margin-bottom: 10px; font-family: 'Montserrat', sans-serif;">Cost Optimizations:</h5>
                      <ul style="color: #ffffff; padding-left: 20px;">
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">ID Bloat Reduction:</strong> ${calculatorResults.idBloatReduction?.reductionPercentage?.toFixed(1) || 'N/A'}%</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Monthly CDP Savings:</strong> $${calculatorResults.idBloatReduction?.monthlyCdpSavings?.toLocaleString() || 'N/A'}</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">Annual CDP Savings:</strong> $${calculatorResults.idBloatReduction?.monthlyCdpSavings ? (calculatorResults.idBloatReduction.monthlyCdpSavings * 12).toLocaleString() : 'N/A'}</li>
                        <li style="color: #ffffff;"><strong style="color: #ffffff;">ROI Timeline:</strong> Results within 30 days, full optimization by month 3</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>

            <div class="section" style="margin-bottom: 40px; padding: 25px; border-left: 4px solid #07C0F8; background-color: #0a2630; border-radius: 0 8px 8px 0;">
              <h2 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📋 Detailed Next Steps & Implementation Plan</h2>
              <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px;">
                  <h4 style="color: #07C0F8; font-family: 'Montserrat', sans-serif; font-weight: 600;">Phase 1: Assessment & Planning (Week 1-2)</h4>
                  <ol style="color: #ffffff; padding-left: 20px;">
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Technical Infrastructure Review:</strong> <span style="color: #a0a0a0;">Deep-dive analysis of current identity management setup</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Data Flow Mapping:</strong> <span style="color: #a0a0a0;">Document current user identification processes across all domains</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Integration Planning:</strong> <span style="color: #a0a0a0;">Develop detailed implementation roadmap and timeline</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Stakeholder Alignment:</strong> <span style="color: #a0a0a0;">Ensure all teams understand the implementation plan</span></li>
                  </ol>
                </div>
                
                <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px;">
                  <h4 style="color: #07C0F8; font-family: 'Montserrat', sans-serif; font-weight: 600;">Phase 2: Implementation (Week 3-6)</h4>
                  <ol style="color: #ffffff; padding-left: 20px;">
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">AdFixus Integration Setup:</strong> <span style="color: #a0a0a0;">Configure identity resolution platform</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Cross-Domain Configuration:</strong> <span style="color: #a0a0a0;">Implement unified tracking across all properties</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Testing & Validation:</strong> <span style="color: #a0a0a0;">Comprehensive testing of identity resolution accuracy</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Gradual Rollout:</strong> <span style="color: #a0a0a0;">Phased deployment to minimize risk</span></li>
                  </ol>
                </div>

                <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px;">
                  <h4 style="color: #07C0F8; font-family: 'Montserrat', sans-serif; font-weight: 600;">Phase 3: Optimization (Week 7-12)</h4>
                  <ol style="color: #ffffff; padding-left: 20px;">
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Performance Monitoring:</strong> <span style="color: #a0a0a0;">Track KPIs and optimization progress</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Revenue Optimization:</strong> <span style="color: #a0a0a0;">Fine-tune targeting and inventory utilization</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">CDP Integration:</strong> <span style="color: #a0a0a0;">Optimize customer data platform efficiency</span></li>
                    <li style="color: #ffffff; margin-bottom: 8px;"><strong style="color: #ffffff;">Quarterly Business Review:</strong> <span style="color: #a0a0a0;">Assess results and plan expansion opportunities</span></li>
                  </ol>
                </div>
              </div>
            </div>

            <div class="footer" style="text-align: center; padding: 30px; color: #a0a0a0; font-size: 14px; border-top: 2px solid #07C0F8; margin-top: 40px; background-color: #0a2630;">
              <h3 style="color: #07C0F8; margin-top: 0; font-family: 'Montserrat', sans-serif; font-weight: 600;">📎 Complete Analysis Package</h3>
              <p style="color: #ffffff;"><strong style="color: #ffffff;">This email contains the complete analysis that matches your downloaded PDF report.</strong></p>
              <div style="margin: 20px 0; padding: 20px; background-color: #1a1a1a; border-radius: 8px; border: 1px solid #333333;">
                <p style="color: #ffffff;"><strong style="color: #ffffff;">What's Included:</strong></p>
                <ul style="text-align: left; display: inline-block; color: #a0a0a0;">
                  <li style="color: #a0a0a0;">All user input parameters and calculations</li>
                  <li style="color: #a0a0a0;">Complete identity health assessment</li>
                  <li style="color: #a0a0a0;">Detailed revenue impact analysis</li>
                  <li style="color: #a0a0a0;">12-month financial projections</li>
                  <li style="color: #a0a0a0;">ID bloat reduction and CDP cost savings</li>
                  <li style="color: #a0a0a0;">Strategic recommendations and implementation roadmap</li>
                </ul>
              </div>
              <p style="color: #a0a0a0;">This comprehensive analysis was generated using the AdFixus Identity ROI Calculator.</p>
              <p style="color: #a0a0a0;"><em>Generated on ${new Date().toLocaleString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                hour: 'numeric', minute: 'numeric', timeZoneName: 'short' 
              })}</em></p>
              <div style="margin-top: 25px;">
                <a href="https://adfixus.com" style="display: inline-block; padding: 15px 30px; background-color: #07C0F8; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 600; font-family: 'Montserrat', sans-serif;">Schedule a Demo</a>
              </div>
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
    const emailResponse = await sendEmail(resendApiKey, {
      from: "AdFixus ROI Calculator <hello@idfixus.com>",
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResultsEmailRequest {
  quizResults: any;
  calculatorResults: any;
  leadData?: any;
}

const formatCurrency = (amount: number | undefined | null): string => {
  if (!amount || isNaN(Number(amount))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
  if (!value || isNaN(Number(value))) return '0.0';
  return Number(value).toFixed(decimals);
};

const formatNumber = (num: number | undefined | null): string => {
  if (!num || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('en-US').format(Number(num));
};

// Question mapping for quiz answers
const getQuestionText = (questionId: string): string => {
  const questions = {
    'q1': 'How long do your identity solutions typically persist across user sessions?',
    'q2': 'What percentage of your inventory can you effectively target with personalized advertising?',
    'q3': 'How well does your current identity solution work across different domains you operate?',
    'q4': 'How prepared is your identity infrastructure for the deprecation of third-party cookies?',
    'q5': 'What is your current sales mix breakdown?'
  };
  return questions[questionId] || questionId;
};

const getAnswerText = (questionId: string, answerId: string): string => {
  const answers = {
    'q1': {
      'a': 'Less than 24 hours - identities reset frequently',
      'b': '1-7 days - moderate persistence',
      'c': '1-4 weeks - good persistence',
      'd': 'More than 30 days - excellent persistence'
    },
    'q2': {
      'a': 'Less than 50% - significant addressability gaps',
      'b': '50-70% - moderate addressability',
      'c': '70-85% - good addressability',
      'd': 'More than 85% - excellent addressability'
    },
    'q3': {
      'a': 'Poor - each domain operates independently',
      'b': 'Limited - some cross-domain capabilities',
      'c': 'Good - works well across most domains',
      'd': 'Excellent - seamless cross-domain identity resolution'
    },
    'q4': {
      'a': 'Not prepared - heavily dependent on third-party cookies',
      'b': 'Somewhat prepared - have some alternatives',
      'c': 'Well prepared - multiple cookie-less solutions',
      'd': 'Fully prepared - comprehensive cookie-less strategy'
    },
    'q5': {
      'a': 'Primarily direct sales (70%+)',
      'b': 'Balanced mix of direct and programmatic',
      'c': 'Primarily programmatic/open exchange (70%+)',
      'd': 'Heavy focus on private marketplace deals'
    }
  };
  return answers[questionId]?.[answerId] || `${questionId}-${answerId}`;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== EMAIL FUNCTION STARTED ===");
    
    // Validate RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    console.log("Resend API key found:", resendApiKey.substring(0, 10) + "...");

    const resend = new Resend(resendApiKey);

    const { quizResults, calculatorResults, leadData }: ResultsEmailRequest = await req.json();

    console.log("Processing results email with data:", {
      hasQuizResults: !!quizResults,
      hasCalculatorResults: !!calculatorResults,
      hasLeadData: !!leadData,
      quizResultsKeys: quizResults ? Object.keys(quizResults) : [],
      calculatorResultsKeys: calculatorResults ? Object.keys(calculatorResults) : [],
      leadDataKeys: leadData ? Object.keys(leadData) : []
    });

    // Validate required data
    if (!quizResults || !calculatorResults) {
      console.error("Missing required data: quizResults or calculatorResults");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required assessment data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract and validate calculator data with fallbacks
    const monthlyRevenue = Number(calculatorResults.monthlyRevenue) || 0;
    const totalRevenue = monthlyRevenue * 12;
    
    // Safe access to nested properties
    const uplift = calculatorResults.uplift || {};
    const breakdown = calculatorResults.breakdown || {};
    const unaddressableInventory = calculatorResults.unaddressableInventory || {};
    const inputs = calculatorResults.inputs || {};

    const revenueIncrease = Number(uplift.totalAnnualUplift) || 0;
    const addressabilityImprovement = Number(breakdown.addressabilityImprovement) || 0;
    const monthlyUplift = Number(uplift.totalMonthlyUplift) || 0;
    const percentageImprovement = Number(uplift.percentageImprovement) || 0;
    
    console.log("Calculated values:", {
      monthlyRevenue,
      totalRevenue,
      revenueIncrease,
      addressabilityImprovement,
      monthlyUplift,
      percentageImprovement
    });
    
    // Create subject line with user info
    const userName = leadData ? `${leadData.firstName || 'User'} ${leadData.lastName || ''}`.trim() : 'Anonymous User';
    const companyName = leadData?.company || 'Unknown Company';
    const subjectLine = `Identity Health Assessment - ${userName} from ${companyName}`;
    
    console.log("Email subject:", subjectLine);

    // Generate comprehensive Q&A section
    const quizQASection = quizResults.answers ? Object.entries(quizResults.answers).map(([questionId, answerId]) => `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <h4 style="color: #1f2937; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          ${getQuestionText(questionId)}
        </h4>
        <p style="color: #374151; font-size: 14px; margin: 0;">
          <strong>Answer:</strong> ${getAnswerText(questionId, answerId)}
        </p>
      </div>
    `).join('') : '<p>No quiz answers available</p>';

    // Safe access to sales mix data
    const salesMix = breakdown.salesMix || {};
    const salesMixSection = salesMix.direct ? `
      <p><strong>Direct Sales:</strong> ${salesMix.direct}%</p>
      <p><strong>Deal IDs:</strong> ${salesMix.dealIds || 0}%</p>
      <p><strong>Open Exchange:</strong> ${salesMix.openExchange || 0}%</p>
    ` : '<p>Sales mix data not available</p>';

    // Generate email HTML with comprehensive data structure for AI parsing
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #ffffff;">
        
        <!-- HEADER SECTION -->
        <div style="text-align: center; margin-bottom: 40px; padding: 20px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 12px; color: white;">
          <h1 style="color: white; font-size: 32px; margin-bottom: 10px; font-weight: bold;">AdFixus Identity Health Assessment</h1>
          <p style="color: #e0e7ff; font-size: 18px; margin: 0;">Complete Results Report</p>
          <p style="color: #e0e7ff; font-size: 14px; margin: 10px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <!-- CONTACT INFORMATION SECTION -->
        ${leadData ? `
        <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #3b82f6;">
          <h2 style="color: #1e40af; font-size: 22px; margin-bottom: 20px; font-weight: bold;">📋 CONTACT INFORMATION</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 8px 0;"><strong>Full Name:</strong> ${leadData.firstName || 'N/A'} ${leadData.lastName || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${leadData.email || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 8px 0;"><strong>Company:</strong> ${leadData.company || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Job Title:</strong> ${leadData.jobTitle || 'N/A'}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- EXECUTIVE SUMMARY -->
        <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #10b981;">
          <h2 style="color: #065f46; font-size: 22px; margin-bottom: 20px; font-weight: bold;">📊 EXECUTIVE SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <h3 style="color: #dc2626; font-size: 16px; margin-bottom: 5px;">Current Monthly Revenue Loss</h3>
              <p style="color: #dc2626; font-size: 28px; font-weight: bold; margin: 5px 0;">${formatCurrency(unaddressableInventory.lostRevenue)}</p>
              <p style="color: #6b7280; font-size: 12px;">Due to unaddressable inventory</p>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <h3 style="color: #059669; font-size: 16px; margin-bottom: 5px;">Annual Revenue Opportunity</h3>
              <p style="color: #059669; font-size: 28px; font-weight: bold; margin: 5px 0;">${formatCurrency(revenueIncrease)}</p>
              <p style="color: #6b7280; font-size: 12px;">Potential with AdFixus</p>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
              <h3 style="color: #7c3aed; font-size: 16px; margin-bottom: 5px;">Identity Health Grade</h3>
              <p style="color: #7c3aed; font-size: 28px; font-weight: bold; margin: 5px 0;">${quizResults.overallGrade || 'N/A'}</p>
              <p style="color: #6b7280; font-size: 12px;">Overall assessment score</p>
            </div>
          </div>
        </div>

        <!-- DETAILED QUIZ RESPONSES -->
        <div style="background: #fef7cd; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #f59e0b;">
          <h2 style="color: #92400e; font-size: 22px; margin-bottom: 20px; font-weight: bold;">❓ DETAILED QUIZ RESPONSES</h2>
          ${quizQASection}
          
          <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 8px;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Category Scores Breakdown:</h3>
            ${Object.entries(quizResults.scores || {}).map(([category, score]: [string, any]) => `
              <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span style="color: #374151; font-weight: 500;">${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</span>
                  <span style="color: #1f2937; font-weight: bold;">Grade: ${score.grade || 'N/A'} (${formatPercentage(score.score)}/4.0)</span>
                </div>
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px;">
                  <div style="background: #3b82f6; height: 100%; width: ${((score.score || 0) / 4) * 100}%; border-radius: 4px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- CALCULATOR INPUTS & ASSUMPTIONS -->
        <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #0ea5e9;">
          <h2 style="color: #0c4a6e; font-size: 22px; margin-bottom: 20px; font-weight: bold;">🔢 CALCULATOR INPUTS & ASSUMPTIONS</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Business Metrics</h4>
              <p><strong>Monthly Revenue:</strong> ${formatCurrency(monthlyRevenue)}</p>
              <p><strong>Annual Revenue:</strong> ${formatCurrency(totalRevenue)}</p>
              <p><strong>Website Traffic:</strong> ${formatNumber(calculatorResults.websiteTraffic)} visitors/month</p>
              <p><strong>Ad Impressions/Month:</strong> ${formatNumber(breakdown.totalAdImpressions)}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Browser Distribution</h4>
              <p><strong>Chrome Share:</strong> ${formatPercentage(inputs.chromeShare)}%</p>
              <p><strong>Safari Share:</strong> ${formatPercentage(inputs.safariShare)}%</p>
              <p><strong>Edge Share:</strong> ${formatPercentage(inputs.edgeShare)}%</p>
              <p><strong>Firefox Share:</strong> ${formatPercentage(inputs.firefoxShare)}%</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px;">
              <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Sales & Inventory</h4>
              <p><strong>Current Addressability:</strong> ${formatPercentage(inputs.currentAddressability)}%</p>
              <p><strong>Display/Video Split:</strong> ${formatPercentage(inputs.displayVideoSplit)}% Display</p>
              <p><strong>Number of Domains:</strong> ${inputs.numDomains || 'N/A'}</p>
              ${salesMixSection}
            </div>
          </div>
        </div>

        <!-- REVENUE IMPACT ANALYSIS -->
        <div style="background: #fdf2f8; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #ec4899;">
          <h2 style="color: #be185d; font-size: 22px; margin-bottom: 20px; font-weight: bold;">💰 REVENUE IMPACT ANALYSIS</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">Current State Analysis</h4>
            <p><strong>Unaddressable Inventory:</strong> ${formatPercentage(unaddressableInventory.percentage)}% (${formatNumber(unaddressableInventory.impressions)} impressions)</p>
            <p><strong>Monthly Revenue Loss:</strong> ${formatCurrency(unaddressableInventory.lostRevenue)}</p>
            <p><strong>Annual Revenue Loss:</strong> ${formatCurrency((unaddressableInventory.lostRevenue || 0) * 12)}</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">AdFixus Opportunity</h4>
            <p><strong>Addressability Improvement:</strong> +${formatPercentage(addressabilityImprovement)}%</p>
            <p><strong>Monthly Uplift:</strong> ${formatCurrency(monthlyUplift)}</p>
            <p><strong>Annual Uplift:</strong> ${formatCurrency(revenueIncrease)}</p>
            <p><strong>Revenue Increase:</strong> +${formatPercentage(percentageImprovement)}%</p>
          </div>
        </div>

        <!-- ACTION RECOMMENDATIONS -->
        <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #22c55e;">
          <h2 style="color: #166534; font-size: 22px; margin-bottom: 20px; font-weight: bold;">🎯 RECOMMENDED ACTIONS</h2>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">Priority Initiatives</h4>
            <ul style="color: #374151; line-height: 1.6; padding-left: 20px;">
              <li>Implement comprehensive identity resolution to address ${formatPercentage(unaddressableInventory.percentage)}% unaddressable inventory</li>
              <li>Focus on improving overall addressability from ${formatPercentage(inputs.currentAddressability)}% to 100%</li>
              <li>Optimize browser-specific strategies, especially for Safari (${formatPercentage(inputs.safariShare)}% share)</li>
              <li>Leverage privacy-compliant targeting to maximize CPMs and capture the ${formatCurrency(revenueIncrease)} annual opportunity</li>
              <li>Implement real-time optimization for inventory management across ${inputs.numDomains || 0} domains</li>
            </ul>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; font-style: italic;">
            This comprehensive assessment was generated by the AdFixus Identity Health Assessment tool.<br>
            For questions or to schedule a demo, contact the AdFixus team.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
            Report ID: ${Date.now()} | Generated: ${new Date().toISOString()}
          </p>
        </div>
      </div>
    `;

    console.log("Attempting to send email with subject:", subjectLine);
    console.log("Email HTML length:", emailHtml.length);

    const emailResponse = await resend.emails.send({
      from: "AdFixus Reports <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
      subject: subjectLine,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== EMAIL FUNCTION ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

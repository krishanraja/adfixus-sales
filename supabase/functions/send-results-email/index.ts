
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

// Safe formatting functions with comprehensive error handling
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const formatPercentage = (value: number | undefined | null, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '0.0';
  return Number(value).toFixed(decimals);
};

const formatNumber = (num: number | undefined | null): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('en-US').format(Number(num));
};

// Comprehensive question mapping based on actual quiz structure
const getQuestionText = (questionId: string): string => {
  const questions = {
    'durability': 'How long do your identity solutions typically persist across user sessions?',
    'addressability': 'What percentage of your inventory can you effectively target with personalized advertising?',
    'cross-domain': 'How well does your current identity solution work across different domains you operate?',
    'privacy-readiness': 'How prepared is your identity infrastructure for the deprecation of third-party cookies?',
    'safari-strategy': 'How well does your current solution work with privacy-focused browsers like Safari and Firefox?',
    'sales-mix': 'What is your current sales mix breakdown?'
  };
  return questions[questionId] || questionId;
};

const getAnswerText = (questionId: string, answerId: string): string => {
  const answers = {
    'durability': {
      'sessions': 'Sessions only - identities reset when users close browser',
      'days': '1-7 days - moderate persistence',
      'weeks': '1-4 weeks - good persistence', 
      'months': 'More than 30 days - excellent persistence'
    },
    'addressability': {
      'low': 'Less than 50% - significant addressability gaps',
      'medium': '50-70% - moderate addressability',
      'good': '70-85% - good addressability',
      'excellent': 'More than 85% - excellent addressability'
    },
    'cross-domain': {
      'poor': 'Poor - each domain operates independently',
      'limited': 'Limited - some cross-domain capabilities',
      'good': 'Good - works well across most domains',
      'excellent': 'Excellent - seamless cross-domain identity resolution'
    },
    'privacy-readiness': {
      'not-ready': 'Not prepared - heavily dependent on third-party cookies',
      'somewhat': 'Somewhat prepared - have some alternatives',
      'well-prepared': 'Well prepared - multiple cookie-less solutions',
      'fully-ready': 'Fully prepared - comprehensive cookie-less strategy'
    },
    'safari-strategy': {
      'struggling': 'Struggling - Safari/Firefox traffic largely unmonetizable',
      'basic': 'Basic approach - limited Safari/Firefox optimization',
      'optimized': 'Fully optimized - strong performance across all browsers'
    },
    'sales-mix': {
      'direct-heavy': 'Primarily direct sales (70%+)',
      'balanced': 'Balanced mix of direct and programmatic',
      'programmatic-heavy': 'Primarily programmatic/open exchange (70%+)',
      'pmp-focused': 'Heavy focus on private marketplace deals'
    }
  };
  return answers[questionId]?.[answerId] || `${questionId}: ${answerId}`;
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
    console.log("Resend API key found and validated");

    const resend = new Resend(resendApiKey);

    const { quizResults, calculatorResults, leadData }: ResultsEmailRequest = await req.json();

    console.log("Processing comprehensive results email with data:", {
      hasQuizResults: !!quizResults,
      hasCalculatorResults: !!calculatorResults,
      hasLeadData: !!leadData,
      quizAnswers: quizResults?.answers ? Object.keys(quizResults.answers) : [],
      calculatorInputs: calculatorResults?.inputs ? Object.keys(calculatorResults.inputs) : [],
      leadFields: leadData ? Object.keys(leadData) : []
    });

    // Validate required data
    if (!quizResults || !calculatorResults) {
      console.error("Missing required data: quizResults or calculatorResults");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required assessment data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract calculator inputs with comprehensive fallbacks
    const inputs = calculatorResults.inputs || {};
    const breakdown = calculatorResults.breakdown || {};
    const uplift = calculatorResults.uplift || {};
    const unaddressableInventory = calculatorResults.unaddressableInventory || {};

    // All user inputs from calculator
    const monthlyPageviews = Number(inputs.monthlyPageviews) || 0;
    const adImpressionsPerPage = Number(inputs.adImpressionsPerPage) || 0;
    const webDisplayCPM = Number(inputs.webDisplayCPM) || 0;
    const webVideoCPM = Number(inputs.webVideoCPM) || 0;
    const displayVideoSplit = Number(inputs.displayVideoSplit) || 0;
    const chromeShare = Number(inputs.chromeShare) || 0;
    const edgeShare = Number(inputs.edgeShare) || 0;
    const safariShare = 100 - chromeShare - edgeShare - (Number(inputs.firefoxShare) || 10);
    const firefoxShare = Number(inputs.firefoxShare) || 10;
    const numDomains = Number(inputs.numDomains) || 1;
    const currentAddressability = Number(inputs.currentAddressability) || 0;

    // Revenue calculations
    const monthlyRevenue = Number(calculatorResults.currentRevenue) || 0;
    const totalRevenue = monthlyRevenue * 12;
    const revenueIncrease = Number(uplift.totalAnnualUplift) || 0;
    const monthlyUplift = Number(uplift.totalMonthlyUplift) || 0;
    const percentageImprovement = Number(uplift.percentageImprovement) || 0;
    const addressabilityImprovement = Number(breakdown.addressabilityImprovement) || 0;

    // Traffic and inventory calculations
    const totalAdImpressions = monthlyPageviews * adImpressionsPerPage;
    const displayImpressions = totalAdImpressions * (displayVideoSplit / 100);
    const videoImpressions = totalAdImpressions * ((100 - displayVideoSplit) / 100);
    
    console.log("Calculated comprehensive values:", {
      monthlyPageviews,
      adImpressionsPerPage,
      totalAdImpressions,
      webDisplayCPM,
      webVideoCPM,
      displayVideoSplit,
      chromeShare,
      edgeShare,
      safariShare,
      firefoxShare,
      numDomains,
      currentAddressability,
      monthlyRevenue,
      revenueIncrease,
      monthlyUplift,
      percentageImprovement
    });
    
    // Create comprehensive subject line
    const userName = leadData ? `${leadData.firstName || 'User'} ${leadData.lastName || ''}`.trim() : 'Anonymous User';
    const companyName = leadData?.company || 'Unknown Company';
    const subjectLine = `Complete Identity ROI Analysis - ${userName} from ${companyName} - ${formatCurrency(revenueIncrease)} Annual Opportunity`;
    
    console.log("Email subject:", subjectLine);

    // Generate comprehensive quiz Q&A section with actual questions
    const quizQASection = quizResults.answers ? Object.entries(quizResults.answers).map(([questionId, answerId]) => `
      <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2563eb;">
        <h4 style="color: #1f2937; font-size: 14px; font-weight: bold; margin-bottom: 8px; line-height: 1.4;">
          Q: ${getQuestionText(questionId)}
        </h4>
        <p style="color: #374151; font-size: 14px; margin: 0; padding-left: 12px;">
          <strong>A:</strong> ${getAnswerText(questionId, answerId)}
        </p>
      </div>
    `).join('') : '<p style="color: #ef4444;">No quiz answers available - data incomplete</p>';

    // Sales mix data with fallbacks
    const salesMix = breakdown.salesMix || {};
    const directSales = salesMix.direct || 0;
    const dealIds = salesMix.dealIds || 0; 
    const openExchange = salesMix.openExchange || 0;

    // Generate comprehensive email content structured for AI analysis
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #ffffff; line-height: 1.6;">
        
        <!-- STRUCTURED DATA HEADER FOR AI PARSING -->
        <div style="display: none;" data-analysis-type="identity-roi-assessment">
          <!-- Structured data for AI tools -->
          <meta name="report-type" content="Identity Health Assessment + Revenue Calculator" />
          <meta name="assessment-date" content="${new Date().toISOString()}" />
          <meta name="total-annual-opportunity" content="${revenueIncrease}" />
          <meta name="current-monthly-revenue" content="${monthlyRevenue}" />
          <meta name="addressability-improvement" content="${addressabilityImprovement}" />
        </div>

        <!-- VISUAL HEADER -->
        <div style="text-align: center; margin-bottom: 40px; padding: 25px; background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); border-radius: 12px; color: white;">
          <h1 style="color: white; font-size: 28px; margin-bottom: 8px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">AdFixus Identity Health Assessment</h1>
          <h2 style="color: white; font-size: 20px; margin-bottom: 15px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.3);">Complete Revenue Impact Analysis</h2>
          <div style="background: rgba(255,255,255,0.15); padding: 12px; border-radius: 8px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">
            <p style="color: white; font-size: 16px; margin: 0; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">Annual Revenue Opportunity: ${formatCurrency(revenueIncrease)}</p>
            <p style="color: white; font-size: 14px; margin: 5px 0 0 0; text-shadow: 0 1px 2px rgba(0,0,0,0.4);">Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <!-- CONTACT INFORMATION SECTION -->
        ${leadData ? `
        <div style="background: #f1f5f9; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #3b82f6; color: #1f2937;">
          <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 20px; font-weight: bold;">📋 CONTACT INFORMATION</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #1f2937;"><strong>Full Name:</strong> ${leadData.firstName || 'N/A'} ${leadData.lastName || 'N/A'}</p>
              <p style="margin: 8px 0; font-size: 14px; color: #1f2937;"><strong>Email:</strong> ${leadData.email || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 8px 0; font-size: 14px; color: #1f2937;"><strong>Company:</strong> ${leadData.company || 'N/A'}</p>
              <p style="margin: 8px 0; font-size: 14px; color: #1f2937;"><strong>Job Title:</strong> ${leadData.jobTitle || 'N/A'}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- EXECUTIVE SUMMARY WITH KEY METRICS -->
        <div style="background: #ecfdf5; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #10b981;">
          <h2 style="color: #065f46; font-size: 20px; margin-bottom: 20px; font-weight: bold;">📊 EXECUTIVE SUMMARY</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #d1fae5;">
              <h3 style="color: #dc2626; font-size: 14px; margin-bottom: 5px;">Monthly Revenue Loss</h3>
              <p style="color: #dc2626; font-size: 24px; font-weight: bold; margin: 5px 0;">${formatCurrency(unaddressableInventory.lostRevenue || 0)}</p>
              <p style="color: #6b7280; font-size: 11px;">Unaddressable: ${formatPercentage(unaddressableInventory.percentage)}%</p>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #d1fae5;">
              <h3 style="color: #059669; font-size: 14px; margin-bottom: 5px;">Monthly Uplift Potential</h3>
              <p style="color: #059669; font-size: 24px; font-weight: bold; margin: 5px 0;">${formatCurrency(monthlyUplift)}</p>
              <p style="color: #6b7280; font-size: 11px;">+${formatPercentage(percentageImprovement)}% increase</p>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #d1fae5;">
              <h3 style="color: #7c3aed; font-size: 14px; margin-bottom: 5px;">Annual Opportunity</h3>
              <p style="color: #7c3aed; font-size: 24px; font-weight: bold; margin: 5px 0;">${formatCurrency(revenueIncrease)}</p>
              <p style="color: #6b7280; font-size: 11px;">12-month projection</p>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #d1fae5;">
              <h3 style="color: #2563eb; font-size: 14px; margin-bottom: 5px;">Identity Health Grade</h3>
              <p style="color: #2563eb; font-size: 24px; font-weight: bold; margin: 5px 0;">${quizResults.overallGrade || 'N/A'}</p>
              <p style="color: #6b7280; font-size: 11px;">Score: ${formatPercentage(quizResults.overallScore)}/4.0</p>
            </div>
          </div>
        </div>

        <!-- COMPREHENSIVE USER INPUTS SECTION FOR AI ANALYSIS -->
        <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #0ea5e9;">
          <h2 style="color: #0c4a6e; font-size: 20px; margin-bottom: 20px; font-weight: bold;">🔢 USER INPUT DATA (Complete Calculator Inputs)</h2>
          
          <!-- Traffic & Inventory Metrics -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Traffic & Inventory Metrics</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Monthly Pageviews:</strong> ${formatNumber(monthlyPageviews)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Ad Impressions/Page:</strong> ${adImpressionsPerPage.toFixed(1)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Total Monthly Ad Impressions:</strong> ${formatNumber(totalAdImpressions)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Display Inventory:</strong> ${formatNumber(displayImpressions)} (${formatPercentage(displayVideoSplit)}%)</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Video Inventory:</strong> ${formatNumber(videoImpressions)} (${formatPercentage(100 - displayVideoSplit)}%)</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Number of Domains:</strong> ${numDomains}</p>
            </div>
          </div>

          <!-- Monetization Data -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Monetization Data</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Web Display CPM:</strong> ${formatCurrency(webDisplayCPM)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Web Video CPM:</strong> ${formatCurrency(webVideoCPM)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Current Monthly Revenue:</strong> ${formatCurrency(monthlyRevenue)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Current Annual Revenue:</strong> ${formatCurrency(totalRevenue)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Current Addressability:</strong> ${formatPercentage(currentAddressability)}%</p>
            </div>
          </div>

          <!-- Browser Distribution -->
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Browser Distribution</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Chrome Share:</strong> ${formatPercentage(chromeShare)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Edge Share:</strong> ${formatPercentage(edgeShare)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Safari Share:</strong> ${formatPercentage(safariShare)}% (calculated)</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Firefox Share:</strong> ${formatPercentage(firefoxShare)}%</p>
            </div>
          </div>

          <!-- Sales Mix Breakdown -->
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px; font-weight: bold;">Sales Mix Distribution</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Direct Sales:</strong> ${formatPercentage(directSales)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Deal IDs/PMP:</strong> ${formatPercentage(dealIds)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Open Exchange:</strong> ${formatPercentage(openExchange)}%</p>
            </div>
          </div>
        </div>

        <!-- DETAILED QUIZ RESPONSES -->
        <div style="background: #fef7cd; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #f59e0b;">
          <h2 style="color: #92400e; font-size: 20px; margin-bottom: 20px; font-weight: bold;">❓ IDENTITY HEALTH ASSESSMENT RESPONSES</h2>
          ${quizQASection}
          
          <div style="margin-top: 25px; padding: 20px; background: white; border-radius: 8px;">
            <h3 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">Category Scores Breakdown:</h3>
            ${Object.entries(quizResults.scores || {}).map(([category, score]: [string, any]) => `
              <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span style="color: #374151; font-weight: 500; font-size: 14px;">${category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}</span>
                  <span style="color: #1f2937; font-weight: bold; font-size: 14px;">Grade: ${score.grade || 'N/A'} (${formatPercentage(score.score)}/4.0)</span>
                </div>
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px;">
                  <div style="background: #3b82f6; height: 100%; width: ${((score.score || 0) / 4) * 100}%; border-radius: 3px;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- COMPREHENSIVE REVENUE ANALYSIS -->
        <div style="background: #fdf2f8; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #ec4899;">
          <h2 style="color: #be185d; font-size: 20px; margin-bottom: 20px; font-weight: bold;">💰 COMPREHENSIVE REVENUE IMPACT ANALYSIS</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">Current State Analysis</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Addressable Impressions:</strong> ${formatNumber((totalAdImpressions || 0) - (unaddressableInventory.impressions || 0))}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Unaddressable Impressions:</strong> ${formatNumber(unaddressableInventory.impressions || 0)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Unaddressable Percentage:</strong> ${formatPercentage(unaddressableInventory.percentage)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Monthly Revenue Loss:</strong> ${formatCurrency(unaddressableInventory.lostRevenue || 0)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Annual Revenue Loss:</strong> ${formatCurrency((unaddressableInventory.lostRevenue || 0) * 12)}</p>
            </div>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">AdFixus Opportunity Projection</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px;">
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Addressability Improvement:</strong> +${formatPercentage(addressabilityImprovement)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Monthly Revenue Uplift:</strong> ${formatCurrency(monthlyUplift)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Annual Revenue Uplift:</strong> ${formatCurrency(revenueIncrease)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>Revenue Increase Percentage:</strong> +${formatPercentage(percentageImprovement)}%</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>New Monthly Total:</strong> ${formatCurrency(monthlyRevenue + monthlyUplift)}</p>
              <p style="margin: 4px 0; font-size: 14px; color: #1f2937;"><strong>New Annual Total:</strong> ${formatCurrency((monthlyRevenue + monthlyUplift) * 12)}</p>
            </div>
          </div>
        </div>

        <!-- ACTION RECOMMENDATIONS -->
        <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #22c55e;">
          <h2 style="color: #166534; font-size: 20px; margin-bottom: 20px; font-weight: bold;">🎯 STRATEGIC RECOMMENDATIONS</h2>
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h4 style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">Priority Initiatives Based on Assessment</h4>
            <ul style="color: #1f2937; line-height: 1.8; padding-left: 20px; font-size: 14px;">
              <li style="color: #1f2937;"><strong>Address ${formatPercentage(unaddressableInventory.percentage)}% unaddressable inventory</strong> - implement comprehensive identity resolution to capture ${formatCurrency((unaddressableInventory.lostRevenue || 0) * 12)} in annual lost revenue</li>
              <li style="color: #1f2937;"><strong>Improve overall addressability</strong> from ${formatPercentage(currentAddressability)}% to 100% for maximum revenue capture</li>
              <li style="color: #1f2937;"><strong>Optimize Safari/Firefox monetization</strong> - ${formatPercentage(safariShare + firefoxShare)}% of traffic needs privacy-compliant targeting</li>
              <li style="color: #1f2937;"><strong>Leverage cross-domain identity resolution</strong> across ${numDomains} domain${numDomains > 1 ? 's' : ''} for unified user understanding</li>
              <li style="color: #1f2937;"><strong>Enhance sales mix optimization</strong> - current ${formatPercentage(openExchange)}% open exchange could benefit from more direct sales (${formatPercentage(directSales)}%)</li>
              <li style="color: #1f2937;"><strong>Implement real-time CPM optimization</strong> to maximize ${formatNumber(totalAdImpressions)} monthly impressions</li>
            </ul>
          </div>
        </div>

        <!-- FOOTER WITH DATA VALIDATION -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; border-top: 2px solid #e5e7eb; background: #f9fafb;">
          <p style="color: #6b7280; font-size: 14px; font-style: italic; margin-bottom: 10px;">
            This comprehensive assessment report contains all user inputs and calculated results for complete analysis.<br>
            Generated by AdFixus Identity ROI Assessment Tool - Ready for AI processing and strategic planning.
          </p>
          <div style="margin-top: 15px; padding: 10px; background: #e0f2fe; border-radius: 6px; display: inline-block;">
            <p style="color: #0c4a6e; font-size: 12px; margin: 0; font-weight: 500;">
              Report ID: ADFX-${Date.now()} | Generated: ${new Date().toISOString()}<br>
              Data Status: Complete | AI Analysis Ready | Contact: krish.raja@adfixus.com
            </p>
          </div>
        </div>
      </div>
    `;

    console.log("Sending comprehensive email with subject:", subjectLine);
    console.log("Email HTML length:", emailHtml.length);

    const emailResponse = await resend.emails.send({
      from: "AdFixus Assessment Reports <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
      subject: subjectLine,
      html: emailHtml,
    });

    console.log("Comprehensive email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("=== COMPREHENSIVE EMAIL FUNCTION ERROR ===");
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

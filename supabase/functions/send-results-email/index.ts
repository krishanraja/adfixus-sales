import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPercentage = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quizResults, calculatorResults, leadData }: ResultsEmailRequest = await req.json();

    // Calculate key metrics
    const totalRevenue = calculatorResults.monthlyRevenue * 12;
    const revenueIncrease = calculatorResults.revenueIncrease || 0;
    const addressabilityImprovement = calculatorResults.addressabilityImprovement || 0;
    
    // Generate email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; font-size: 28px; margin-bottom: 10px;">Identity Health Report Results</h1>
          <p style="color: #6b7280; font-size: 16px;">A new user has completed the identity health assessment</p>
        </div>

        ${leadData ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Contact Information</h2>
          <p><strong>Name:</strong> ${leadData.firstName} ${leadData.lastName}</p>
          <p><strong>Email:</strong> ${leadData.email}</p>
          <p><strong>Company:</strong> ${leadData.company}</p>
          <p><strong>Job Title:</strong> ${leadData.jobTitle}</p>
        </div>
        ` : ''}

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Revenue Impact Overview</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="color: #6b7280; margin: 5px 0;">Annual Revenue</p>
              <p style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 5px 0;">${formatCurrency(totalRevenue)}</p>
            </div>
            <div>
              <p style="color: #6b7280; margin: 5px 0;">Potential Revenue Increase</p>
              <p style="color: #059669; font-size: 24px; font-weight: bold; margin: 5px 0;">${formatCurrency(revenueIncrease)}</p>
            </div>
          </div>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Identity Health Scorecard</h2>
          <div style="margin-bottom: 15px;">
            <p style="color: #6b7280; margin: 5px 0;">Addressability Improvement</p>
            <p style="color: #d97706; font-size: 20px; font-weight: bold; margin: 5px 0;">${formatPercentage(addressabilityImprovement)}%</p>
          </div>
          
          <h3 style="color: #1f2937; font-size: 16px; margin: 15px 0 10px 0;">Category Scores:</h3>
          ${Object.entries(quizResults.scores).map(([category, score]: [string, any]) => `
            <div style="margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #374151;">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                <span style="color: #1f2937; font-weight: bold;">${formatPercentage(score)}%</span>
              </div>
              <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 5px;">
                <div style="background: #3b82f6; height: 100%; width: ${score}%; border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 15px;">Calculator Inputs</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p><strong>Monthly Revenue:</strong> ${formatCurrency(calculatorResults.monthlyRevenue)}</p>
              <p><strong>Website Traffic:</strong> ${calculatorResults.websiteTraffic?.toLocaleString()}/month</p>
              <p><strong>Chrome Share:</strong> ${calculatorResults.chromeShare?.toFixed(0)}%</p>
            </div>
            <div>
              <p><strong>Edge Share:</strong> ${calculatorResults.edgeShare?.toFixed(1)}%</p>
              <p><strong>Sales Mix - Digital:</strong> ${calculatorResults.salesMix?.digital}%</p>
              <p><strong>Sales Mix - Retail:</strong> ${calculatorResults.salesMix?.retail}%</p>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">This report was generated automatically by the AdFixus Identity Health Assessment tool.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "AdFixus Reports <onboarding@resend.dev>",
      to: ["hello@krishraja.com"],
      subject: `New Identity Health Report - ${leadData?.company || 'Anonymous User'}`,
      html: emailHtml,
    });

    console.log("Results email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending results email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
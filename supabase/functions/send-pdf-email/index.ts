import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  pdfBase64: string;
  userContactDetails: {
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
    console.log("Request body structure:", {
      hasPdfBase64: !!requestBody.pdfBase64,
      hasUserContactDetails: !!requestBody.userContactDetails,
      hasQuizResults: !!requestBody.quizResults,
      hasCalculatorResults: !!requestBody.calculatorResults,
      pdfBase64Length: requestBody.pdfBase64?.length || 0
    });
    
    const { pdfBase64, userContactDetails, quizResults, calculatorResults }: EmailRequest = requestBody;

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

    // Safely extract user information with fallbacks
    const userInfo = userContactDetails || {};
    const userName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'Unknown User';
    const userCompany = userInfo.company || 'Unknown Company';
    const userEmail = userInfo.email || 'Unknown Email';
    
    console.log("Processing email for:", { userName, userCompany, userEmail });

    // Create email body with user contact details and PDF contents summary
    const emailBody = `
      <h2>New AdFixus Identity ROI Analysis Submission</h2>
      
      <h3>User Contact Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
        <li><strong>Company:</strong> ${userCompany}</li>
      </ul>

      <h3>Analysis Summary:</h3>
      <ul>
        <li><strong>Overall Identity Health Grade:</strong> ${quizResults?.overallGrade || 'N/A'}</li>
        <li><strong>Monthly Revenue Loss:</strong> $${calculatorResults?.unaddressableInventory?.lostRevenue?.toLocaleString() || 'N/A'}</li>
        <li><strong>Monthly Uplift Potential:</strong> $${calculatorResults?.uplift?.totalMonthlyUplift?.toLocaleString() || 'N/A'}</li>
        <li><strong>Annual Opportunity:</strong> $${calculatorResults?.uplift?.totalAnnualUplift?.toLocaleString() || 'N/A'}</li>
        <li><strong>Unaddressable Inventory:</strong> ${calculatorResults?.unaddressableInventory?.percentage?.toFixed(1) || 'N/A'}%</li>
      </ul>

      <h3>Key Input Parameters:</h3>
      <ul>
        <li><strong>Monthly Pageviews:</strong> ${calculatorResults?.inputs?.monthlyPageviews?.toLocaleString() || 'N/A'}</li>
        <li><strong>Average CPM:</strong> $${calculatorResults?.inputs?.avgCpm || 'N/A'}</li>
        <li><strong>Chrome Browser Share:</strong> ${calculatorResults?.inputs?.chromeShare || 'N/A'}%</li>
        <li><strong>Number of Domains:</strong> ${calculatorResults?.inputs?.numDomains || 'N/A'}</li>
        <li><strong>Display/Video Split:</strong> ${calculatorResults?.inputs?.displayVideoSplit || 'N/A'}% display</li>
      </ul>

      <p><strong>Full detailed analysis is attached as PDF.</strong></p>
      
      <p>This lead was generated from the AdFixus Identity ROI Calculator.</p>
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
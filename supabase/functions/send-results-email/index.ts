import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== EMAIL FUNCTION STARTED ===");
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { quizResults, calculatorResults, leadData } = await req.json()

    // Validate input data
    if (!quizResults || !calculatorResults) {
      return new Response(
        JSON.stringify({ error: 'Missing required data' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log("Processing comprehensive results email with data:", {
      hasQuizResults: !!quizResults,
      hasCalculatorResults: !!calculatorResults,
      hasLeadData: !!leadData
    });

    // Log the email sending attempt for audit trail
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        quiz_results: quizResults,
        calculator_results: calculatorResults,
        lead_data: leadData,
        status: 'pending'
      })

    if (logError) {
      console.error('Error logging email attempt:', logError)
    }

    // In a real implementation, you would send the email here using Resend
    // For now, we'll just return success
    console.log("Email would be sent to:", leadData?.email || 'No email provided');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email queued for sending'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-results-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
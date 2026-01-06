// Version: 3.0.0 - Use OpenAI API instead of Lovable gateway - 2026-01-06
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use OpenAI API key directly
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `You are an elite AdOps strategic analyst with deep expertise in publisher revenue optimization, identity infrastructure, and programmatic advertising. You analyze domain scan results and provide executive-level insights.

Your analysis should be:
- Direct and actionable, not vague coaching
- Tied to specific data points from the scan
- Focused on revenue impact and competitive positioning
- Quantified where possible (use the traffic/impression data)
- Written for a CMO or VP of Revenue audience

Output JSON with this structure:
{
  "executiveSummary": "2-3 sentence high-impact summary of the portfolio's health and biggest opportunity",
  "topRecommendations": ["action 1", "action 2", "action 3"],
  "riskAssessment": "1-2 sentence board-level risk statement",
  "competitorPositioning": "1-2 sentence competitive analysis vs walled gardens",
  "ninetyDayRoadmap": "3-step implementation roadmap with specific timelines"
}`;

interface DomainSummary {
  domain: string;
  addressability_gap_pct: number;
  competitive_positioning: string;
  privacy_risk_level: string;
  has_conversion_api: boolean;
  has_ppid: boolean;
  tranco_rank?: number;
  rank_trend?: string;
  estimated_monthly_impressions?: number;
  id_bloat_severity?: string;
}

interface PublisherContext {
  monthlyImpressions?: number;
  publisherVertical?: string;
  ownedDomainsCount?: number;
}

serve(async (req) => {
  // CRITICAL: Handle OPTIONS preflight with explicit 200 status
  if (req.method === 'OPTIONS') {
    console.log('[generate-insights] Handling CORS preflight');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const origin = req.headers.get('origin') || 'unknown';
    console.log('[generate-insights] Request received from:', origin);
    
    const { results, context, scanId }: { 
      results: DomainSummary[]; 
      context?: PublisherContext;
      scanId: string;
    } = await req.json();

    if (!OPENAI_API_KEY) {
      console.error('[generate-insights] OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please set OPENAI_API_KEY in Supabase secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    const totalImpressions = results.reduce((sum, r) => sum + (r.estimated_monthly_impressions || 0), 0);
    const avgGap = results.reduce((sum, r) => sum + r.addressability_gap_pct, 0) / results.length;
    const hasAnyCapi = results.some(r => r.has_conversion_api);
    const hasAnyPpid = results.some(r => r.has_ppid);
    const highRiskCount = results.filter(r => r.privacy_risk_level === 'high-risk').length;
    const growingCount = results.filter(r => r.rank_trend === 'growing').length;
    const decliningCount = results.filter(r => r.rank_trend === 'declining').length;

    const userPrompt = `Analyze this publisher portfolio scan:

## Portfolio Overview
- ${results.length} domains scanned
- Total estimated monthly impressions: ${totalImpressions.toLocaleString()}
- Average addressability gap: ${avgGap.toFixed(1)}%
- Vertical: ${context?.publisherVertical || 'unknown'}

## Key Findings
- Conversion API present: ${hasAnyCapi ? 'Yes (some domains)' : 'No'}
- Owned PPID present: ${hasAnyPpid ? 'Yes (some domains)' : 'No'}
- High privacy risk domains: ${highRiskCount}
- Traffic trend: ${growingCount} growing, ${decliningCount} declining

## Domain Details
${results.map(r => `
- ${r.domain}:
  - Position: ${r.competitive_positioning}
  - Gap: ${r.addressability_gap_pct.toFixed(1)}%
  - Risk: ${r.privacy_risk_level}
  - Rank: ${r.tranco_rank ? `#${r.tranco_rank.toLocaleString()}` : 'unranked'}
  - Trend: ${r.rank_trend || 'unknown'}
  - Impressions: ${r.estimated_monthly_impressions ? r.estimated_monthly_impressions.toLocaleString() : 'unknown'}/mo
`).join('')}

Provide strategic insights for this portfolio.`;

    console.log(`[generate-insights] Generating AI insights for scan ${scanId} using OpenAI`);

    // Call OpenAI API directly
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-insights] OpenAI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid OpenAI API key. Please check your OPENAI_API_KEY secret.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      console.error('[generate-insights] Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    console.log('[generate-insights] AI insights generated successfully via OpenAI');

    return new Response(
      JSON.stringify(insights),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-insights] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhanceRequest {
    text: string;
    context: 'accomplishments' | 'blockers';
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Parse request body
        const { text, context }: EnhanceRequest = await req.json();

        if (!text || !text.trim()) {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl!, supabaseKey!);

        // Get user ID from Auth header if possible
        const authHeader = req.headers.get('Authorization');
        let userId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        // Get OpenAI API key from environment
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openaiApiKey) {
            console.error('OpenAI API key not configured');
            // Return fallback enhancement
            const enhanced = enhanceTextFallback(text, context);
            return new Response(
                JSON.stringify({ enhancedText: enhanced, usingFallback: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Try to enhance with OpenAI
        try {
            const enhanced = await enhanceWithOpenAI(text, context, openaiApiKey, supabase, userId);

            return new Response(
                JSON.stringify({ enhancedText: enhanced, usingFallback: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        } catch (aiError) {
            console.error('OpenAI error:', aiError);
            // Fall back to simple enhancement
            const enhanced = enhanceTextFallback(text, context);
            return new Response(
                JSON.stringify({ enhancedText: enhanced, usingFallback: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }
    } catch (error) {
        console.error('Error in enhance-text function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function enhanceWithOpenAI(
    text: string,
    context: string,
    apiKey: string,
    supabase: any,
    userId: string | null
): Promise<string> {
    const contextPrompt = context === 'accomplishments'
        ? 'This is a list of tasks/accomplishments completed during work.'
        : 'This is a list of blockers or challenges faced during work.';

    const systemPrompt = `Role: Senior Technical Writer & Engineering Manager.
Action: Clear and professional engineering log enhancement.
Context: ${contextPrompt}
Expectation:
- Transform raw, messy status updates into professional, bulleted standup items.
- Fix grammar, spelling, and clarify vague technical terms.
- USE STRONG VERBS (e.g., "Resolved", "Implemented", "Analyzed", "Debugged").
- KEEP IT CONCISE.
- Maintain a senior-level technical tone.
- If multiple items are present, use a clean bulleted list.
- DO NOT add fake information; stay 100% faithful to the user's intent.

Constraint: Return ONLY the enhanced text. No "Here is the version" or other chat filler.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 500,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
        const enhancedText = data.choices[0].message.content.trim();

        // Log usage to database
        try {
            const usage = data.usage;
            if (usage) {
                const inputTokens = usage.prompt_tokens || 0;
                const outputTokens = usage.completion_tokens || 0;
                const totalTokens = usage.total_tokens || 0;
                const estimatedCost = (inputTokens * 0.0000015) + (outputTokens * 0.000002);

                await supabase
                    .from('openai_usage')
                    .insert({
                        feature: 'enhance-text',
                        user_id: userId,
                        model: 'gpt-3.5-turbo',
                        input_tokens: inputTokens,
                        output_tokens: outputTokens,
                        total_tokens: totalTokens,
                        estimated_cost: estimatedCost
                    });

                console.log(`📊 Logged usage: ${totalTokens} tokens, $${estimatedCost.toFixed(6)}`);
            }
        } catch (logError) {
            console.error('Failed to log usage (non-critical):', logError);
        }

        return enhancedText;
    }

    throw new Error('Invalid response from OpenAI');
}

function enhanceTextFallback(text: string, context: string): string {
    // Simple fallback: capitalize sentences and fix basic formatting
    let enhanced = text.trim();

    // Capitalize first letter
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);

    // Add period if missing
    if (!['.', '!', '?'].includes(enhanced.slice(-1))) {
        enhanced += '.';
    }

    // Split into lines and format as bullets if multiple lines
    const lines = enhanced.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
        enhanced = lines.map(line => {
            const trimmed = line.trim();
            const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            const withPeriod = ['.', '!', '?'].includes(capitalized.slice(-1))
                ? capitalized
                : capitalized + '.';
            return `- ${withPeriod}`;
        }).join('\n');
    }

    return enhanced;
}

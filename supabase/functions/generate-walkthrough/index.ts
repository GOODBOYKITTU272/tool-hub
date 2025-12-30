import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { toolName, description, ownerTeam, techStack, language, instructions } = await req.json();

        // Get OpenAI API key
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not configured');
        }

        // Initialize Supabase for usage logging
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabase = createClient(supabaseUrl!, supabaseKey!);

        // Get user ID
        const authHeader = req.headers.get('Authorization');
        let userId = null;
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            userId = user?.id;
        }

        const systemPrompt = `Role: Principal Software Architect & Technical KT Expert.
Task: Generate a comprehensive Technical Walkthrough and Knowledge Transfer (KT) Guide for a tool.
Style: Professional, structured, and developer-friendly. Use clear Markdown.

Constraint: Return ONLY the markdown content.

Context: 
- Tool Name: ${toolName}
- Description: ${description}
- Team: ${ownerTeam}
- Language: ${language}
- Tech Stack: ${techStack}

Additional Instructions from User:
${instructions || 'No additional instructions provided. Use your best professional judgment.'}

Expected Sections:
1. Technical Overview (High-level architecture and purpose)
2. Technology Stack (Detailed breakdown of why these choices were made)
3. Repository Structure (Suggested layout for src, assets, etc.)
4. Core Logic Flow (Explain the primary user flow or data processing path)
5. Critical "Gotchas" (Potential pitfalls for new developers)
6. API & Environment Setup (What a developer needs to know to start)

Make the content specific to the tool's description. If details are missing, provide high-quality structural placeholders (e.g., "[Describe your primary database schema here]").`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Use 4o-mini for fast, high-quality structure
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Generate a KT walkthrough for ${toolName}.` }
                ],
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI error: ${error}`);
        }

        const data = await response.json();
        const walkthrough = data.choices[0].message.content.trim();

        // Log usage (non-critical)
        try {
            const usage = data.usage;
            if (usage) {
                const inputTokens = usage.prompt_tokens || 0;
                const outputTokens = usage.completion_tokens || 0;
                const totalTokens = usage.total_tokens || 0;
                const estimatedCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006); // 4o-mini pricing roughly

                await supabase
                    .from('openai_usage')
                    .insert({
                        feature: 'generate-walkthrough',
                        user_id: userId,
                        model: 'gpt-4o-mini',
                        input_tokens: inputTokens,
                        output_tokens: outputTokens,
                        total_tokens: totalTokens,
                        estimated_cost: estimatedCost
                    });
            }
        } catch (e) {
            console.error('Usage log error:', e);
        }

        return new Response(
            JSON.stringify({ walkthrough }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

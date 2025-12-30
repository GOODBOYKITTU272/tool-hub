import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { log_id, user_id } = await req.json();

    // Initialize Supabase client with better error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      urlPreview: supabaseUrl?.substring(0, 30) + '...',
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    });

    console.log('Fetching log:', { log_id, user_id });

    // Fetch the daily log details
    const { data: log, error: logError } = await supabase
      .from('daily_logs')
      .select(`
        *,
        tool:tools!daily_logs_tool_id_fkey(name),
        owner:users!daily_logs_tool_owner_id_fkey(name),
        user:users!daily_logs_user_id_fkey(name, email)
      `)
      .eq('id', log_id)
      .single();

    if (logError) {
      console.error('Database error:', logError);
      throw logError;
    }

    if (!log) {
      throw new Error(`No log found with id: ${log_id}`);
    }

    console.log('Log fetched successfully:', { logId: log.id, userId: log.user_id });

    // Generate AI standup prep using AWS Bedrock (Amazon Nova)
    const standupPrep = await generateStandupPrep(log, supabase);

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    await sendEmail(log.user.email, log.user.name, standupPrep, resendApiKey);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
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

async function generateStandupPrep(log: any, supabase: any): Promise<string> {
  const workType = log.work_type === 'own_tool'
    ? `Working on my own tool`
    : `Collaborated with ${log.owner?.name || 'team member'}`;

  const prompt = `🎯 DAILY STANDUP PREP — RACE FRAMEWORK

R — ROLE

You are a senior software engineer with 10+ years of experience.
- You report to the CTO daily
- You give clear, confident standup updates
- You speak simply and professionally
- You never exaggerate

A — ACTION (WHAT YOU MUST DO)

Generate a standup preparation summary that helps the engineer:
1. Speak confidently in tomorrow's standup meeting
2. Explain today's work clearly and concisely
3. Be ready for follow-up questions

This is for SPOKEN DELIVERY in a 2-3 minute standup.

C — CONTEXT (INPUT DATA)

Tool: ${log.tool?.name || 'Unknown'}
Work Type: ${workType}
What Was Completed Today: ${log.tasks_completed}
Blockers/Challenges: ${log.blockers || 'None'}

⚠️ Do not add anything beyond the provided input.

E — EXPECTATION (OUTPUT REQUIREMENTS)

Generate output in this exact structure:

## What I Accomplished Today

Write 2-3 sentences explaining:
- What work was done today
- Mention the tool name naturally
- Focus on outcomes and completion
- Keep it conversational and confident

Example tone:
"Today I worked on ${log.tool?.name || 'the project'}. I completed [task] and made progress on [area]. The [feature/component] is now [stable/working/complete]."

## Challenges & Blockers

${log.blockers ? 'State the blocker clearly and directly.' : 'If no blockers, say exactly: "There are no blockers at the moment."'}
Do not over-explain. Be factual.

## Key Talking Points for Standup

Provide 2-4 short bullets that:
- Sound natural when spoken aloud
- Help the engineer stay calm and focused
- Cover the main accomplishment and any blockers

Example format:
• Completed [specific outcome]
• [Tool/feature] is now stable
• ${log.blockers ? 'Blocked on [specific issue]' : 'No blockers, on track'}

🚫 HARD RULES

- Use simple, confident English
- No jargon or technical details
- No greetings or filler
- Total speaking time: under 3 minutes
- Do not exaggerate or invent work
- Focus on what's DONE, not how it was done

🎯 FINAL GOAL

Help the engineer walk into standup:
- Fully prepared
- Speaking clearly without stress
- Giving the CTO exactly what they need to know`;

  // Try to use OpenAI for AI-generated content
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.log('OpenAI API key not found, using fallback');
      return generateSimpleFallback(log);
    }

    console.log('🤖 Calling OpenAI for AI standup prep');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a professional technical writer helping engineers prepare for standup meetings.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI request failed:', response.status, await response.text());
      return generateSimpleFallback(log);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (generatedText) {
      console.log('🎯 Using AI-generated standup prep');

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
              feature: 'daily-email',
              user_id: log.user_id,
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

      return generatedText.trim();
    } else {
      console.warn('⚠️ No text in OpenAI response, using fallback');
      return generateSimpleFallback(log);
    }

  } catch (error) {
    console.error('❌ OpenAI error:', error.message);
    console.log('📧 Falling back to formatted template');
    return generateSimpleFallback(log);
  }
}

// Fallback function for when AI is unavailablely formatted email
function generateSimpleFallback(log: any): string {
  const workType = log.work_type === 'own_tool'
    ? 'my own tool'
    : `collaboration with ${log.owner?.name || 'team member'}`;

  return `**What I Accomplished Today:**
${log.tasks_completed}

**Challenges & Blockers:**
${log.blockers || 'No blockers reported'}

**Key Talking Points for Standup:**
1. Worked on ${log.tool?.name || 'project'} (${workType})
2. Completed: ${log.tasks_completed.split('\n')[0] || 'tasks as listed above'}
3. ${log.blockers ? 'Addressing blockers mentioned above' : 'On track with no major blockers'}`;
}

async function sendEmail(
  toEmail: string,
  toName: string,
  standupPrep: string,
  apiKey: string
): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'Tool Hub <onboarding@resend.dev>', // Use Resend test domain
      to: [toEmail],
      subject: `🎯 Tomorrow's Standup Prep - ${dateStr}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6; 
              color: #1f2937;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              margin: 0;
              padding: 40px 20px;
            }
            .email-wrapper {
              max-width: 650px;
              margin: 0 auto;
            }
            .container { 
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 48px 40px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="10" cy="10" r="1" fill="white" opacity="0.1"/></svg>') repeat;
              opacity: 0.3;
            }
            .header h1 {
              color: white;
              margin: 0 0 12px 0;
              font-size: 36px;
              font-weight: 800;
              letter-spacing: -1px;
              position: relative;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            }
            .header p {
              color: rgba(255, 255, 255, 0.95);
              margin: 0;
              font-size: 17px;
              font-weight: 500;
              position: relative;
            }
            .content {
              padding: 48px 40px;
            }
            .greeting {
              font-size: 28px;
              color: #111827;
              margin-bottom: 12px;
              font-weight: 700;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .intro {
              color: #6b7280;
              margin-bottom: 32px;
              font-size: 16px;
              line-height: 1.6;
            }
            .quote-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              padding: 24px 28px;
              border-radius: 12px;
              margin: 32px 0;
              font-style: italic;
              color: #92400e;
              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
              position: relative;
            }
            .quote-box::before {
              content: '"';
              font-size: 60px;
              position: absolute;
              top: 10px;
              left: 15px;
              opacity: 0.2;
              font-family: Georgia, serif;
            }
            .quote-text {
              font-size: 17px;
              line-height: 1.7;
              margin: 0 0 12px 0;
              font-weight: 500;
              position: relative;
              z-index: 1;
            }
            .quote-author {
              font-size: 14px;
              text-align: right;
              opacity: 0.85;
              font-weight: 600;
            }
            .prep-section {
              background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 28px 32px;
              margin: 28px 0;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .prep-section:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
            }
            .prep-section h3 {
              color: #111827;
              margin: 0 0 16px 0;
              font-size: 18px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 12px;
            }
            .prep-section p {
              color: #374151;
              margin: 10px 0;
              font-size: 15px;
              line-height: 1.8;
              white-space: pre-wrap;
            }
            .tip-box {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border: 2px solid #93c5fd;
              padding: 24px 28px;
              border-radius: 12px;
              margin: 32px 0;
              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
            }
            .tip-box strong {
              color: #1e40af;
              font-size: 17px;
              font-weight: 700;
            }
            .tip-box p {
              color: #1e40af;
              margin: 8px 0 0 0;
              font-size: 15px;
              line-height: 1.6;
            }
            .footer {
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
              padding: 32px 40px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              margin: 0;
              line-height: 1.6;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
              font-weight: 600;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            hr {
              border: none;
              border-top: 2px solid #e5e7eb;
              margin: 28px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h1>🎯 Daily Standup Prep</h1>
                <p>${dateStr}</p>
              </div>
              
              <div class="content">
                <div class="greeting">Good Morning, ${toName}! 👋</div>
                
                <p class="intro">
                  Rise and shine! Here's your standup prep to help you confidently share your progress in tomorrow morning's meeting.
                </p>

                <div class="quote-box">
                  <p class="quote-text">"Success is the sum of small efforts repeated day in and day out."</p>
                  <p class="quote-author">— Robert Collier</p>
                </div>
                
                <div class="prep-section">
                  ${standupPrep.replace(/\*\*([^*]+)\*\*/g, '<h3>$1</h3>').replace(/\n/g, '<br>')}

                </div>
                
                <div class="tip-box">
                  <strong>💡 Pro Tip:</strong>
                  <p>Take 2 minutes to review these talking points before your standup. You've got this!</p>
                </div>
              </div>
              
              <div class="footer">
                <p>
                  <em>This email was automatically generated by Tool Hub to help you prepare for your daily standup meeting.</em>
                </p>
                <p style="margin-top: 15px;">
                  <a href="#">Tool Hub</a> · Empowering teams with better communication
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}
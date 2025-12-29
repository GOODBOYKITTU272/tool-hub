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
        const standupPrep = await generateStandupPrep(log);

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

async function generateStandupPrep(log: any): Promise<string> {
    const workType = log.work_type === 'own_tool'
        ? `Working on my own tool`
        : `Collaborated with ${log.owner?.name || 'team member'}`;

    const prompt = `📌 STANDUP REPORT GENERATION PROMPT

Role:
You are an experienced software engineer with 10 years of industry experience. You speak with the CTO every day and are expected to give clear, confident, and structured standup updates.

Task:
Prepare a detailed daily standup report based on the input data provided.

Input Data:
- Tool name: ${log.tool?.name || 'Unknown'}
- Work type: ${workType}
- Accomplishments (what was completed today): ${log.tasks_completed}
- Blockers or challenges (if any): ${log.blockers || 'None'}

Instructions:
- Use a professional but conversational tone
- Keep the language simple and clear (avoid heavy technical jargon)
- Assume the audience is the CTO, who wants clarity, not details overload
- The response should be suitable for speaking aloud
- Total speaking time should be within 3 minutes
- Focus on outcomes and progress, not step-by-step implementation
- If there are no blockers, clearly state that there are none
- Do not exaggerate or add work that was not provided in the input

Output Format (Strictly Follow This Structure):

**What I Accomplished Today:**
- Clearly explain what work was done today
- Mention the tool name naturally in the explanation
- Keep sentences short and confident
- Focus on completion and progress

**Challenges & Blockers:**
- Clearly mention any blockers or challenges
- If there are no blockers, explicitly say: "There are no blockers at the moment."

**Key Talking Points for Standup:**
- 2–4 concise points the engineer can confidently say in the meeting
- These should sound natural when spoken
- Should help the speaker stay calm and focused

Tone Example:
Calm, confident, and prepared — like someone who knows their work and is comfortable explaining it to leadership.

Goal of the Output:
Help the engineer walk into the standup meeting fully prepared, speak clearly without stress, and give the CTO exactly the information they need.`;

    // Try to use AWS Bedrock for AI-generated content
    try {
        const awsRegion = Deno.env.get('AWS_REGION') || 'us-east-1';
        const modelId = Deno.env.get('BEDROCK_MODEL_ID') || 'us.amazon.nova-lite-v1:0';

        console.log('🤖 Calling AWS Bedrock for AI standup prep');

        // Import AWS SDK v3 for Bedrock Runtime
        const { BedrockRuntimeClient, InvokeModelCommand } = await import('npm:@aws-sdk/client-bedrock-runtime@3');

        const client = new BedrockRuntimeClient({
            region: awsRegion,
            credentials: {
                accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
            }
        });

        const payload = {
            messages: [
                {
                    role: 'user',
                    content: [{ text: prompt }]
                }
            ],
            inferenceConfig: {
                maxTokens: 1000,
                temperature: 0.7,
                topP: 0.9
            }
        };

        const command = new InvokeModelCommand({
            modelId: modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload)
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        console.log('✅ Bedrock response received');

        // Extract the generated text from Nova response
        const generatedText = responseBody.output?.message?.content?.[0]?.text;

        if (generatedText) {
            console.log('🎯 Using AI-generated standup prep');
            return generatedText;
        } else {
            console.warn('⚠️ No text in Bedrock response, using fallback');
            return generateSimpleFallback(log);
        }

    } catch (error) {
        console.error('❌ AWS Bedrock error:', error.message);
        console.log('📧 Falling back to formatted template');
        return generateSimpleFallback(log);
    }
}

// Fallback function - creates nicely formatted email
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
              background-color: #f3f4f6;
              margin: 0;
              padding: 20px;
            }
            .email-wrapper {
              background-color: #f3f4f6;
              padding: 20px 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
              border-radius: 8px;
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              color: white;
              margin: 0 0 10px 0;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              color: rgba(255, 255, 255, 0.95);
              margin: 0;
              font-size: 16px;
              font-weight: 500;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 24px;
              color: #111827;
              margin-bottom: 10px;
              font-weight: 600;
            }
            .intro {
              color: #6b7280;
              margin-bottom: 30px;
              font-size: 15px;
              line-height: 1.5;
            }
            .quote-box {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-left: 4px solid #f59e0b;
              padding: 20px 25px;
              border-radius: 6px;
              margin: 30px 0;
              font-style: italic;
              color: #92400e;
            }
            .quote-text {
              font-size: 16px;
              line-height: 1.6;
              margin: 0 0 8px 0;
              font-weight: 500;
            }
            .quote-author {
              font-size: 14px;
              text-align: right;
              opacity: 0.8;
              font-weight: 600;
            }
            .prep-section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 25px;
              margin: 25px 0;
            }
            .prep-section h3 {
              color: #111827;
              margin: 0 0 15px 0;
              font-size: 16px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .prep-section p {
              color: #374151;
              margin: 8px 0;
              font-size: 15px;
              line-height: 1.7;
              white-space: pre-wrap;
            }
            .tip-box {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              padding: 20px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .tip-box strong {
              color: #1e40af;
              font-size: 15px;
            }
            .tip-box p {
              color: #1e40af;
              margin: 5px 0 0 0;
              font-size: 14px;
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              color: #9ca3af;
              font-size: 13px;
              margin: 0;
            }
            .footer a {
              color: #667eea;
              text-decoration: none;
            }
            hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 25px 0;
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

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

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

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

        if (logError) throw logError;

        // Generate AI standup prep using Gemini
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
        const standupPrep = await generateStandupPrep(log, geminiApiKey);

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

async function generateStandupPrep(log: any, apiKey: string): Promise<string> {
    const workType = log.work_type === 'own_tool'
        ? `Working on my own tool`
        : `Collaborated with ${log.owner?.name || 'team member'}`;

    const prompt = `You are an experienced software engineer with over 10 years of expertise in leading daily stand-up meetings and facilitating effective communication within technical teams. Your role is to summarize daily accomplishments and challenges in a concise manner to ensure clarity and engagement during stand-up meetings.

Your task is to prepare a detailed report for tomorrow's stand-up meeting based on the following input fields:
- Project/Tool Worked On: ${log.tool?.name || 'Unknown'}
- Work Type: ${workType}
- Tool: ${log.tool?.name || 'Unknown'}
- Accomplishments: ${log.tasks_completed}
- Blockers or Challenges: ${log.blockers || 'None'}

---

The output should be structured as a clear and informative stand-up update, divided into sections for accomplishments and blockers, ensuring it is easy to follow during the meeting.

---

In your report, focus on the specific tasks completed today, any challenges faced, and how these may impact upcoming work. Remember that you speak with your CTO daily, so maintain a professional yet conversational tone, and ensure the information is relevant and actionable for your team.

---

Avoid jargon or overly technical language that could confuse team members unfamiliar with specific details. Ensure that the update is concise, ideally fitting within a 3-minute speaking timeframe.

---

Generate the standup update in the following format:

**What I Accomplished Today:**
[List specific accomplishments]

**Challenges & Blockers:**
[List any blockers or challenges]

**Key Talking Points for Standup:**
1. [Point 1]
2. [Point 2]
3. [Point 3]`;

    const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        }
    );

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h2 { color: #2563eb; }
            h3 { color: #1e40af; margin-top: 20px; }
            .prep-content { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Good Evening, ${toName}! 👋</h2>
            <p>Here's your standup prep for tomorrow morning's meeting:</p>
            
            <div class="prep-content">
              ${standupPrep.replace(/\n/g, '<br>')}
            </div>
            
            <p><strong>💡 Tip:</strong> Review these talking points before tomorrow's standup to ensure a smooth and confident update.</p>
            
            <div class="footer">
              <p><em>This email was automatically generated by Tool Hub to help you prepare for tomorrow's standup meeting.</em></p>
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

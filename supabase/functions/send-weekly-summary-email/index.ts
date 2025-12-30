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
        // For scheduled execution, we'll fetch all users and generate weekly summaries
        const { start_date, end_date } = await req.json() || {};

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

        // Determine the date range for the week (Monday to Sunday)
        const now = new Date();
        const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
        const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday start

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysSinceMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Use provided dates if available, otherwise use calculated week
        const startDate = start_date || weekStart.toISOString().split('T')[0];
        const endDate = end_date || weekEnd.toISOString().split('T')[0];

        console.log('Fetching weekly logs for date range:', { startDate, endDate });

        // Fetch all users who have submitted logs during this week
        const { data: weeklyLogs, error: logsError } = await supabase
            .from('daily_logs')
            .select(`
                *,
                tool:tools!daily_logs_tool_id_fkey(name),
                owner:users!daily_logs_tool_owner_id_fkey(name),
                user:users!daily_logs_user_id_fkey(name, email)
            `)
            .gte('date', startDate)
            .lte('date', endDate);

        if (logsError) {
            console.error('Database error fetching weekly logs:', logsError);
            throw logsError;
        }

        if (!weeklyLogs || weeklyLogs.length === 0) {
            console.log('No logs found for the week:', { startDate, endDate });
            return new Response(
                JSON.stringify({ success: true, message: 'No logs found for the week, no emails sent' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Group logs by user
        const logsByUser = weeklyLogs.reduce((acc, log) => {
            if (!acc[log.user_id]) {
                acc[log.user_id] = [];
            }
            acc[log.user_id].push(log);
            return acc;
        }, {});

        // Process each user's weekly logs and send email
        for (const userId in logsByUser) {
            const userLogs = logsByUser[userId];
            const user = userLogs[0].user; // All logs for this user have the same user data

            try {
                // Generate weekly summary using OpenAI
                const weeklySummary = await generateWeeklySummaryWithBedrock(userLogs, supabase);

                // Send email using Resend
                const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
                await sendEmail(user.email, user.name, weeklySummary, startDate, endDate, resendApiKey);

                console.log(`Weekly summary email sent successfully to: ${user.email}`);
            } catch (emailError) {
                console.error(`Failed to send weekly email to ${user.email}:`, emailError);
                // Continue with other users
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: `Weekly summary emails sent to ${Object.keys(logsByUser).length} users` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error in weekly summary function:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function generateWeeklySummaryWithBedrock(logs: any[], supabase: any): Promise<string> {
    // Sort logs by date
    const sortedLogs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by day
    const logsByDay = sortedLogs.reduce((acc, log) => {
        if (!acc[log.date]) {
            acc[log.date] = [];
        }
        acc[log.date].push(log);
        return acc;
    }, {});

    // RACE-FRAMEWORK PROMPT for Weekly Summary + Last 5 Updates
    const prompt = `🔥 RACE-FRAMEWORK PROMPT

R — ROLE

You are a senior software engineer with 10+ years of hands-on experience working in a fast-moving startup environment.
- You report directly to the CTO
- You are expected to show continuity, ownership, and clarity
- You speak confidently but simply
- You never exaggerate
- You explain progress like someone who understands the system end-to-end

A — ACTION (WHAT YOU MUST DO)

Generate a Weekly Summary Report that combines:
1. High-level weekly overview (for leadership visibility)
2. Daily work breakdown (factual, concise)
3. A spoken "last ${Object.keys(logsByDay).length} submitted updates" standup narrative
   → exactly how the engineer would explain progress in a CTO meeting

This is not documentation. This is communication for decision-makers.

C — CONTEXT (INPUT DATA)

Weekly Log Data:
- Total days with logs: ${Object.keys(logsByDay).length}
- Total tasks completed: ${sortedLogs.reduce((count, log) => count + log.tasks_completed.split('\n').filter(t => t.trim()).length, 0)}
- Tools worked on: ${Array.from(new Set(sortedLogs.map(log => log.tool?.name || 'Unknown'))).join(', ')}

Last ${Object.keys(logsByDay).length} Daily Updates:
${Object.entries(logsByDay).map(([date, dayLogs], index) => {
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        return `${index + 1}. ${dayName}, ${date}:
${(dayLogs as any[]).map(log => {
            const collaboration = log.work_type === 'own_tool'
                ? `Working on own tool: ${log.tool?.name || 'Unknown'}`
                : `Collaboration: Worked with ${log.owner?.name || 'team member'}`;
            return `   Tool: ${log.tool?.name || 'Unknown'}
   ${collaboration}
   Work Done: ${log.tasks_completed}
   Blocker: ${log.blockers || 'None'}${log.collaboration_notes ? `\n   Notes: ${log.collaboration_notes}` : ''}`;
        }).join('\n\n')}`;
    }).join('\n\n')}

⚠️ Do not assume anything beyond the provided input.

E — EXPECTATION (OUTPUT REQUIREMENTS)

1️⃣ Weekly Summary Report (Structured, Clear)

## 1. Progress Over the Last Few Days

Summarize progress across days, not day-by-day:
- Explain how work moved from incomplete → stable, unclear → clear
- Mention the tool name(s) naturally
- Highlight what is now complete or reliable

Example tone:
"Over the last few days, I've been working on the ${sortedLogs[0]?.tool?.name || 'project'} tool. I completed the core functionality, cleaned up the data handling, and stabilized the implementation through testing."

## 2. Ongoing Challenges or Blockers

Call out blockers that appeared more than once. Be direct and honest.
If no blockers exist, say exactly: "There are no ongoing blockers at the moment."
No extra justification.

## 3. Key Talking Points

Provide 3–5 short bullets that:
- Reflect continuity
- Are easy to remember
- Sound natural when spoken

Example:
• Core functionality completed
• Data handling cleaned up and tested
• End-to-end testing blocked by authentication issue
• Everything else stable

## 4. What's Next

Based on progress made, what are the logical next steps?
Do NOT invent plans. Base it strictly on current progress.

🚫 HARD RULES (VERY IMPORTANT)

- Use simple, confident English
- No jargon unless unavoidable
- No greetings or filler sentences
- No future promises unless directly implied by progress
- No exaggeration
- Focus on progress over time, not task lists
- Show continuity and ownership

🎯 FINAL GOAL

After reading the output once, the engineer should be able to:
- Confidently explain the entire week
- Speak clearly in a CTO meeting
- Answer follow-up questions without panic
- Show ownership and continuity`;

    try {
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        if (!openaiApiKey) {
            console.log('OpenAI API key not found, using fallback summary');
            return generateSimpleFallback(logs);
        }

        console.log('🤖 Calling OpenAI for weekly summary');

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a professional technical writer helping engineers prepare weekly standup summaries.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            console.error('OpenAI request failed:', response.status, await response.text());
            return generateSimpleFallback(logs);
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (generatedText) {
            console.log('🎯 Using AI-generated weekly summary');

            // Log usage to database
            try {
                const usage = data.usage;
                if (usage) {
                    const inputTokens = usage.prompt_tokens || 0;
                    const outputTokens = usage.completion_tokens || 0;
                    const totalTokens = usage.total_tokens || 0;
                    const estimatedCost = (inputTokens * 0.0000015) + (outputTokens * 0.000002);

                    const userId = logs.length > 0 ? logs[0].user_id : null;

                    await supabase
                        .from('openai_usage')
                        .insert({
                            feature: 'weekly-email',
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

            return generatedText.trim();
        } else {
            console.warn('⚠️ No text in OpenAI response, using fallback');
            return generateSimpleFallback(logs);
        }
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return generateSimpleFallback(logs);
    }
}

function getMostActiveDay(logsByDay: any): string {
    let mostActiveDay = '';
    let maxLogs = 0;

    for (const date in logsByDay) {
        if (logsByDay[date].length > maxLogs) {
            maxLogs = logsByDay[date].length;
            mostActiveDay = date;
        }
    }

    if (mostActiveDay) {
        const dateObj = new Date(mostActiveDay);
        return `${dateObj.toLocaleDateString('en-US', { weekday: 'long' })}, ${mostActiveDay}`;
    }

    return 'No activity';
}

function getMostWorkedTool(logs: any[]): string {
    const toolCounts: { [key: string]: number } = {};

    for (const log of logs) {
        const toolName = log.tool?.name || 'Unknown';
        toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
    }

    let mostWorkedTool = '';
    let maxCount = 0;

    for (const tool in toolCounts) {
        if (toolCounts[tool] > maxCount) {
            maxCount = toolCounts[tool];
            mostWorkedTool = tool;
        }
    }

    return mostWorkedTool || 'No tools';
}

function getRecurringBlockers(logs: any[]): string | null {
    const blockerCounts: { [key: string]: number } = {};

    for (const log of logs) {
        if (log.blockers) {
            const blockers = log.blockers.split('\n').filter(b => b.trim());
            for (const blocker of blockers) {
                const cleanBlocker = blocker.trim().toLowerCase();
                if (cleanBlocker) {
                    blockerCounts[cleanBlocker] = (blockerCounts[cleanBlocker] || 0) + 1;
                }
            }
        }
    }

    // Return blockers that appear more than once
    const recurringBlockers = Object.entries(blockerCounts)
        .filter(([blocker, count]) => count > 1)
        .map(([blocker, count]) => blocker);

    return recurringBlockers.length > 0 ? recurringBlockers.join(', ') : null;
}

// Fallback function that generates a narrative summary without AI
function generateSimpleFallback(logs: any[]): string {
    const sortedLogs = logs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const logsByDay = sortedLogs.reduce((acc, log) => {
        if (!acc[log.date]) acc[log.date] = [];
        acc[log.date].push(log);
        return acc;
    }, {});

    const tools = Array.from(new Set(sortedLogs.map(log => log.tool?.name || 'Unknown')));
    const toolName = tools.length === 1 ? tools[0] : tools.join(' and ');
    const numDays = Object.keys(logsByDay).length;
    const allTasks = sortedLogs.map(log => log.tasks_completed).filter(t => t);
    const allBlockers = sortedLogs.map(log => log.blockers).filter(b => b);
    const recurringBlockers = getRecurringBlockers(sortedLogs);

    let summary = `## 1. Progress Over the Last Few Days\\n\\n`;
    summary += `Over the last ${numDays} day${numDays > 1 ? 's' : ''}, I've been working on ${toolName}. `;

    const collaborations = sortedLogs.filter(log => log.work_type !== 'own_tool');
    if (collaborations.length > 0) {
        const collaborators = Array.from(new Set(collaborations.map(log => log.owner?.name).filter(n => n)));
        if (collaborators.length > 0) {
            summary += `I collaborated with ${collaborators.join(' and ')} on this work. `;
        }
    }

    if (allTasks.length > 0) {
        const firstTask = sortedLogs[0].tasks_completed;
        summary += `I focused on ${firstTask.split('\\n')[0].toLowerCase()}`;
        if (allTasks.length > 1) summary += ` and made progress across multiple areas`;
        summary += `. `;
    }

    if (numDays > 1) {
        summary += `The work has progressed steadily over these ${numDays} days. `;
    }

    summary += `\\n\\n## 2. Ongoing Challenges or Blockers\\n\\n`;

    if (allBlockers.length > 0) {
        if (recurringBlockers) {
            summary += `There have been some recurring issues: ${recurringBlockers}. `;
        } else {
            summary += `${allBlockers[0]} `;
        }
    } else {
        summary += `There are no ongoing blockers at the moment.`;
    }

    summary += `\\n\\n## 3. Key Talking Points\\n\\n`;
    summary += `- Worked on ${toolName}${collaborations.length > 0 ? ` with team collaboration` : ''}\\n`;
    if (allTasks.length > 0) summary += `- Completed: ${sortedLogs[0].tasks_completed.split('\\n')[0]}\\n`;
    if (allBlockers.length > 0) {
        summary += `- Blocked on: ${allBlockers[0].split('\\n')[0]}\\n`;
    } else {
        summary += `- No blockers, on track\\n`;
    }
    if (numDays > 1) summary += `- Progress made across ${numDays} days\\n`;

    summary += `\\n## 4. What's Next\\n\\n`;

    if (allBlockers.length > 0) {
        summary += `Address the identified blockers and continue progress on ${toolName}.`;
    } else {
        summary += `Continue building on the current progress with ${toolName}.`;
    }

    return summary;
}


async function sendEmail(
    toEmail: string,
    toName: string,
    weeklySummary: string,
    startDate: string,
    endDate: string,
    apiKey: string
): Promise<void> {
    // Format the start and end dates for display
    const startFormatted = new Date(startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const endFormatted = new Date(endDate).toLocaleDateString('en-US', {
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
            subject: `📊 Weekly Summary Report - ${startFormatted} to ${endFormatted}`,
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
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              padding: 48px 40px;
              text-align: center;
              color: white;
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
              margin: 0;
              font-size: 18px;
              opacity: 0.95;
              position: relative;
              font-weight: 500;
            }
            .content {
              padding: 48px 40px;
            }
            .summary-stats {
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              border-radius: 12px;
              padding: 28px 32px;
              margin-bottom: 32px;
              border-left: 4px solid #4f46e5;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .summary-stats:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
            }
            .summary-stats h3 {
              margin: 0 0 16px 0;
              color: #4f46e5;
              font-size: 20px;
              font-weight: 700;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 12px;
            }
            .day-section {
              margin-bottom: 28px;
              padding-bottom: 28px;
              border-bottom: 2px solid #e5e7eb;
            }
            .day-section:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .day-header {
              font-size: 20px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e2e8f0;
              background: linear-gradient(135deg, #4f46e5, #7c3aed);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .task-item {
              margin-bottom: 12px;
              padding-left: 20px;
              border-left: 3px solid #cbd5e1;
              line-height: 1.7;
            }
            .blocker-item {
              background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
              border-left: 4px solid #ef4444;
              padding: 16px 20px;
              margin: 12px 0;
              border-radius: 8px;
              box-shadow: 0 2px 6px rgba(239, 68, 68, 0.1);
            }
            .insights {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border-radius: 12px;
              padding: 28px 32px;
              margin: 32px 0;
              border-left: 4px solid #0ea5e9;
              box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .insights:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(14, 165, 233, 0.15);
            }
            .insights h3 {
              margin: 0 0 16px 0;
              color: #0ea5e9;
              font-size: 20px;
              font-weight: 700;
              border-bottom: 2px solid rgba(14, 165, 233, 0.2);
              padding-bottom: 12px;
            }
            .preview {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border-radius: 12px;
              padding: 28px 32px;
              margin: 32px 0;
              border-left: 4px solid #10b981;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .preview:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 16px rgba(16, 185, 129, 0.15);
            }
            .preview h3 {
              margin: 0 0 16px 0;
              color: #10b981;
              font-size: 20px;
              font-weight: 700;
              border-bottom: 2px solid rgba(16, 185, 129, 0.2);
              padding-bottom: 12px;
            }
            .footer {
              text-align: center;
              padding: 32px 40px;
              color: #6b7280;
              font-size: 14px;
              border-top: 2px solid #e5e7eb;
              background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            }
            .footer p {
              margin: 0;
              line-height: 1.6;
            }
            .footer a {
              color: #4f46e5;
              text-decoration: none;
              font-weight: 600;
            }
            .footer a:hover {
              text-decoration: underline;
            }
            br {
              line-height: 1.8;
            }
            strong {
              font-weight: 700;
              color: #111827;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h1>📊 Weekly Summary Report</h1>
                <p>${startFormatted} to ${endFormatted}</p>
              </div>
              
              <div class="content">
                ${weeklySummary
                    .replace(/## 1\. Progress Over the Last Few Days/g, '<div class="summary-stats"><h3>📈 Progress Over the Last Few Days</h3>')
                    .replace(/## 2\. Ongoing Challenges or Blockers/g, '</div><div class="insights"><h3>⚠️ Ongoing Challenges or Blockers</h3>')
                    .replace(/## 3\. Key Talking Points/g, '</div><div class="preview"><h3>🎙️ Key Talking Points</h3>')
                    .replace(/## 4\. What\'s Next/g, '</div><div class="insights" style="border-left-color: #10b981; background: #f0fdf4;"><h3>🔮 What\'s Next</h3>')
                    .replace(/\n\n/g, '<br><br>')
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/• /g, '<br>• ')
                + '</div>'}
              </div>
              
              <div class="footer">
                <p>Sent by ToolHub Weekly Summary System</p>
                <p>This email was automatically generated based on your daily journal entries</p>
              </div>
            </div>
          </div>
        </body>
        </html>`
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
    }
}
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        // Initialize Resend client
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

        // Get request body
        const { toolId, toolName, toolDescription, ownerName, ownerEmail } = await req.json()

        if (!toolId || !toolName || !ownerName) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Fetch all admin users
        const { data: adminUsers, error: adminError } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .eq('role', 'Admin')

        if (adminError) {
            console.error('Error fetching admins:', adminError)
            return new Response(JSON.stringify({ error: 'Failed to fetch admin users' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        if (!adminUsers || adminUsers.length === 0) {
            return new Response(JSON.stringify({ message: 'No admins found to notify' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Email template for admin notification
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Tool Awaiting Approval</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🔔 New Tool Awaiting Approval</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Hi Admin,
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                <strong>${ownerName}</strong> has submitted a new tool for your review and approval.
                            </p>
                            
                            <!-- Tool Details Card -->
                            <div style="background-color: #f9fafb; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <h2 style="margin: 0 0 12px; font-size: 20px; color: #1f2937;">${toolName}</h2>
                                <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                                    <strong>Submitted by:</strong> ${ownerName} (${ownerEmail})
                                </p>
                                ${toolDescription ? `
                                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 20px;">
                                    <strong>Description:</strong><br>
                                    ${toolDescription}
                                </p>
                                ` : ''}
                            </div>
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Please review this tool and take action in the admin panel.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${Deno.env.get('APP_URL') || 'http://localhost:8080'}/pending-tools" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Review Pending Tools
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0; font-size: 12px; color: #999999;">
                                © ${new Date().getFullYear()} Tool Hub. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `

        // Send emails to all admins
        const emailPromises = adminUsers.map(async (admin) => {
            try {
                const result = await resend.emails.send({
                    from: 'Tool Hub <support@applywizzae.in>',
                    to: admin.email,
                    subject: `New Tool Awaiting Approval: ${toolName}`,
                    html: emailHtml,
                })
                console.log(`Email sent to ${admin.email}:`, result)
                return { admin: admin.email, success: true, result }
            } catch (error: any) {
                console.error(`Failed to send email to ${admin.email}:`, error)
                return { admin: admin.email, success: false, error: error.message }
            }
        })

        const results = await Promise.all(emailPromises)
        const successCount = results.filter(r => r.success).length

        return new Response(JSON.stringify({
            message: `Notified ${successCount} out of ${adminUsers.length} admins`,
            results: results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Error in notify-tool-submission:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

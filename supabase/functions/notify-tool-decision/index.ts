import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        // Initialize Resend client
        const resend = new Resend(Deno.env.get('RESEND_API_KEY') ?? '')

        // Get request body
        const { toolId, toolName, decision, ownerEmail, ownerName, rejectionReason } = await req.json()

        if (!toolId || !toolName || !decision || !ownerEmail || !ownerName) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        if (decision !== 'approved' && decision !== 'rejected') {
            return new Response(JSON.stringify({ error: 'Decision must be either "approved" or "rejected"' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Email template for approval
        const approvalEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tool Approved!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🎉 Your Tool Has Been Approved!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Hi <strong>${ownerName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Great news! Your tool <strong>"${toolName}"</strong> has been reviewed and approved by an administrator.
                            </p>
                            
                            <!-- Success Icon -->
                            <div style="text-align: center; margin: 30px 0;">
                                <div style="display: inline-block; width: 80px; height: 80px; background-color: #d1fae5; border-radius: 50%; padding: 20px;">
                                    <svg style="width: 80px; height: 80px;" fill="#10b981" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                            </div>
                            
                            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0; font-size: 14px; color: #065f46; line-height: 20px;">
                                    <strong>Your tool is now live!</strong><br>
                                    All users can now discover and access "${toolName}" in the Tool Hub.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${Deno.env.get('APP_URL') || 'http://localhost:8080'}/tools" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            View Your Tool
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

        // Email template for rejection
        const rejectionEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update on Your Tool Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Update on Your Tool Submission</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Hi <strong>${ownerName}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Thank you for submitting <strong>"${toolName}"</strong> to Tool Hub. After review, the administrator has decided not to approve this tool at this time.
                            </p>
                            
                            ${rejectionReason ? `
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                                <p style="margin: 0 0 8px; font-size: 14px; color: #92400e; font-weight: 600;">
                                    Feedback from Administrator:
                                </p>
                                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 20px;">
                                    ${rejectionReason}
                                </p>
                            </div>
                            ` : ''}
                            
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Don't worry! You can make the necessary updates and resubmit your tool for review.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${Deno.env.get('APP_URL') || 'http://localhost:8080'}/tools" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            View Your Tools
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #6b7280; border-top: 1px solid #eeeeee; padding-top: 20px;">
                                If you have any questions, please reach out to your administrator.
                            </p>
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

        // Choose the appropriate email template and subject
        const emailHtml = decision === 'approved' ? approvalEmailHtml : rejectionEmailHtml
        const subject = decision === 'approved'
            ? `Your Tool "${toolName}" Has Been Approved! 🎉`
            : `Update on Your Tool "${toolName}"`

        // Send email to the tool owner
        try {
            const result = await resend.emails.send({
                from: 'Tool Hub <support@applywizzae.in>',
                to: ownerEmail,
                subject: subject,
                html: emailHtml,
            })

            console.log(`Email sent to ${ownerEmail}:`, result)

            return new Response(JSON.stringify({
                message: `Notification email sent to ${ownerEmail}`,
                result: result
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } catch (error: any) {
            console.error(`Failed to send email to ${ownerEmail}:`, error)
            return new Response(JSON.stringify({
                error: 'Failed to send email',
                details: error.message
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

    } catch (error: any) {
        console.error('Error in notify-tool-decision:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

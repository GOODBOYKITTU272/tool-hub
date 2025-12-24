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
        // 1. Initialize Supabase Client with Service Role Key
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

        // 2. Get the requester's JWT and verify they are an Admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // Check if the user is an Admin in the public.users table
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        // Debug logging
        console.log('User ID:', user.id)
        console.log('Profile Query Result:', profile)
        console.log('Profile Query Error:', profileError)

        if (profileError || profile?.role !== 'Admin') {
            console.log('Authorization failed - profileError:', profileError?.message, 'role:', profile?.role)
            return new Response(JSON.stringify({
                error: 'Unauthorized: Admin access required',
                debug: {
                    hasProfileError: !!profileError,
                    profileErrorMessage: profileError?.message,
                    profileRole: profile?.role
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // 3. Process the invitation request
        const { email, name, role } = await req.json()

        if (!email || !name || !role) {
            return new Response(JSON.stringify({ error: 'Missing required fields: email, name, role' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Create user with Supabase Auth (without sending email)
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                full_name: name,
                role: role,
                name: name
            },
        })

        if (inviteError) {
            return new Response(JSON.stringify({ error: inviteError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Upsert the profile to ensure role is correct
        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: inviteData.user.id,
                email: email,
                name: name,
                role: role,
                must_change_password: true // User needs to set password
            })

        if (upsertError) {
            console.error('Profile upsert error:', upsertError.message)
        }

        // Generate password reset link
        const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
        })

        if (resetError) {
            console.error('Password reset link generation error:', resetError.message)
            return new Response(JSON.stringify({ error: 'Failed to generate password reset link' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        // Send invitation email via Resend
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're Invited to Tool Hub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Tool Hub</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                Hi <strong>${name}</strong>,
                            </p>
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #333333;">
                                You've been invited to join <strong>Tool Hub</strong> as a <strong>${role}</strong>. 
                                Click the button below to set up your password and get started.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetData.properties.action_link}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                                            Set Up Your Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 20px; font-size: 14px; line-height: 20px; color: #666666;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 20px; font-size: 14px; line-height: 20px; color: #667eea; word-break: break-all;">
                                ${resetData.properties.action_link}
                            </p>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #999999; border-top: 1px solid #eeeeee; padding-top: 20px;">
                                This invitation link will expire in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
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

        try {
            const emailResult = await resend.emails.send({
                from: 'Tool Hub <onboarding@resend.dev>',
                to: email,
                subject: `You're invited to join Tool Hub as ${role}`,
                html: emailHtml,
            })

            console.log('Email sent successfully:', emailResult)
        } catch (emailError: any) {
            console.error('Resend email error:', emailError)
            return new Response(JSON.stringify({
                error: 'User created but failed to send invitation email',
                details: emailError.message
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        return new Response(JSON.stringify({
            message: 'User invited successfully and email sent via Resend',
            user: inviteData.user
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})

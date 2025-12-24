import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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

        if (profileError || profile?.role !== 'Admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
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

        // Invite the user via Supabase Auth Admin API
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                full_name: name,
                role: role,
                name: name // for compatibility
            },
        })

        if (inviteError) {
            return new Response(JSON.stringify({ error: inviteError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // Note: The public.users profile will be created automatically by the 'on_auth_user_created' 
        // trigger in our supabase-schema.sql when the user accepts the invite (or upon creation depending on config).
        // However, to ensure details like Role are set correctly, we'll manually upsert the profile.

        // Attempt to upsert the profile to ensure role is correct
        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: inviteData.user.id,
                email: email,
                name: name,
                role: role,
                must_change_password: false // Invitations handle their own flow
            })

        if (upsertError) {
            console.error('Profile upsert error:', upsertError.message)
            // We don't fail the whole request since the Auth user WAS created
        }

        return new Response(JSON.stringify({ message: 'User invited successfully', user: inviteData.user }), {
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

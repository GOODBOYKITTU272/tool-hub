// Test script to verify Resend integration
// This script will test if the invite-user Edge Function can successfully send emails

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eeqiifpbpurvidvhpanu.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testResendIntegration() {
    console.log('🧪 Testing Resend Integration...\n')

    // Test 1: Check if Edge Function is accessible
    console.log('1️⃣ Checking Edge Function accessibility...')
    try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            console.log('❌ Not logged in. Please log in as Admin first.')
            console.log('   Run: npm run dev')
            console.log('   Then log in to the application as Admin')
            return
        }

        console.log('✅ Logged in as:', session.user.email)

        // Test 2: Check user role
        console.log('\n2️⃣ Checking user role...')
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profileError || profile?.role !== 'Admin') {
            console.log('❌ Current user is not an Admin')
            console.log('   Current role:', profile?.role)
            return
        }

        console.log('✅ User is Admin')

        // Test 3: Attempt to invite a test user
        console.log('\n3️⃣ Testing invitation email...')
        console.log('   This will send a test invitation to: test@example.com')
        console.log('   (You can change this email in the script)')

        const testEmail = 'chandaramakrishna2013@gmail.com' // Change this to your test email
        const testName = 'Test User'
        const testRole = 'Observer'

        const { data, error } = await supabase.functions.invoke('invite-user', {
            body: {
                email: testEmail,
                name: testName,
                role: testRole
            }
        })

        if (error) {
            console.log('❌ Error invoking Edge Function:', error)
            return
        }

        console.log('✅ Edge Function invoked successfully!')
        console.log('   Response:', data)

        console.log('\n📧 Check the following:')
        console.log('   1. Email inbox:', testEmail)
        console.log('   2. Resend dashboard: https://resend.com/emails')
        console.log('   3. Supabase logs: https://supabase.com/dashboard/project/eeqiifpbpurvidvhpanu/logs')

    } catch (err) {
        console.log('❌ Unexpected error:', err)
    }
}

// Run the test
testResendIntegration()

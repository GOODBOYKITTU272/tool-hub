import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeqiifpbpurvidvhpanu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzAsImV4cCI6MjA4MTEyNTUzMH0.HqfP-EPrI7S1E3H9O94X5i5lT1Vv6vH9iO077mU_AWI'; // Need to get this from common site usage or .env if possible

async function testLogin() {
    console.log('🔑 Testing login for: ramakrishna@applywizz.com');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'ramakrishna@applywizz.com',
        password: 'Applywizz@2026'
    });

    if (error) {
        console.error('❌ Login Error:', error.message);
    } else {
        console.log('✅ Login Successful! User ID:', data.user.id);

        // Try to fetch profile
        console.log('🔍 Attempting to fetch profile as the user...');
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error('❌ Profile Error:', profileError.message, profileError.code);
        } else {
            console.log('✅ Profile Found:', profile);
        }
    }
}

testLogin();

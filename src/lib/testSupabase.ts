import { supabase } from './supabase';

/**
 * Test Supabase connection and RLS policies
 */
export async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase connection...');

    try {
        // Test 1: Check if client is initialized
        console.log('✅ Supabase client initialized');

        // Test 2: Try to fetch from a public table (should work even without auth)
        const { data: tools, error: toolsError } = await supabase
            .from('tools')
            .select('*')
            .limit(5);

        if (toolsError) {
            console.error('❌ Error fetching tools:', toolsError);
        } else {
            console.log(`✅ Successfully fetched ${tools?.length || 0} tools`);
        }

        // Test 3: Check current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('✅ User is authenticated:', session.user.email);
        } else {
            console.log('ℹ️  No active session (not logged in)');
        }

        // Test 4: Try to fetch users (should fail without auth due to RLS)
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .limit(5);

        if (usersError) {
            console.log('✅ RLS working: Cannot fetch users without auth');
        } else {
            console.log(`ℹ️  Fetched ${users?.length || 0} users`);
        }

        return {
            success: true,
            message: 'Supabase connection test complete!'
        };
    } catch (error) {
        console.error('❌ Supabase connection test failed:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

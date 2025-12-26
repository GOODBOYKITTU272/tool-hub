#!/usr/bin/env node
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking User Roles and Permissions...\n');

async function checkUserRoles() {
    try {
        // Prompt for user email
        const email = process.argv[2];

        if (!email) {
            console.log('Usage: node verify-user-role.mjs <email>');
            console.log('Example: node verify-user-role.mjs ramakrishna@applywizz\n');

            // List all users instead
            console.log('📋 Fetching all users from database...\n');
            const { data: users, error } = await supabase
                .from('users')
                .select('id, email, name, role, must_change_password, created_at')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching users:', error.message);
                console.error('Full error:', error);
                return;
            }

            if (!users || users.length === 0) {
                console.log('⚠️  No users found in the database.');
                return;
            }

            console.log(`✅ Found ${users.length} user(s):\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email})`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Must Change Password: ${user.must_change_password}`);
                console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
                console.log('');
            });

            console.log('\n💡 To check a specific user, run:');
            console.log('   node verify-user-role.mjs <email>\n');
            return;
        }

        // Check specific user
        console.log(`🔍 Looking for user: ${email}\n`);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                console.error(`❌ User not found: ${email}`);
                console.error('   This user does not exist in the public.users table.');
            } else {
                console.error('❌ Error fetching user:', error.message);
                console.error('Full error:', error);
            }
            return;
        }

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return;
        }

        console.log('✅ User found!\n');
        console.log('User Details:');
        console.log('─────────────────────────────────────');
        console.log(`Name:                  ${user.name}`);
        console.log(`Email:                 ${user.email}`);
        console.log(`Role:                  ${user.role}`);
        console.log(`Must Change Password:  ${user.must_change_password}`);
        console.log(`User ID:               ${user.id}`);
        console.log(`Created:               ${new Date(user.created_at).toLocaleString()}`);
        console.log(`Updated:               ${new Date(user.updated_at).toLocaleString()}`);
        console.log('─────────────────────────────────────\n');

        // Check permissions
        console.log('🔐 Permission Analysis:');
        console.log('─────────────────────────────────────');

        if (user.role === 'Admin') {
            console.log('✅ Can create tools (Admin)');
            console.log('✅ Can approve tools');
            console.log('✅ Can view all tools');
            console.log('✅ Can manage all users');
        } else if (user.role === 'Owner') {
            console.log('✅ Can create tools (Owner)');
            console.log('⚠️  Cannot approve tools (Admin only)');
            console.log('✅ Can view own tools + approved tools');
            console.log('⚠️  Cannot manage users (Admin only)');
        } else if (user.role === 'Observer') {
            console.log('❌ Cannot create tools (Observer role)');
            console.log('❌ Cannot approve tools');
            console.log('✅ Can view approved tools only');
            console.log('❌ Cannot manage users');
            console.log('\n⚠️  TO FIX: Update user role to "Owner" or "Admin" to allow tool creation.');
        }
        console.log('─────────────────────────────────────\n');

        // Check RLS policies
        console.log('🛡️  Checking RLS Policies on tools table...\n');

        const { data: policies, error: policyError } = await supabase
            .rpc('pg_policies')
            .select('*')
            .eq('tablename', 'tools');

        if (policyError) {
            console.log('⚠️  Could not check RLS policies (this is normal - requires admin access)');
        } else if (policies) {
            console.log(`✅ Found ${policies.length} RLS policies on tools table`);
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

checkUserRoles();

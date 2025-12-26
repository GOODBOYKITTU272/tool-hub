import { createClient } from '@supabase/supabase-js';

// Get from .env.local
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTools() {
    console.log('\n🔍 Checking tools in database...\n');

    // Fetch all tools
    const { data: tools, error } = await supabase
        .from('tools')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching tools:', error);
        return;
    }

    console.log(`📊 Total tools in database: ${tools?.length || 0}\n`);

    if (tools && tools.length > 0) {
        tools.forEach((tool, index) => {
            console.log(`Tool #${index + 1}:`);
            console.log(`  Name: ${tool.name}`);
            console.log(`  Status: ${tool.approval_status}`);
            console.log(`  Owner ID: ${tool.owner_id}`);
            console.log(`  Created By: ${tool.created_by}`);
            console.log(`  Created At: ${new Date(tool.created_at).toLocaleString()}`);
            console.log('');
        });
    } else {
        console.log('✹ No tools found in database');
    }

    // Also check current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        console.log('\n👤 Current logged-in user:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
    }
}

checkTools();

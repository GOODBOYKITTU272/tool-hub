import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserRole() {
    console.log('Checking user role for ramakrishna@applywizz.com...\n');

    // Check if user exists in users table
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'ramakrishna@applywizz.com');

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (users && users.length > 0) {
        console.log('User found in database:');
        console.log(JSON.stringify(users[0], null, 2));
    } else {
        console.log('User NOT found in database!');
    }
}

checkUserRole();

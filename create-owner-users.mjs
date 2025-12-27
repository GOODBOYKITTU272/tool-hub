import { createClient } from '@supabase/supabase-js';

// Get these from environment variables (loaded by PowerShell)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables in .env.local!');
    console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const users = [
    { name: 'Nikhil', email: 'nikhil@applywizz.com' },
    { name: 'Vivek', email: 'vivek@applywizz.com' },
    { name: 'Bhanuteja', email: 'bhanuteja@applywizz.com' },
    { name: 'Ganesh', email: 'ganesh@applywizz.com' },
    { name: 'Nithin', email: 'nithin@applywizz.com' },
    { name: 'Harshitha', email: 'harshitha@applywizz.com' },
    { name: 'Dinesh', email: 'dinesh@applywizz.com' }
];

const password = 'Applywizz@2026';

async function createOwnerUsers() {
    console.log('🚀 Creating 7 Owner users...\n');
    let success = 0, errors = 0, skipped = 0;

    for (const user of users) {
        try {
            console.log(`[${success + errors + skipped + 1}/7] ${user.name} (${user.email})`);

            const { data, error } = await supabase.auth.admin.createUser({
                email: user.email,
                password,
                email_confirm: true,
                user_metadata: { name: user.name }
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    console.log('  ⏩ Already exists');
                    skipped++;
                    continue;
                }
                throw error;
            }

            await supabase.from('users').insert({
                id: data.user.id,
                email: user.email,
                name: user.name,
                role: 'Owner',
                must_change_password: false
            });

            console.log('  ✅ Created');
            success++;
        } catch (err) {
            console.log(`  ❌ ${err.message}`);
            errors++;
        }
    }

    console.log(`\n📊 Results: ✅ ${success} | ⏩ ${skipped} | ❌ ${errors}`);
}

createOwnerUsers().catch(console.error);

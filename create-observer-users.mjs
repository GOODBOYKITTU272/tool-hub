// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

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
    { name: 'K. Bhavya', email: 'bhavya@applywizz.com' },
    { name: 'M Pooja', email: 'pooja@applywizz.com' },
    { name: 'N.Sahithi', email: 'sahithi@applywizz.com' },
    { name: 'T.Deekshitha', email: 'deekshitha@applywizz.com' },
    { name: 'vyshnavi', email: 'vyshnavi.oram@applywizz.com' },
    { name: 'CH. Sowmya', email: 'sowmya@applywizz.com' },
    { name: 'M Akshay', email: 'akshay@applywizz.com' },
    { name: 'G dayakar', email: 'dayakar@applywizz.com' },
    { name: 'M.Harika', email: 'harika@applywizz.com' },
    { name: 'M.Sai prasanna', email: 'saiprasanna@applywizz.com' },
    { name: 'Ch. Ramadevi(TL)', email: 'ramadevi@applywizz.com' },
    { name: 'Rachana Merugu', email: 'rachana@applywizz.com' },
    { name: 'Bhavana Ajja', email: 'bhavana@applywizz.com' },
    { name: 'Aparna Mandala', email: 'aparna@applywizz.com' },
    { name: 'M.Krishnavamshi', email: 'krishnavamshi@applywizz.com' },
    { name: 'Kavya Midde', email: 'kavya@applywizz.com' },
    { name: 'Shivani Pentham', email: 'shivani@applywizz.com' },
    { name: 'Chennoju Sreeja', email: 'sreeja@applywizz.com' },
    { name: 'RamyaSri Kuncham', email: 'ramyasri@applywizz.com' },
    { name: 'Manasa Japa', email: 'manasa@applywizz.com' },
    { name: 'Shaik Ali', email: 'ali@applywizz.com' },
    { name: 'Sarika Reddy (TL)', email: 'sarika@applywizz.com' },
    { name: 'Pravalika', email: 'pravalika@applywizz.com' },
    { name: 'Vinoda', email: 'vinoda@applywizz.com' },
    { name: 'Ruchitha', email: 'ruchitha@applywizz.com' },
    { name: 'Pavan Kumar', email: 'pavankumar@applywizz.com' },
    { name: 'Meenakshi', email: 'meenakshi@applywizz.com' },
    { name: 'Maneesha', email: 'maneesha@applywizz.com' },
    { name: 'Navya', email: 'navya@applywizz.com' },
    { name: 'Shruthi Kemmasaram', email: 'shruthi@applywizz.com' },
    { name: 'Shruthi Sherupally', email: 'shruthisherupally@applywizz.com' },
    { name: 'Supriya', email: 'supriya@applywizz.com' },
    { name: 'Srujana', email: 'srujana@applywizz.com' },
    { name: 'Ashwitha', email: 'ashwitha@applywizz.com' },
    { name: 'shivani kola', email: 'kolashivani@applywizz.com' },
    { name: 'Sana', email: 'sana@applywizz.com' },
    { name: 'Prathyusha', email: 'prathyusha@applywizz.com' },
    { name: 'Saipreethi', email: 'saipreethi@applywizz.com' },
    { name: 'Akhila', email: 'akhila@applywizz.com' },
    { name: 'Shravani', email: 'shravani@applywizz.com' },
    { name: 'Sai pavan', email: 'saipavan@applywizz.com' },
    { name: 'Rakesh', email: 'rakesh@applywizz.com' },
    { name: 'Vidhya', email: 'vidhya@applywizz.com' },
    { name: 'D.Nimsha(T,L)', email: 'dhakella@applywizz.com' }
];

const password = 'Applywizz@2026';

async function createUsers() {
    console.log('🚀 Creating 44 Observer users...\n');
    let success = 0, errors = 0, skipped = 0;

    for (const user of users) {
        try {
            console.log(`[${success + errors + skipped + 1}/44] ${user.name} (${user.email})`);

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
                role: 'Observer',
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

createUsers().catch(console.error);

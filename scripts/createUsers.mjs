// Bulk User Creation Script for Supabase
// This script creates all 117 Applywizz users via Supabase Admin API

import { createClient } from '@supabase/supabase-js';

// Supabase Admin credentials (use service_role key, NOT anon key)
const supabaseUrl = 'https://eeqiifpbpurvidvhpanu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU0OTUzMSwiZXhwIjoyMDgxMTI1NTMxfQ.aiyhmWgHnBiv9fV6psbeY0BWwRLOvs_-2hOdiJNiaJU'; // Get from Supabase Dashboard → Settings → API

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// All 117 users with roles
const users = [
    // Admin (1)
    { email: 'ramakrishna@applywizz.com', name: 'Rama Krishna', role: 'Admin' },

    // Owners (8)
    { email: 'vivek@applywizz.com', name: 'Vivek', role: 'Owner' },
    { email: 'nikhil@applywizz.com', name: 'Nikhil', role: 'Owner' },
    { email: 'bhanuteja@applywizz.com', name: 'Bhanu Teja', role: 'Owner' },
    { email: 'dinesh@applywizz.com', name: 'Dinesh', role: 'Owner' },
    { email: 'ganesh@applywizz.com', name: 'Ganesh', role: 'Owner' },
    { email: 'harshitha@applywizz.com', name: 'Harshitha', role: 'Owner' },
    { email: 'nithin@applywizz.com', name: 'Nithin', role: 'Owner' },
    { email: 'abhilash@applywizz.com', name: 'Abhilash', role: 'Owner' },

    // Observers (108)
    { email: 'abhiram@applywizz.com', name: 'Abhiram', role: 'Observer' },
    { email: 'accountmanager@applywizz.com', name: 'Account Manager', role: 'Observer' },
    { email: 'afrin@applywizz.com', name: 'Afrin', role: 'Observer' },
    { email: 'ajay@applywizz.com', name: 'Ajay', role: 'Observer' },
    { email: 'ajaypapagari@applywizz.com', name: 'Ajay Papagari', role: 'Observer' },
    { email: 'bhavana@applywizz.com', name: 'Bhavana', role: 'Observer' },
    { email: 'akhila@applywizz.com', name: 'Akhila', role: 'Observer' },
    { email: 'akshay@applywizz.com', name: 'Akshay', role: 'Observer' },
    { email: 'akshaya@applywizz.com', name: 'Akshaya', role: 'Observer' },
    { email: 'anish@applywizz.com', name: 'Anish', role: 'Observer' },
    { email: 'anjali@applywizz.com', name: 'Anjali', role: 'Observer' },
    { email: 'aparna@applywizz.com', name: 'Aparna', role: 'Observer' },
    { email: 'applications@applywizz.com', name: 'Applications', role: 'Observer' },
    { email: 'support@applywizz.com', name: 'Support', role: 'Observer' },
    { email: 'ashwitha@applywizz.com', name: 'Ashwitha', role: 'Observer' },
    { email: 'bhaskar@applywizz.com', name: 'Bhaskar', role: 'Observer' },
    { email: 'bhavani@applywizz.com', name: 'Bhavani', role: 'Observer' },
    { email: 'ramalingaraju@applywizz.com', name: 'Ramalingaraju', role: 'Observer' },
    { email: 'balaji@applywizz.com', name: 'Balaji', role: 'Observer' },
    { email: 'ramadevi@applywizz.com', name: 'Ramadevi', role: 'Observer' },
    { email: 'community@applywizz.com', name: 'Community', role: 'Observer' },
    { email: 'dayakar@applywizz.com', name: 'Dayakar', role: 'Observer' },
    { email: 'deekshitha@applywizz.com', name: 'Deekshitha', role: 'Observer' },
    { email: 'parvathi@applywizz.com', name: 'Parvathi', role: 'Observer' },
    { email: 'dhakella@applywizz.com', name: 'Dhakella', role: 'Observer' },
    { email: 'engg@applywizz.com', name: 'Engineering', role: 'Observer' },
    { email: 'finance@applywizz.com', name: 'Finance', role: 'Observer' },
    { email: 'harika@applywizz.com', name: 'Harika', role: 'Observer' },
    { email: 'hello@applywizz.com', name: 'Hello', role: 'Observer' },
    { email: 'jagan1@applywizz.com', name: 'Jagan 1', role: 'Observer' },
    { email: 'jagan@applywizz.com', name: 'Jagan', role: 'Observer' },
    { email: 'kalyan@applywizz.com', name: 'Kalyan', role: 'Observer' },
    { email: 'karthik@applywizz.com', name: 'Karthik', role: 'Observer' },
    { email: 'kavya@applywizz.com', name: 'Kavya', role: 'Observer' },
    { email: 'supriya@applywizz.com', name: 'Supriya', role: 'Observer' },
    { email: 'krishnavamshi@applywizz.com', name: 'Krishna Vamshi', role: 'Observer' },
    { email: 'bhavya@applywizz.com', name: 'Bhavya', role: 'Observer' },
    { email: 'ramyasri@applywizz.com', name: 'Ramya Sri', role: 'Observer' },
    { email: 'lalithareddy@applywizz.com', name: 'Lalitha Reddy', role: 'Observer' },
    { email: 'mahvish@applywizz.com', name: 'Mahvish', role: 'Observer' },
    { email: 'manasa@applywizz.com', name: 'Manasa', role: 'Observer' },
    { email: 'maneesha@applywizz.com', name: 'Maneesha', role: 'Observer' },
    { email: 'maneeshwar@applywizz.com', name: 'Maneeshwar', role: 'Observer' },
    { email: 'sampath@applywizz.com', name: 'Sampath', role: 'Observer' },
    { email: 'samyuktha@applywizz.com', name: 'Samyuktha', role: 'Observer' },
    { email: 'mardhavan@applywizz.com', name: 'Mardhavan', role: 'Observer' },
    { email: 'marketing@applywizz.com', name: 'Marketing', role: 'Observer' },
    { email: 'pooja@applywizz.com', name: 'Pooja', role: 'Observer' },
    { email: 'lokesh@applywizz.com', name: 'Lokesh', role: 'Observer' },
    { email: 'meenakshi@applywizz.com', name: 'Meenakshi', role: 'Observer' },
    { email: 'zubair@applywizz.com', name: 'Zubair', role: 'Observer' },
    { email: 'srujana@applywizz.com', name: 'Srujana', role: 'Observer' },
    { email: 'sahithi@applywizz.com', name: 'Sahithi', role: 'Observer' },
    { email: 'nagarajumuthu@applywizz.com', name: 'Nagaraju Muthu', role: 'Observer' },
    { email: 'navya@applywizz.com', name: 'Navya', role: 'Observer' },
    { email: 'kishore@applywizz.com', name: 'Kishore', role: 'Observer' },
    { email: 'yeshwanth@applywizz.com', name: 'Yeshwanth', role: 'Observer' },
    { email: 'pavan@applywizz.com', name: 'Pavan', role: 'Observer' },
    { email: 'pavankumar@applywizz.com', name: 'Pavan Kumar', role: 'Observer' },
    { email: 'pavankalyan@applywizz.com', name: 'Pavan Kalyan', role: 'Observer' },
    { email: 'pranathi@applywizz.com', name: 'Pranathi', role: 'Observer' },
    { email: 'pranavi@applywizz.com', name: 'Pranavi', role: 'Observer' },
    { email: 'prathyusha@applywizz.com', name: 'Prathyusha', role: 'Observer' },
    { email: 'pravalika@applywizz.com', name: 'Pravalika', role: 'Observer' },
    { email: 'preethi@applywizz.com', name: 'Preethi', role: 'Observer' },
    { email: 'rachana@applywizz.com', name: 'Rachana', role: 'Observer' },
    { email: 'rakesh@applywizz.com', name: 'Rakesh', role: 'Observer' },
    { email: 'ravi@applywizz.com', name: 'Ravi', role: 'Observer' },
    { email: 'revathi@applywizz.com', name: 'Revathi', role: 'Observer' },
    { email: 'ruchitha@applywizz.com', name: 'Ruchitha', role: 'Observer' },
    { email: 'saipavan@applywizz.com', name: 'Sai Pavan', role: 'Observer' },
    { email: 'saiprasanna@applywizz.com', name: 'Sai Prasanna', role: 'Observer' },
    { email: 'saipreethi@applywizz.com', name: 'Sai Preethi', role: 'Observer' },
    { email: 'saisree@applywizz.com', name: 'Sai Sree', role: 'Observer' },
    { email: 'saisrivatsava@applywizz.com', name: 'Sai Srivatsava', role: 'Observer' },
    { email: 'sana@applywizz.com', name: 'Sana', role: 'Observer' },
    { email: 'sarika@applywizz.com', name: 'Sarika', role: 'Observer' },
    { email: 'ali@applywizz.com', name: 'Ali', role: 'Observer' },
    { email: 'sharanya@applywizz.com', name: 'Sharanya', role: 'Observer' },
    { email: 'shruthisherupally@applywizz.com', name: 'Shruthi Sherupally', role: 'Observer' },
    { email: 'kolashivani@applywizz.com', name: 'Kola Shivani', role: 'Observer' },
    { email: 'shivani@applywizz.com', name: 'Shivani', role: 'Observer' },
    { email: 'shravani@applywizz.com', name: 'Shravani', role: 'Observer' },
    { email: 'shruthi@applywizz.com', name: 'Shruthi', role: 'Observer' },
    { email: 'shyam@applywizz.com', name: 'Shyam', role: 'Observer' },
    { email: 'sowmya@applywizz.com', name: 'Sowmya', role: 'Observer' },
    { email: 'sreeja@applywizz.com', name: 'Sreeja', role: 'Observer' },
    { email: 'srivamsi@applywizz.com', name: 'Sri Vamsi', role: 'Observer' },
    { email: 'sriketh@applywizz.com', name: 'Sriketh', role: 'Observer' },
    { email: 'srinivas@applywizz.com', name: 'Srinivas', role: 'Observer' },
    { email: 'stacksorcerer@applywizz.com', name: 'Stack Sorcerer', role: 'Observer' },
    { email: 'techteam@applywizz.com', name: 'Tech Team', role: 'Observer' },
    { email: 'varsha@applywizz.com', name: 'Varsha', role: 'Observer' },
    { email: 'varshini@applywizz.com', name: 'Varshini', role: 'Observer' },
    { email: 'varshith@applywizz.com', name: 'Varshith', role: 'Observer' },
    { email: 'venkatesh@applywizz.com', name: 'Venkatesh', role: 'Observer' },
    { email: 'vibe-code@applywizz.com', name: 'Vibe Code', role: 'Observer' },
    { email: 'vidhya@applywizz.com', name: 'Vidhya', role: 'Observer' },
    { email: 'vinil@applywizz.com', name: 'Vinil', role: 'Observer' },
    { email: 'vinoda@applywizz.com', name: 'Vinoda', role: 'Observer' },
    { email: 'vyshnavi.oram@applywizz.com', name: 'Vyshnavi Oram', role: 'Observer' },
    { email: 'webwizard@applywizz.com', name: 'Web Wizard', role: 'Observer' },
];

const DEFAULT_PASSWORD = 'Applywizz@2026';

async function createUser(user) {
    try {
        // Create user in auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email.toLowerCase(),
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: {
                name: user.name,
                role: user.role
            }
        });

        if (authError) {
            console.error(`❌ Error creating ${user.email}:`, authError.message);
            return { success: false, email: user.email, error: authError.message };
        }

        // Insert into public.users
        const { error: dbError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: user.email.toLowerCase(),
                name: user.name,
                role: user.role,
                must_change_password: true
            });

        if (dbError) {
            console.error(`❌ Error inserting ${user.email} into public.users:`, dbError.message);
            return { success: false, email: user.email, error: dbError.message };
        }

        console.log(`✅ Created: ${user.email} (${user.role})`);
        return { success: true, email: user.email };
    } catch (error) {
        console.error(`❌ Exception for ${user.email}:`, error);
        return { success: false, email: user.email, error: error.message };
    }
}

async function bulkCreateUsers() {
    console.log('🚀 Starting bulk user creation...');
    console.log(`📊 Total users to create: ${users.length}`);
    console.log('');

    const results = {
        success: [],
        failed: []
    };

    // Create users in batches of 10 to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}...`);

        const batchResults = await Promise.all(batch.map(createUser));

        batchResults.forEach(result => {
            if (result.success) {
                results.success.push(result.email);
            } else {
                results.failed.push(result);
            }
        });

        // Wait 1 second between batches
        if (i + batchSize < users.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.log('\n\n✅ ========== BULK CREATION COMPLETE ==========');
    console.log(`✅ Successfully created: ${results.success.length} users`);
    console.log(`❌ Failed: ${results.failed.length} users`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed users:');
        results.failed.forEach(f => console.log(`  - ${f.email}: ${f.error}`));
    }

    // Verify counts
    const { data: counts } = await supabase
        .from('users')
        .select('role')
        .then(({ data }) => {
            const roleCounts = data.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});
            return { data: roleCounts };
        });

    console.log('\n📊 Final user counts by role:');
    console.log(counts);
}

// Run the script
bulkCreateUsers().catch(console.error);

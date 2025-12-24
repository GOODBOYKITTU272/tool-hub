import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeqiifpbpurvidvhpanu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU0OTUzMSwiZXhwIjoyMDgxMTI1NTMxfQ.aiyhmWgHnBiv9fV6psbeY0BWwRLOvs_-2hOdiJNiaJU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkUser() {
    console.log('🔍 Listing all users to find Rama...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('❌ List Error:', listError.message);
        return;
    }

    const ramaUsers = users.filter(u => u.email.toLowerCase().includes('rama'));
    console.log(`Found ${ramaUsers.length} users matching "rama":`);
    ramaUsers.forEach(u => console.log(` - ${u.email} (${u.id})`));

    const targetUser = users.find(u => u.email === 'ramakrishna@applywizz.com');
    if (targetUser) {
        console.log('🛠 Resetting password and metadata for ramakrishna@applywizz.com...');
        const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
            targetUser.id,
            {
                password: 'Applywizz@2026',
                user_metadata: { name: 'Rama Krishna', role: 'Admin' }
            }
        );

        if (updateError) {
            console.error('❌ Update Error:', updateError.message);
        } else {
            console.log('✅ Password reset to: Applywizz@2026');
        }
    } else {
        console.log('❌ ramakrishna@applywizz.com NOT found in Auth list.');
    }
}

checkUser();

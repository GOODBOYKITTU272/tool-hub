import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually from .env.local
try {
    const envFile = readFileSync(join(__dirname, '.env.local'), 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...values] = trimmed.split('=');
            if (key && values.length > 0) {
                process.env[key.trim()] = values.join('=').trim();
            }
        }
    });
} catch (error) {
    console.error('Error loading .env.local:', error.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDailyEmail() {
    console.log('\n📧 Testing Daily Email...\n');

    // Get the most recent daily log
    const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('⚠️  No daily logs found. Please create a daily log entry first.');
        return;
    }

    const log = logs[0];
    console.log('Found log:', {
        id: log.id,
        user_id: log.user_id,
        date: log.date,
        tool_id: log.tool_id
    });

    // Trigger the daily email function
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-daily-prep-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
                log_id: log.id,
                user_id: log.user_id
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Daily email sent successfully!');
            console.log('Result:', result);
        } else {
            console.error('❌ Failed to send daily email:', result);
        }
    } catch (err) {
        console.error('❌ Error calling function:', err.message);
    }
}

async function testWeeklyEmail() {
    console.log('\n📊 Testing Weekly Email...\n');

    // Calculate current week dates
    const now = new Date();
    const currentDay = now.getDay();
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];

    console.log('Week range:', { startDate, endDate });

    // Trigger the weekly email function
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/send-weekly-summary-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Weekly email sent successfully!');
            console.log('Result:', result);
        } else {
            console.error('❌ Failed to send weekly email:', result);
        }
    } catch (err) {
        console.error('❌ Error calling function:', err.message);
    }
}

// Main execution
const args = process.argv.slice(2);
const testType = args[0];

if (testType === 'daily') {
    await testDailyEmail();
} else if (testType === 'weekly') {
    await testWeeklyEmail();
} else if (testType === 'both') {
    await testDailyEmail();
    await testWeeklyEmail();
} else {
    console.log(`
📧 Email Testing Tool

Usage:
  node test-emails.mjs [daily|weekly|both]

Examples:
  node test-emails.mjs daily    - Send a test daily prep email
  node test-emails.mjs weekly   - Send a test weekly summary email
  node test-emails.mjs both     - Send both test emails

Make sure you have:
1. Created daily log entries in the app
2. Configured RESEND_API_KEY in .env.local
3. Deployed the edge functions to Supabase
  `);
}

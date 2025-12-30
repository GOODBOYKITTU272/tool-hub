# Weekly Summary Email Setup Guide

## 🚀 Overview

This guide explains how to set up weekly summary emails in the ToolHub application. The system automatically aggregates daily logs from the past week and sends personalized summary reports to users every Friday.

## ✅ What's Included

- ✅ Weekly summary Edge Function (`send-weekly-summary-email`)
- ✅ Database migration for scheduled jobs
- ✅ Automatic weekly scheduling (Fridays at 2:00 PM IST)
- ✅ Aggregated weekly report with insights
- ✅ HTML email templates with professional styling

## 🔧 Setup Steps

### 1. Deploy the Edge Function

```bash
# Deploy the weekly summary function
npx supabase functions deploy send-weekly-summary-email
```

### 2. Set Environment Secrets

Go to Supabase Dashboard → Edge Functions → Secrets and add:

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=TSNiM/9etBzUPROVeHwFidzpODSCsKuVCMQoUupf
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0

# Email Service
RESEND_API_KEY=re_X9Q6mVGi_KxXcugDF6RVBDZYhSzEafQLb
```

Or use CLI:

```bash
npx supabase secrets set AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_HERE
npx supabase secrets set AWS_SECRET_ACCESS_KEY=TSNiM/9etBzUPROVeHwFidzpODSCsKuVCMQoUupf
npx supabase secrets set AWS_REGION=us-east-1
npx supabase secrets set BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
npx supabase secrets set RESEND_API_KEY=re_X9Q6mVGi_KxXcugDF6RVBDZYhSzEafQLb
```

### 3. Apply the Database Migration

```bash
# Apply the weekly email schedule migration
npx supabase db push
```

Or manually run the SQL in Supabase SQL Editor:
- File: `supabase/migrations/create_weekly_email_schedule.sql`

## 📧 How It Works

1. **Weekly Schedule** → Runs every Friday at 2:00 PM IST (8:30 AM UTC)
2. **Data Aggregation** → Fetches all daily logs from the past week (Monday to Sunday)
3. **AI Processing** → Uses AWS Bedrock (Amazon Nova Lite) to generate insights and summaries
4. **Email Generation** → Creates personalized weekly reports
5. **Email Delivery** → Sends reports via Resend to each user's email

## 📊 Weekly Report Content

Each weekly email includes:

- **Week Overview** → Total days logged, tasks completed, tools worked on
- **Daily Breakdown** → Day-by-day summary of activities
- **Key Insights** → Most active day, most worked-on tool, recurring blockers
- **Next Week Preview** → Recommendations and planning suggestions

## 🧪 Testing

### Test the Edge Function Directly

```bash
curl -i --location --request POST 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-weekly-summary-email' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

### Test with Specific Date Range

```bash
curl -i --location --request POST 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-weekly-summary-email' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcWlpZnBicHVydmlkdmhwYW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDk1MzEsImV4cCI6MjA4MTEyNTUzMX0.sVPVUg5oS1BqGbViD0gBpN_pGAxAkqdvGqifbnRXtN8' \
  --header 'Content-Type: application/json' \
  --data '{"start_date":"2025-12-15","end_date":"2025-12-21"}'
```

## 📝 Email Configuration

### Using Resend Test Domain

Currently using `onboarding@resend.dev` (Resend's test domain).

**To use your own domain:**

1. Add domain in Resend dashboard
2. Verify DNS records
3. Update `from` field in `index.ts`:

```typescript
from: 'Tool Hub <noreply@yourdomain.com>',
```

## 🔍 Troubleshooting

### Weekly email not sending?

**Check Edge Function logs:**
```bash
npx supabase functions logs send-weekly-summary-email
```

**Check scheduled job status:**
```sql
SELECT jobid, schedule, command, active 
FROM cron.job 
WHERE command LIKE '%trigger_weekly_summary_email%';
```

**Common issues:**
- ❌ AWS credentials not set → Set secrets in Supabase dashboard
- ❌ API keys not set → Set secrets in Supabase dashboard
- ❌ Scheduled job not created → Run migration SQL
- ❌ Email domain not verified → Use Resend test domain or verify your domain
- ❌ pg_cron not enabled → Check if extension is available in your Supabase plan

### Manual trigger for testing:

```sql
-- Manually trigger the weekly email function
SELECT trigger_weekly_summary_email();
```

## 📊 Monitoring

**Check email delivery:**
- Resend Dashboard → Logs
- See delivery status, opens, clicks

**Check function invocations:**
- Supabase Dashboard → Edge Functions → Metrics
- See invocation count, errors, latency

## 🔐 Security Notes

- ✅ API keys stored as Supabase secrets (not in code)
- ✅ Edge Function uses service role key for database access
- ✅ RLS policies still apply
- ✅ Email only sent to log owner's email address
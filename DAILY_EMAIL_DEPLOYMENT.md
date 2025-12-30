# Daily Standup Prep Email - Deployment Guide

## 🚀 Quick Setup

### 1. Deploy the Edge Function

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref eeqiifpbpurvidvhpanu

# Deploy the function
npx supabase functions deploy send-daily-prep-email
```

### 2. Set Environment Secrets

Go to Supabase Dashboard → Edge Functions → Secrets and add:

```bash
# OpenAI Configuration (for AI-powered email generation)
OPENAI_API_KEY=your_openai_api_key_here

# Email Service
RESEND_API_KEY=your_resend_api_key_here
```

Or use CLI:

```bash
npx supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

### 3. Run the Database Migration

```bash
# Apply the trigger migration
npx supabase db push
```

Or manually run the SQL in Supabase SQL Editor:
- File: `supabase/migrations/create_daily_email_trigger.sql`

---

## 📧 How It Works

1. **User submits daily log** → Frontend saves to `daily_logs` table
2. **Database trigger fires** → Calls `send-daily-prep-email` Edge Function
3. **Edge Function:**
   - Fetches log details (tool, tasks, blockers)
   - Calls AWS Bedrock (Amazon Nova Lite) with your custom prompt
   - Generates professional standup prep
   - Sends email via Resend
4. **User receives email** → Personalized standup prep in inbox

---

## 🧪 Testing

### Test the Edge Function Directly

```bash
curl -i --location --request POST 'https://eeqiifpbpurvidvhpanu.supabase.co/functions/v1/send-daily-prep-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"log_id":"some-log-id","user_id":"some-user-id"}'
```

### Test via Daily Log Submission

1. Login to the app
2. Go to Daily Journal
3. Submit a daily log
4. Check your email inbox (the email associated with your user account)

---

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

---

## 🔍 Troubleshooting

### Email not sending?

**Check Edge Function logs:**
```bash
npx supabase functions logs send-daily-prep-email
```

**Common issues:**
- ❌ AWS credentials not set → Set secrets in Supabase dashboard
- ❌ API keys not set → Set secrets in Supabase dashboard
- ❌ Trigger not created → Run migration SQL
- ❌ Email domain not verified → Use Resend test domain or verify your domain

### AWS Bedrock errors?

- Check AWS credentials are valid
- Ensure you have access to the Bedrock model
- Check function logs for specific error

### Database trigger not firing?

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'daily_log_email_trigger';

-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'trigger_daily_prep_email';

-- Test trigger manually
SELECT trigger_daily_prep_email();
```

---

## 🎯 What's Next?

✅ Daily standup prep emails working!

**Future enhancements:**
- Weekly summary emails (Friday 2 PM IST)
- Daily reminders (5 PM IST)
- Friday missing logs reminder (2 PM IST)

---

## 📊 Monitoring

**Check email delivery:**
- Resend Dashboard → Logs
- See delivery status, opens, clicks
- Supabase Dashboard → Edge Functions → Metrics
- See invocation count, errors, latency

---

## 🔐 Security Notes

- ✅ API keys stored as Supabase secrets (not in code)
- ✅ Edge Function uses service role key for database access
- ✅ RLS policies still apply
- ✅ Email only sent to log owner's email address
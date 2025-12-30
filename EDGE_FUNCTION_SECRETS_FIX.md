# Edge Function Environment Issue Fix

## 🔴 Current Problem

The HTTP responses show:
- **401 errors**: "Missing authorization header"  
- **500 errors**: "permission denied for table daily_logs"

The database trigger IS firing and calling the Edge Function, but the Edge Function can't access the database.

## 🔧 Root Cause

The Edge Function needs **environment secrets** set in Supabase to access the database:
- `SUPABASE_URL` - Auto-set by Supabase ✅
- `SUPABASE_SERVICE_ROLE_KEY` - Might be missing ❌
- `GEMINI_API_KEY` - For AI generation
- `RESEND_API_KEY` - For sending emails

## ✅ Solution Steps

### Step 1: Set Edge Function Secrets

1. Go to **Supabase Dashboard**
2. Navigate to **Edge Functions** → **Configuration** → **Secrets**
3. Add these secrets:

```bash
OPENAI_API_KEY=your_openai_api_key_here
RESEND_API_KEY=your_resend_api_key_here
```

**Note**: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` should be automatically available. If not, you can find them in:
- **Project Settings** → **API** → **Project URL** (for SUPABASE_URL)
- **Project Settings** → **API** → **service_role secret** (for SUPABASE_SERVICE_ROLE_KEY)

### Step 2: Verify Edge Function Deployment

The Edge Function might not be deployed or might be using old code. Redeploy it:

```bash
# In your terminal
cd c:\Users\DELL\Desktop\tool-hub-main
npx supabase functions deploy send-daily-prep-email
```

### Step 3: Test Again

After setting the secrets and redeploying, run the manual trigger script again:

```sql
-- In Supabase SQL Editor
-- Run: manually-trigger-dec17-email.sql
```

## 🎯 Why This Is Happening

1. ✅ Database trigger exists and fires correctly
2. ✅ Trigger calls the Edge Function via HTTP
3. ❌ Edge Function can't authenticate to Supabase (missing SERVICE_ROLE_KEY or it's not accessible)
4. ❌ Without proper auth, Edge Function can't read from `daily_logs` table

## 📋 Quick Checklist

- [ ] Add `GEMINI_API_KEY` to Edge Function secrets
- [ ] Add `RESEND_API_KEY` to Edge Function secrets  
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` exists in secrets
- [ ] Redeploy Edge Function
- [ ] Test manual trigger again
- [ ] Check Edge Function logs for SUCCESS instead of 401/500

## 🔍 How to Check If It's Fixed

After applying the fixes, the `net._http_response` table should show:
- `status_code: 200` (not 401 or 500)
- `error_msg: NULL` (no errors)
- `response: {"success": true, "message": "Email sent successfully"}`

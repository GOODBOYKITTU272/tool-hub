# AWS Bedrock Setup Instructions

## 🔧 Configure AWS Secrets in Supabase

1. Go to **Supabase Dashboard** → **Edge Functions** → **Secrets**:
   https://supabase.com/dashboard/project/eeqiifpbpurvidvhpanu/functions

2. Add these **4 new secrets**:

```
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
```

3. **Remove or keep** `GEMINI_API_KEY` (not needed anymore, but won't cause issues)

## ✅ What Changed

- Replaced Google Gemini with AWS Bedrock (Amazon Nova Lite)
- Added fallback to simple formatted email if AI fails
- More reliable and uses your existing AWS account

## 🚀 Next Steps

1. Add the 4 AWS secrets in Supabase
2. Redeploy the Edge Function
3. Test with the SQL script

The fallback ensures emails will ALWAYS send, even if AWS Bedrock has issues - it will just use a simple formatted version instead of AI-generated content.

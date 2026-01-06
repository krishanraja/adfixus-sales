# Deploy Edge Function - Step by Step

## Quick Method: Use the Script

1. **Open PowerShell** in this directory
2. **Run the script:**
   ```powershell
   .\deploy-function.ps1
   ```
3. **Follow the prompts** - it will guide you through each step

## Manual Method: Run Commands One by One

### Step 1: Login to Supabase

```powershell
npx supabase login
```

This will open a browser for authentication. Complete the login in the browser.

### Step 2: Link to Your Project

```powershell
npx supabase link --project-ref lshyhtgvqdmrakrbcgox
```

You'll be prompted to enter your database password. Get it from:
- Supabase Dashboard → Project Settings → Database → Database Password

### Step 3: Deploy the Function

```powershell
npx supabase functions deploy scan-domain
```

This will deploy the function from `supabase/functions/scan-domain/index.ts`

### Step 4: Set Secrets (Required)

The function needs these secrets to work:

#### Get SCANNER_SUPABASE_SERVICE_KEY:
1. Go to Supabase Dashboard → Project Settings → API
2. Copy the **service_role** key (NOT the anon key)
3. Run:
   ```powershell
   npx supabase secrets set SCANNER_SUPABASE_SERVICE_KEY=your-service-role-key-here
   ```

#### Get BROWSERLESS_API_KEY:
1. Get from your Browserless account (if you have one)
2. Or sign up at https://www.browserless.io/
3. Run:
   ```powershell
   npx supabase secrets set BROWSERLESS_API_KEY=your-browserless-key-here
   ```

#### Get TRANCO_API_KEY (Optional):
1. Get from Tranco API (if you have one)
2. Run:
   ```powershell
   npx supabase secrets set TRANCO_API_KEY=your-tranco-key-here
   ```
   Or skip this if you don't have it.

### Step 5: Verify Deployment

After deployment, test the function:

```powershell
# Test OPTIONS request (CORS preflight)
curl -X OPTIONS https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain -H "Origin: https://adfixus-sales.vercel.app" -v
```

**Expected Response:**
- Status: `200 OK`
- Headers include: `Access-Control-Allow-Origin: *`

### Step 6: Test in Your App

1. Go back to your app
2. Click "Retry Connection" button
3. The diagnostic should now show:
   - **Edge Function Deployed:** Yes
   - **CORS Working:** Yes

## Troubleshooting

**If login fails:**
- Make sure you're logged into Supabase in your browser
- Try running `npx supabase login` again

**If link fails:**
- Check that project ID is correct: `lshyhtgvqdmrakrbcgox`
- Make sure you have access to the project

**If deployment fails:**
- Check that `supabase/functions/scan-domain/index.ts` exists
- Verify the function code is valid TypeScript

**If secrets fail:**
- Make sure you're using the service_role key (not anon key)
- Keys should not have quotes around them

## Alternative: Use Access Token

If you prefer not to use interactive login:

1. Get access token: https://supabase.com/dashboard/account/tokens
2. Set environment variable:
   ```powershell
   $env:SUPABASE_ACCESS_TOKEN="your-token-here"
   ```
3. Then run the deploy commands

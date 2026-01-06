# Deploy Edge Function Script
# Run this in PowerShell

Write-Host "Step 1: Login to Supabase" -ForegroundColor Cyan
Write-Host "You'll need to open a browser to authenticate" -ForegroundColor Yellow
npx supabase login

Write-Host "`nStep 2: Link to your project" -ForegroundColor Cyan
npx supabase link --project-ref lshyhtgvqdmrakrbcgox

Write-Host "`nStep 3: Deploy the scan-domain function" -ForegroundColor Cyan
npx supabase functions deploy scan-domain

Write-Host "`nStep 4: Set secrets (you'll need to provide these values)" -ForegroundColor Cyan
Write-Host "Get SCANNER_SUPABASE_SERVICE_KEY from: Supabase Dashboard → Project Settings → API → service_role key" -ForegroundColor Yellow
$serviceKey = Read-Host "Enter SCANNER_SUPABASE_SERVICE_KEY"
npx supabase secrets set SCANNER_SUPABASE_SERVICE_KEY=$serviceKey

Write-Host "`nGet BROWSERLESS_API_KEY from your Browserless account" -ForegroundColor Yellow
$browserlessKey = Read-Host "Enter BROWSERLESS_API_KEY"
npx supabase secrets set BROWSERLESS_API_KEY=$browserlessKey

Write-Host "`nGet TRANCO_API_KEY (optional, press Enter to skip)" -ForegroundColor Yellow
$trancoKey = Read-Host "Enter TRANCO_API_KEY (or press Enter to skip)"
if ($trancoKey) {
    npx supabase secrets set TRANCO_API_KEY=$trancoKey
}

Write-Host "`n✅ Deployment complete! Test the function:" -ForegroundColor Green
Write-Host "https://lshyhtgvqdmrakrbcgox.supabase.co/functions/v1/scan-domain" -ForegroundColor Cyan

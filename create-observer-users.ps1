# =====================================================
# BULK CREATE OBSERVER USERS - Supabase CLI Script
# =====================================================
# This script creates 44 Observer users using Supabase CLI
# Password: Applywizz@2026
# =====================================================

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting bulk user creation via Supabase CLI...`n" -ForegroundColor Cyan

$users = @(
    @{ name = "K. Bhavya"; email = "bhavya@applywizz.com" },
    @{ name = "M Pooja"; email = "pooja@applywizz.com" },
    @{ name = "N.Sahithi"; email = "sahithi@applywizz.com" },
    @{ name = "T.Deekshitha"; email = "deekshitha@applywizz.com" },
    @{ name = "vyshnavi"; email = "vyshnavi.oram@applywizz.com" },
    @{ name = "CH. Sowmya"; email = "sowmya@applywizz.com" },
    @{ name = "M Akshay"; email = "akshay@applywizz.com" },
    @{ name = "G dayakar"; email = "dayakar@applywizz.com" },
    @{ name = "M.Harika"; email = "harika@applywizz.com" },
    @{ name = "M.Sai prasanna"; email = "saiprasanna@applywizz.com" },
    @{ name = "Ch. Ramadevi(TL)"; email = "ramadevi@applywizz.com" },
    @{ name = "Rachana Merugu"; email = "rachana@applywizz.com" },
    @{ name = "Bhavana Ajja"; email = "bhavana@applywizz.com" },
    @{ name = "Aparna Mandala"; email = "aparna@applywizz.com" },
    @{ name = "M.Krishnavamshi"; email = "krishnavamshi@applywizz.com" },
    @{ name = "Kavya Midde"; email = "kavya@applywizz.com" },
    @{ name = "Shivani Pentham"; email = "shivani@applywizz.com" },
    @{ name = "Chennoju Sreeja"; email = "sreeja@applywizz.com" },
    @{ name = "RamyaSri Kuncham"; email = "ramyasri@applywizz.com" },
    @{ name = "Manasa Japa"; email = "manasa@applywizz.com" },
    @{ name = "Shaik Ali"; email = "ali@applywizz.com" },
    @{ name = "Sarika Reddy (TL)"; email = "sarika@applywizz.com" },
    @{ name = "Pravalika"; email = "pravalika@applywizz.com" },
    @{ name = "Vinoda"; email = "vinoda@applywizz.com" },
    @{ name = "Ruchitha"; email = "ruchitha@applywizz.com" },
    @{ name = "Pavan Kumar"; email = "pavankumar@applywizz.com" },
    @{ name = "Meenakshi"; email = "meenakshi@applywizz.com" },
    @{ name = "Maneesha"; email = "maneesha@applywizz.com" },
    @{ name = "Navya"; email = "navya@applywizz.com" },
    @{ name = "Shruthi Kemmasaram"; email = "shruthi@applywizz.com" },
    @{ name = "Shruthi Sherupally"; email = "shruthisherupally@applywizz.com" },
    @{ name = "Supriya"; email = "supriya@applywizz.com" },
    @{ name = "Srujana"; email = "srujana@applywizz.com" },
    @{ name = "Ashwitha"; email = "ashwitha@applywizz.com" },
    @{ name = "shivani kola"; email = "kolashivani@applywizz.com" },
    @{ name = "Sana"; email = "sana@applywizz.com" },
    @{ name = "Prathyusha"; email = "prathyusha@applywizz.com" },
    @{ name = "Saipreethi"; email = "saipreethi@applywizz.com" },
    @{ name = "Akhila"; email = "akhila@applywizz.com" },
    @{ name = "Shravani"; email = "shravani@applywizz.com" },
    @{ name = "Sai pavan"; email = "saipavan@applywizz.com" },
    @{ name = "Rakesh"; email = "rakesh@applywizz.com" },
    @{ name = "Vidhya"; email = "vidhya@applywizz.com" },
    @{ name = "D.Nimsha(T,L)"; email = "dhakella@applywizz.com" }
)

$password = "Applywizz@2026"
$successCount = 0
$errorCount = 0
$total = $users.Count

foreach ($user in $users) {
    $currentNum = $successCount + $errorCount + 1
    Write-Host "[$currentNum/$total] Creating: $($user.name) ($($user.email))" -ForegroundColor White
    
    try {
        # Create auth user via Supabase CLI
        $output = supabase auth users create "$($user.email)" --password "$password" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Auth user created" -ForegroundColor Green
            $successCount++
        } else {
            if ($output -match "already registered") {
                Write-Host "  ⏩ User already exists, skipping..." -ForegroundColor Yellow
                $successCount++
            } else {
                Write-Host "  ❌ Error: $output" -ForegroundColor Red
                $errorCount++
            }
        }
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Successfully created: $successCount" -ForegroundColor Green
Write-Host "  ❌ Errors: $errorCount" -ForegroundColor Red
Write-Host "  📝 Total: $total" -ForegroundColor White

Write-Host "`n✨ Done!" -ForegroundColor Cyan
Write-Host "`n⚠️  IMPORTANT: You still need to create user profiles in public.users table!" -ForegroundColor Yellow
Write-Host "Run the create-observer-users.sql script in Supabase Dashboard SQL Editor." -ForegroundColor Yellow

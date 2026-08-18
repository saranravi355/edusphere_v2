<#
    Writes .env for the Supabase "edusphere" project.

    The database password is never passed as an argument, never echoed, and
    never written anywhere except .env — it is read from a masked prompt.
    Supabase does not let you read the password back after project creation,
    so if you do not have it, reset it first at:

      Dashboard -> edusphere -> Database -> Settings -> Reset database password

    Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts\setup-env.ps1
#>

$ErrorActionPreference = "Stop"

# --- Project details, read from the Supabase dashboard -----------------------
$ProjectRef  = "mypgubeimwwsjcuzzujm"
$PoolerHost  = "aws-0-ap-northeast-1.pooler.supabase.com"
$User        = "postgres.$ProjectRef"

Write-Host ""
Write-Host "============================================================"
Write-Host "  EduSphere 360 - write .env for Supabase project 'edusphere'"
Write-Host "============================================================"
Write-Host ""
Write-Host "  Project ref : $ProjectRef"
Write-Host "  Pooler host : $PoolerHost"
Write-Host ""
Write-Host "  Paste the database password. It will not be displayed."
Write-Host "  Don't have it? Supabase cannot show it again - reset it at"
Write-Host "  Database -> Settings -> Reset database password, then re-run."
Write-Host ""

$secure = Read-Host -Prompt "  Database password" -AsSecureString
$bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Host ""
    Write-Host "  No password entered - nothing written." -ForegroundColor Yellow
    exit 1
}

# Percent-encode so passwords containing @ : / ? # & cannot break URL parsing.
$encoded = [uri]::EscapeDataString($plain)

$databaseUrl = "postgresql://$User`:$encoded@$PoolerHost`:6543/postgres?pgbouncer=true&connection_limit=1"
$directUrl   = "postgresql://$User`:$encoded@$PoolerHost`:5432/postgres"

# Keep any unrelated settings the existing .env may hold; drop the old DB lines.
$preserved = @()
if (Test-Path ".env") {
    Copy-Item ".env" ".env.sqlite.bak" -Force
    Write-Host ""
    Write-Host "  Existing .env backed up to .env.sqlite.bak"
    $preserved = Get-Content ".env" | Where-Object {
        $_ -notmatch '^\s*(DATABASE_URL|DIRECT_URL)\s*=' -and $_.Trim() -ne ''
    }
}

$lines = @(
    "# Supabase project 'edusphere' ($ProjectRef), org Rapdfly, AWS ap-northeast-1.",
    "# Written by scripts/setup-env.ps1 - contains a live credential, never commit.",
    "",
    "# Runtime queries: transaction-mode pooler (6543).",
    "DATABASE_URL=`"$databaseUrl`"",
    "",
    "# Migrations and the data port: session-mode pooler (5432).",
    "# Prisma Migrate cannot run through the transaction pooler.",
    "DIRECT_URL=`"$directUrl`""
)
if ($preserved.Count -gt 0) {
    $lines += ""
    $lines += "# --- preserved from the previous .env ---"
    $lines += $preserved
}

Set-Content -Path ".env" -Value $lines -Encoding UTF8

$plain   = $null
$encoded = $null
[GC]::Collect()

Write-Host "  .env written." -ForegroundColor Green
Write-Host ""
exit 0

# pack-tu-overlay.ps1
# RUN ONCE now, and again any time you add/rename a themed file on your
# tested dev machine. Packs TU-Thammasat theme files from the WORKING,
# TESTED clone (\LibreChat) into tu-overlay/ inside the UPai GIT REPO.
#
# After this, tu-overlay/ is the single source of truth for theme files.
# GitHub Actions clones a fresh LibreChat, copies tu-overlay/ on top, and
# builds using LibreChat's OWN Dockerfile (not a custom one) -- so you
# never need to hand-maintain a Dockerfile or run docker commands by hand.

# Source = the folder you already tested and confirmed working.
$Source      = "C:\Users\DamrongsakSattabut\LibreChat"
# Destination = the UPai git repo, where tu-overlay/ lives and gets pushed.
$OverlayRepo = "C:\Users\DamrongsakSattabut\UPai"
$OverlayDir  = Join-Path $OverlayRepo "tu-overlay"

if (-not (Test-Path $Source)) {
    Write-Host "ERROR: Source path not found: $Source" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $OverlayRepo)) {
    Write-Host "ERROR: UPai repo path not found: $OverlayRepo" -ForegroundColor Red
    exit 1
}

# Files copied AS-IS (no merge needed -- these don't affect dependency versions).
# Add new themed files here whenever you touch a new one.
$Files = @(
    "client\index.html",
    "client\privacy-policy.html",
    "client\public\assets\apple-touch-icon-180x180.png",
    "client\public\assets\favicon-16x16.png",
    "client\public\assets\favicon-32x32.png",
    "client\public\assets\icon-192x192.png",
    "client\public\assets\logo.svg",
    "client\public\assets\maskable-icon.png",
    "client\public\privacy-policy.html",
    "client\public\tos.html",
    "client\src\components\Auth\AuthLayout.tsx",
    "client\src\components\Auth\Login.tsx",
    "client\src\style.css",
    "client\src\utils\upaiEffects.ts",
    "client\tailwind.config.cjs",
    "client\tos.html"
)

Write-Host "Packing TU-theme files into overlay:`n  $OverlayDir`n" -ForegroundColor Cyan

$successCount = 0
$skipped = @()

foreach ($relPath in $Files) {
    $srcPath  = Join-Path $Source $relPath
    $destPath = Join-Path $OverlayDir $relPath

    if (-not (Test-Path $srcPath)) {
        Write-Host "  [SKIP] Not found in source: $relPath" -ForegroundColor Yellow
        $skipped += $relPath
        continue
    }

    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Copy-Item -Path $srcPath -Destination $destPath -Force
    Write-Host "  [OK]   $relPath" -ForegroundColor Green
    $successCount++
}

# --- package.json files: NEVER copied whole. Saved as *.tu-fragment.json ---
# so merge-package-json.js can pull only TU-specific fields (name, description,
# extra scripts) while keeping dependency versions from the freshly-cloned
# upstream LibreChat. This applies to BOTH the root package.json and
# client/package.json, since both carry real dependency lists.
$pkgPairs = @(
    @{ Src = "package.json";        Dest = "package.tu-fragment.json" },
    @{ Src = "client\package.json"; Dest = "client\package.tu-fragment.json" }
)

foreach ($pair in $pkgPairs) {
    $srcPath  = Join-Path $Source $pair.Src
    $destPath = Join-Path $OverlayDir $pair.Dest

    if (-not (Test-Path $srcPath)) {
        Write-Host "  [SKIP] Not found in source: $($pair.Src)" -ForegroundColor Yellow
        $skipped += $pair.Src
        continue
    }

    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }

    Copy-Item -Path $srcPath -Destination $destPath -Force
    Write-Host "  [OK]   $($pair.Src) -> $($pair.Dest) (will be MERGED, not overwritten, at build time)" -ForegroundColor Green
    $successCount++
}

Write-Host "`n----------------------------------------"
Write-Host "Done. Packed: $successCount | Skipped: $($skipped.Count)" -ForegroundColor Cyan
if ($skipped.Count -gt 0) {
    Write-Host "`nSkipped (check paths/renames before proceeding):" -ForegroundColor Yellow
    $skipped | ForEach-Object { Write-Host "  - $_" }
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  cd `"$OverlayRepo`""
Write-Host "  git add tu-overlay TU-CUSTOMIZATIONS.md .github"
Write-Host "  git commit -m `"Add automated build pipeline for UPai-TU`""
Write-Host "  git push origin TU-theme"
Write-Host "`nPushing changes under tu-overlay/ to TU-theme triggers the GitHub Actions build automatically."

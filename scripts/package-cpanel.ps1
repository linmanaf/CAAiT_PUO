$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$releaseId = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $projectRoot ".work\cpanel-$releaseId"
$public = Join-Path $stage 'public_html'
$install = Join-Path $stage 'installation'
$output = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Force $public,$install,$output | Out-Null
$runtimeFiles = @('index.html','styles.css','analytics.css','app.js','visuals.js','content.js','.htaccess','about.html','programs.html','partners.html','research.html','community.html')
foreach ($file in $runtimeFiles) { Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $public }
foreach ($folder in @('api','assets')) { Copy-Item -LiteralPath (Join-Path $projectRoot $folder) -Destination $public -Recurse }
Copy-Item -LiteralPath (Join-Path $projectRoot 'database/schema.sql') -Destination $install
Copy-Item -LiteralPath (Join-Path $projectRoot 'config.example.php') -Destination $install
Copy-Item -LiteralPath (Join-Path $projectRoot 'scripts/export-admin.php') -Destination $install
Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/CPANEL.md') -Destination (Join-Path $stage 'MULA-DI-SINI.md')
$manifest = Get-ChildItem -LiteralPath $stage -Recurse -File | ForEach-Object {
    [PSCustomObject]@{ path=$_.FullName.Substring($stage.Length+1).Replace('\','/'); bytes=$_.Length; sha256=(Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $stage 'manifest.json') -Encoding UTF8
$archive = Join-Path $output "CAAiT-cPanel-$releaseId.zip"
$archiveWriter = [IO.Compression.ZipFile]::Open($archive,[IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -LiteralPath $stage -Recurse -File | ForEach-Object {
        $entryPath = $_.FullName.Substring($stage.Length+1).Replace('\','/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archiveWriter,$_.FullName,$entryPath,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $archiveWriter.Dispose() }
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    $names = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\','/') })
    if ($zip.Entries | Where-Object { $_.FullName.Contains('\') }) { throw 'Non-portable ZIP path separator' }
    foreach ($required in @('public_html/index.html','public_html/visuals.js','public_html/.htaccess','public_html/api/index.php','installation/schema.sql','MULA-DI-SINI.md')) {
        if ($names -notcontains $required) { throw "Missing package file: $required" }
    }
    if ($names | Where-Object { $_ -match '(^|/)(\.git|\.work|node_modules|config\.local\.php|caait-config\.php|motion-qa\.json)(/|$)' }) { throw 'Private file included in release' }
    Write-Output "Verified $($names.Count) entries: $archive"
} finally { $zip.Dispose() }

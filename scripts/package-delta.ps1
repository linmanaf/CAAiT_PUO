# Builds an upload containing only what changed since the live site, laid out so the ZIP
# extracts straight into public_html. Full releases still come from package-cpanel.ps1;
# this one exists so a content update does not mean re-uploading ~8 MB of unchanged assets.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$output = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Force $output | Out-Null

# Runtime files this release actually touches. Deliberately explicit: a delta built from
# "whatever git reports" would quietly ship a stray edit nobody reviewed. Update these three
# lists each release — they describe THIS upload, not the whole project.
#
# 16 Nov, upload 8: each signatory's name now heads their letter beside the portrait, the
#   Pengarah's post-nominal is back in capitals at a smaller size wherever her name appears,
#   and the Timbalan's menu label regains "(Akademik)".
#   Upload 7 was verified live first — both portraits return 200 and the API accepts the new
#   foreword routes — so api/index.php and the portrait files are not repeated here.
$changed = @(
    'app.js',
    'content.js',
    'analytics.css',
    'index.html'
)
$newFiles = @()
$newFolders = @()

$entries = [Collections.Generic.List[object]]::new()
foreach ($relative in $changed + $newFiles) {
    $full = Join-Path $projectRoot $relative
    if (-not (Test-Path -LiteralPath $full)) { throw "Missing file: $relative" }
    $entries.Add([PSCustomObject]@{ path = $relative; full = $full })
}
foreach ($folder in $newFolders) {
    $base = Join-Path $projectRoot $folder
    if (-not (Test-Path -LiteralPath $base)) { throw "Missing folder: $folder" }
    foreach ($file in Get-ChildItem -LiteralPath $base -Recurse -File) {
        $relative = $file.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
        $entries.Add([PSCustomObject]@{ path = $relative; full = $file.FullName })
    }
}

$releaseId = Get-Date -Format 'yyyyMMdd-HHmmss'
$archive = Join-Path $output "CAAiT-kemaskini-$releaseId.zip"
if (Test-Path -LiteralPath $archive) { Remove-Item -LiteralPath $archive -Force }

$writer = [IO.Compression.ZipFile]::Open($archive, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($entry in $entries) {
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $writer, $entry.full, $entry.path, [IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally { $writer.Dispose() }

# A checksum list so the upload can be verified against the files that left this machine.
$checksums = $entries | ForEach-Object {
    '{0}  {1}' -f (Get-FileHash -LiteralPath $_.full -Algorithm SHA256).Hash.ToLower(), $_.path
}
$checksumFile = Join-Path $output "CAAiT-kemaskini-$releaseId.sha256.txt"
[IO.File]::WriteAllLines($checksumFile, $checksums)

# A failed check must not leave a half-trusted ZIP sitting in dist/ where it could be
# uploaded by mistake, so the archive is removed unless every check below passes.
$verified = $false
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
    $names = @($zip.Entries | ForEach-Object { $_.FullName })
    if ($zip.Entries | Where-Object { $_.FullName.Contains('\') }) { throw 'Non-portable ZIP path separator' }
    # Check against what this release declared, so the guard stays correct as the lists change.
    foreach ($required in ($entries | ForEach-Object { $_.path })) {
        if ($names -notcontains $required) { throw "Missing from delta: $required" }
    }
    if ($names.Count -ne $entries.Count) { throw "Delta holds $($names.Count) files but $($entries.Count) were declared" }
    # Nothing private, and nothing that would overwrite server-side configuration.
    $forbidden = $names | Where-Object { $_ -match '(^|/)(\.git|\.work|config.*\.php|caait-config\.php|\.htaccess|.*\.sql|.*\.md)$' }
    if ($forbidden) { throw "Delta contains a file it must not ship: $($forbidden -join ', ')" }
    $verified = $true
    Write-Output "Delta: $($names.Count) fail"
    Write-Output "  ZIP      : $archive"
    Write-Output "  Checksum : $checksumFile"
    Write-Output ("  Saiz     : {0:N2} MB" -f ((Get-Item $archive).Length / 1MB))
} finally {
    $zip.Dispose()
    if (-not $verified) {
        Remove-Item -LiteralPath $archive -Force -ErrorAction SilentlyContinue
        Remove-Item -LiteralPath $checksumFile -Force -ErrorAction SilentlyContinue
        Write-Output 'Pengesahan gagal: ZIP yang tidak lengkap telah dibuang.'
    }
}

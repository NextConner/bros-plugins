$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$manifestPath = Join-Path $root "manifest.json"
$manifest = Get-Content $manifestPath | ConvertFrom-Json
$version = $manifest.version

$distDir = Join-Path $root "dist"
if (-not (Test-Path $distDir)) {
  New-Item -ItemType Directory -Path $distDir | Out-Null
}

$stagingDir = Join-Path $distDir "package"
if (Test-Path $stagingDir) {
  Remove-Item -Recurse -Force $stagingDir
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

$includePaths = @(
  "manifest.json",
  "background.js",
  "content.js",
  "content.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "options.html",
  "options.js",
  "options.css",
  "assets/icons"
)

foreach ($relativePath in $includePaths) {
  $source = Join-Path $root $relativePath
  $destination = Join-Path $stagingDir $relativePath
  $destinationParent = Split-Path -Parent $destination

  if (-not (Test-Path $destinationParent)) {
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  }

  Copy-Item -Path $source -Destination $destination -Recurse -Force
}

$zipPath = Join-Path $distDir ("bros-selection-translator-{0}.zip" -f $version)
if (Test-Path $zipPath) {
  Remove-Item -Force $zipPath
}

Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -Force

Remove-Item -Recurse -Force $stagingDir

Write-Output $zipPath

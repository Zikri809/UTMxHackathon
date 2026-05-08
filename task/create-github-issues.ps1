param(
  [string]$Repo = "Zikri809/UTMxHackathon"
)

$ErrorActionPreference = "Stop"

& gh auth status | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "GitHub CLI is not authenticated. Run 'gh auth login' or set GH_TOKEN, then rerun this script."
}

$taskDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$taskFiles = Get-ChildItem -LiteralPath $taskDir -File -Filter "TASK-*.md" |
  Sort-Object Name

foreach ($taskFile in $taskFiles) {
  $content = Get-Content -LiteralPath $taskFile.FullName -Raw
  $firstLine = ($content -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)

  if ($firstLine -match "^#\s*(.+)$") {
    $title = $Matches[1].Trim()
  } else {
    $title = [System.IO.Path]::GetFileNameWithoutExtension($taskFile.Name)
  }

  $issueJson = & gh issue list `
    --repo $Repo `
    --state all `
    --search "in:title $title" `
    --json title,number

  if ($LASTEXITCODE -ne 0) {
    throw "Failed to list issues for duplicate check."
  }

  $existing = $issueJson |
    ConvertFrom-Json |
    Where-Object { $_.title -eq $title } |
    Select-Object -First 1

  if ($existing) {
    Write-Host "Skipping existing issue #$($existing.number): $title"
    continue
  }

  $body = @"
$content

---

Source task file: ``task/$($taskFile.Name)``
"@

  $tempBody = New-TemporaryFile
  try {
    Set-Content -LiteralPath $tempBody.FullName -Value $body -NoNewline
    gh issue create `
      --repo $Repo `
      --title $title `
      --body-file $tempBody.FullName
  } finally {
    Remove-Item -LiteralPath $tempBody.FullName -Force -ErrorAction SilentlyContinue
  }
}

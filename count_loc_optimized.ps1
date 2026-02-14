
$projectRoot = "c:\Users\david\OneDrive - Middlesex University\Apps\unilu-geology-login"

function Get-LOC($path) {
    if (-not (Test-Path $path)) { return 0 }
    
    $excludeFolders = @("node_modules", ".git", "dist", "build", ".expo", ".next", "generated", "out")
    $extensions = @(".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".prisma", ".json")
    
    $files = Get-ChildItem -Path $path -Recurse -File | Where-Object {
        $shouldInclude = $true
        foreach ($folder in $excludeFolders) {
            if ($_.FullName -split '\\' -contains $folder) {
                $shouldInclude = $false
                break
            }
        }
        if ($shouldInclude) {
            $ext = $_.Extension.ToLower()
            $shouldInclude = $extensions -contains $ext
        }
        $shouldInclude
    }
    
    $lineCount = 0
    foreach ($file in $files) {
        # Using a faster way to read lines if possible
        try {
            $lines = [System.IO.File]::ReadLines($file.FullName)
            foreach ($line in $lines) { $lineCount++ }
        }
        catch {
            # Fallback for locked files or encoding issues
            $lineCount += (Get-Content $file.FullName | Measure-Object -Line).Lines
        }
    }
    return $lineCount
}

$frontendPath1 = Join-Path $projectRoot "UI_UNILU"
$frontendPath2 = Join-Path $projectRoot "application UNILU"
$backendPath = Join-Path $projectRoot "backend"

Write-Host "Comptage des lignes de code en cours... Cela peut prendre quelques instants."

$frontendLoc = (Get-LOC $frontendPath1) + (Get-LOC $frontendPath2)
$backendLoc = Get-LOC $backendPath

# Other files (in root, excluding the directories already counted)
$allFiles = Get-ChildItem -Path $projectRoot -File | Where-Object { 
    $ext = $_.Extension.ToLower()
    (".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".prisma", ".json", ".md", ".ps1") -contains $ext
}
$otherLoc = 0
foreach ($file in $allFiles) {
    $otherLoc += (Get-Content $file.FullName | Measure-Object -Line).Lines
}

$totalLoc = $frontendLoc + $backendLoc + $otherLoc

Write-Host ""
Write-Host "--- STATISTIQUES DU PROJET ---"
Write-Host "Total : $totalLoc lignes"
Write-Host "Front-end / Mobile : $frontendLoc lignes"
Write-Host "Back-end : $backendLoc lignes"
Write-Host "Autres (config, docs, root) : $otherLoc lignes"
Write-Host "------------------------------"

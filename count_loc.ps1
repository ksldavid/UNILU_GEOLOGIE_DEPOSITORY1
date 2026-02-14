
$projectRoot = "c:\Users\david\OneDrive - Middlesex University\Apps\unilu-geology-login"
$folders = @{
    "Frontend (UI_UNILU)" = "UI_UNILU"
    "Backend" = "backend"
    "Other" = "."
}

$extensions = "*.ts", "*.tsx", "*.js", "*.jsx", "*.css", "*.html", "*.prisma", "*.json"
$exclude = "node_modules", ".git", "dist", "build", ".expo", ".next", "generated", "package-lock.json"

function Count-Lines($path, $recursive=$true) {
    if ($path -eq ".") {
        # Special case for "Other" - count files in root and other folders excluding UI_UNILU and backend
        $files = Get-ChildItem -Path $projectRoot -Recurse:$recursive -Include $extensions -Exclude $exclude | Where-Object { 
            $_.FullName -notmatch "UI_UNILU" -and $_.FullName -notmatch "backend"
        }
    } else {
        $fullPath = Join-Path $projectRoot $path
        if (-not (Test-Path $fullPath)) { return 0 }
        $files = Get-ChildItem -Path $fullPath -Recurse:$recursive -Include $extensions -Exclude $exclude
    }
    
    $totalLines = 0
    foreach ($file in $files) {
        $totalLines += (Get-Content $file.FullName | Measure-Object -Line).Lines
    }
    return $totalLines
}

$results = @{}
$total = 0

foreach ($name in $folders.Keys) {
    $count = Count-Lines $folders[$name]
    $results[$name] = $count
    $total += $count
}

Write-Host "--- Résultats du comptage de lignes ---"
Write-Host "Total du projet : $total"
foreach ($name in $results.Keys) {
    Write-Host "$name : $($results[$name])"
}

# 🚀 SCRIPT D'EXÉCUTION AUTOMATIQUE
# Ce script PowerShell exécute toutes les étapes dans le bon ordre

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CORRECTIONS MAJEURES - UNILU GEOLOGY MANAGEMENT SYSTEM  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est dans le bon dossier
if (!(Test-Path ".\prisma\schema.prisma")) {
    Write-Host "❌ ERREUR : Vous devez exécuter ce script depuis le dossier 'backend'" -ForegroundColor Red
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   .\execute-corrections.ps1" -ForegroundColor Yellow
    pause
    exit 1
}

# ÉTAPE 1
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "ÉTAPE 1/5 : Génération du client Prisma" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERREUR : La génération du client Prisma a échoué" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Client Prisma généré avec succès !" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ÉTAPE 2
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "ÉTAPE 2/5 : Création de la migration" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Cette étape va modifier votre base de données" -ForegroundColor Yellow
Write-Host "   Sauvegardez vos données si nécessaire !" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continuer ? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "Opération annulée" -ForegroundColor Yellow
    exit 0
}

npx prisma migrate dev --name major-fixes-student-enrollment

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERREUR : La migration a échoué" -ForegroundColor Red
    Write-Host "   Vérifiez que PostgreSQL est démarré" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Migration appliquée avec succès !" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ÉTAPE 3
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "ÉTAPE 3/5 : Mise à jour des niveaux académiques" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

npx tsx prisma/seed.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERREUR : Le seed a échoué" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Niveaux académiques créés avec succès !" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# ÉTAPE 4
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "ÉTAPE 4/5 : Auto-inscription des étudiants (SIMULATION)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

npx tsx prisma/scripts/auto-enroll-students-to-courses.ts --dry-run

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERREUR : La simulation a échoué" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Simulation terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Vérifiez les résultats ci-dessus" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Les résultats sont corrects ? Continuer avec l'inscription réelle ? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "Opération annulée - Les étudiants ne sont PAS inscrits" -ForegroundColor Yellow
    Write-Host "Vous pouvez relancer l'inscription plus tard avec :" -ForegroundColor Yellow
    Write-Host "  npx tsx prisma/scripts/auto-enroll-students-to-courses.ts" -ForegroundColor Yellow
    pause
    exit 0
}

# ÉTAPE 5
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "ÉTAPE 5/5 : Auto-inscription des étudiants aux cours (RÉEL)" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

npx tsx prisma/scripts/auto-enroll-students-to-courses.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ ERREUR : L'auto-inscription a échoué" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "✅ Étudiants inscrits avec succès !" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 2

# SUCCÈS
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✨ TOUTES LES CORRECTIONS ONT ÉTÉ APPLIQUÉES ! ✨  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé :" -ForegroundColor White
Write-Host "  ✅ Client Prisma généré" -ForegroundColor Green
Write-Host "  ✅ Migration appliquée (StudentCourseEnrollment créé)" -ForegroundColor Green
Write-Host "  ✅ 6 niveaux académiques créés (presciences, b1, b2, b3, m1, m2)" -ForegroundColor Green
Write-Host "  ✅ Étudiants inscrits automatiquement aux cours" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Ouvrez Prisma Studio pour vérifier : npx prisma studio" -ForegroundColor Cyan
Write-Host "  2. Consultez le guide : GUIDE_EXECUTION.md" -ForegroundColor Cyan
Write-Host "  3. Testez les validations dans votre application" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ouvrir Prisma Studio maintenant ? (O/N)" -ForegroundColor Yellow
$openStudio = Read-Host

if ($openStudio -eq "O" -or $openStudio -eq "o") {
    npx prisma studio
}

Write-Host ""
Write-Host "🎉 Félicitations ! Votre base de données est maintenant professionnelle ! 🚀" -ForegroundColor Green
Write-Host ""
pause

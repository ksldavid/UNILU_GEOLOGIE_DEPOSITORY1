# 🚀 GUIDE D'EXÉCUTION - CORRECTIONS MAJEURES

## ⚠️ IMPORTANT : Ordre d'exécution à respecter

Les commandes doivent être exécutées **dans cet ordre précis** pour éviter les erreurs.

---

## 📋 ÉTAPE PAR ÉTAPE

### ✅ ÉTAPE 1 : Générer le client Prisma
**Pourquoi ?** Pour que le nouveau modèle `StudentCourseEnrollment` soit disponible dans TypeScript

```powershell
cd backend
npx prisma generate
```

**Résultat attendu** :
```
✔ Generated Prisma Client to .\node_modules\@prisma\client
```

**Si erreur** : Vérifiez que `schema.prisma` est correct (pas d'erreurs de syntaxe)

---

### ✅ ÉTAPE 2 : Créer la migration
**Pourquoi ?** Pour appliquer les changements à la base de données

```powershell
npx prisma migrate dev --name major-fixes-student-enrollment
```

**Ce qui sera créé** :
- ✅ Nouvelle table `StudentCourseEnrollment`
- ✅ Nouveaux champs : `credits`, `coefficient`, `deletedAt`, `isArchived`, etc.
- ✅ Nouveaux index de performance
- ✅ Contrainte unique sur `Grade (assessmentId, studentId)`

**Résultat attendu** :
```
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

**Si erreur "relation already exists"** :
- Vous avez peut-être déjà exécuté cette migration
- Vérifiez dans `prisma/migrations/`

---

### ✅ ÉTAPE 3 : Mettre à jour les niveaux académiques
**Pourquoi ?** Pour créer les 6 niveaux simplifiés (presciences, b1, b2, b3, m1, m2)

```powershell
npx tsx prisma/seed.ts
```

**Résultat attendu** :
```
✅ Created: Presciences / Géologie
✅ Created: B1 / Géologie
✅ Created: B2 / Géologie
✅ Created: B3 / Géologie
✅ Created: M1 / Géologie
✅ Created: M2 / Géologie

✨ Seeding completed successfully!
📊 Total levels configured: 6
```

**Note** : Si les niveaux existent déjà, ils seront mis à jour (pas de doublons)

---

### ✅ ÉTAPE 4 : Auto-inscription des étudiants - SIMULATION
**Pourquoi ?** Pour vérifier que tout fonctionne AVANT de créer les inscriptions

```powershell
npx tsx prisma/scripts/auto-enroll-students-to-courses.ts --dry-run
```

**Résultat attendu** :
```
⚠️ MODE SIMULATION - Aucune modification ne sera effectuée

📊 Récupération des inscriptions académiques...
✅ 150 inscriptions académiques trouvées

👤 Jean Kalombo - B1 / Géologie (2024-2025)
   📚 10 cours disponibles
   ✅ GEOL101 - Introduction à la Géologie
   ✅ MATH101 - Mathématiques pour Géologues
   ...

📊 RÉSUMÉ GLOBAL
✅ Total inscriptions créées : 1500
⏭️  Total déjà inscrits       : 0
❌ Total erreurs             : 0

⚠️ MODE SIMULATION : Aucune modification n'a été effectuée
```

**Vérifications** :
- ✅ Le nombre d'étudiants est correct ?
- ✅ Les cours correspondent aux niveaux ?
- ✅ Pas d'erreurs ?

**Si erreurs** : Corrigez avant de passer à l'étape 5

---

### ✅ ÉTAPE 5 : Auto-inscription des étudiants - RÉEL
**Pourquoi ?** Pour inscrire réellement tous les étudiants à leurs cours

```powershell
npx tsx prisma/scripts/auto-enroll-students-to-courses.ts
```

**Résultat attendu** :
```
📊 RÉSUMÉ GLOBAL
✅ Total inscriptions créées : 1500
⏭️  Total déjà inscrits       : 0
❌ Total erreurs             : 0

✨ Auto-inscription terminée avec succès !
```

**Note** : Si vous réexécutez ce script, les étudiants déjà inscrits seront ignorés (pas de doublons)

---

### ✅ ÉTAPE 6 : Vérification dans Prisma Studio
**Pourquoi ?** Pour vérifier visuellement que tout est correct

```powershell
npx prisma studio
```

**Accès** : Ouvre automatiquement http://localhost:5555

**Vérifications à faire** :

#### 1. Table `AcademicLevel`
- ✅ 6 niveaux : presciences, b1, b2, b3, m1, m2
- ✅ Champs `order` : 0, 1, 2, 3, 4, 5

#### 2. Table `StudentCourseEnrollment` (NOUVEAU)
- ✅ Les étudiants sont inscrits aux cours
- ✅ Chaque inscription a : `userId`, `courseId`, `academicYear`, `isActive`
- ✅ Nombre d'inscriptions cohérent (nombre étudiants × nombre de cours par niveau)

#### 3. Table `Course`
- ✅ Nouveaux champs : `credits` (défaut 3.0), `coefficient` (défaut 1.0)
- ✅ Champs `createdAt`, `updatedAt`, `deletedAt`, `isArchived`

#### 4. Table `User`
- ✅ Champs `updatedAt`, `deletedAt`, `isArchived`
- ✅ Champs `resetPasswordToken`, `resetPasswordExpires`

#### 5. Table `Grade`
- ✅ Champs `createdAt`, `updatedAt`, `modifiedBy`
- ✅ Pas de doublons (un étudiant = une note par évaluation)

---

## 🧪 TEST DES VALIDATIONS

### Test 1 : Créer une note pour un étudiant inscrit ✅
```typescript
import { PrismaClient } from '@prisma/client'
import { validateGradeCreation } from './src/middleware/prisma-validators'

const prisma = new PrismaClient()

// Avant de créer une note
await validateGradeCreation(prisma, {
    assessmentId: 1,
    studentId: 10, // Étudiant INSCRIT au cours
    score: 15
})

// Si pas d'erreur, créer la note
await prisma.grade.create({
    data: {
        assessmentId: 1,
        studentId: 10,
        score: 15
    }
})
```

### Test 2 : Créer une note pour un étudiant NON inscrit ❌
```typescript
await validateGradeCreation(prisma, {
    assessmentId: 1,
    studentId: 999, // Étudiant NON inscrit au cours
    score: 15
})

// Résultat : ValidationError
// "L'étudiant Jean Kalombo (jean@unilu.cd) n'est PAS inscrit au cours GEOL101..."
```

### Test 3 : Note supérieure au maximum ❌
```typescript
await validateGradeCreation(prisma, {
    assessmentId: 1, // Assessment avec maxPoints = 20
    studentId: 10,
    score: 25  // > 20
})

// Résultat : ValidationError
// "La note (25) dépasse le maximum autorisé (20)..."
```

---

## 📊 COMMANDES UTILES

### Voir tous les étudiants d'un cours
```typescript
import { getStudentsInCourse } from './src/middleware/prisma-validators'

const students = await getStudentsInCourse(prisma, courseId, '2024-2025')
console.log(`${students.length} étudiants dans ce cours`)
```

### Voir tous les cours d'un étudiant
```typescript
import { getStudentCourses } from './src/middleware/prisma-validators'

const courses = await getStudentCourses(prisma, studentId, '2024-2025')
console.log(`${courses.length} cours pour cet étudiant`)
```

### Vérifier si un étudiant est inscrit
```typescript
import { isStudentEnrolledInCourse } from './src/middleware/prisma-validators'

const isEnrolled = await isStudentEnrolledInCourse(prisma, studentId, courseId)
if (!isEnrolled) {
    console.log('Étudiant non inscrit !')
}
```

---

## ⚠️ EN CAS DE PROBLÈME

### Erreur : "studentCourseEnrollment does not exist"
**Solution** : Vous n'avez pas exécuté l'ÉTAPE 1
```powershell
npx prisma generate
```

### Erreur : Migration failed
**Solution** : Vérifiez que PostgreSQL est démarré
```powershell
# Vérifier la connexion
npx prisma db pull
```

### Erreur : "Niveau académique 'm1_geotechnique' introuvable"
**Solution** : Vous utilisez encore les anciens codes. Exécutez l'ÉTAPE 3
```powershell
npx tsx prisma/seed.ts
```

### Erreur : Aucun cours trouvé pour les étudiants M1/M2
**Solution** : Vérifiez que vos CSV de cours utilisent les codes `m1` et `m2` (pas `m1_geotechnique`, etc.)

---

## ✅ CHECKLIST FINALE

Avant de considérer que tout est terminé, vérifiez :

- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Migration appliquée (table `StudentCourseEnrollment` existe)
- [ ] 6 niveaux académiques créés (presciences, b1, b2, b3, m1, m2)
- [ ] Tous les étudiants inscrits aux cours de leur niveau
- [ ] Validations fonctionnent (test avec `validateGradeCreation`)
- [ ] Prisma Studio affiche les bonnes données

---

## 🎉 SUCCÈS !

Si toutes les étapes sont ✅, votre base de données est maintenant :

- ✅ **Cohérente** : M1/M2 simplifiés
- ✅ **Complète** : Étudiants inscrits automatiquement aux cours
- ✅ **Sécurisée** : Validations empêchent les données invalides
- ✅ **Performante** : Index ajoutés partout
- ✅ **Auditable** : Timestamps et soft delete partout
- ✅ **Conforme** : Crédits ECTS, academic year cohérent

**Félicitations ! 🚀**

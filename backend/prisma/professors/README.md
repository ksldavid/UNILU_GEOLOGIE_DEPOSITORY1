# 👨‍🏫 Guide d'Importation des Professeurs

## 📝 Étapes pour ajouter des professeurs

### 1️⃣ Préparer le fichier CSV

Ouvrez le fichier `professors/data/professors.csv` et ajoutez vos professeurs :

```csv
firstName,lastName,email,password
Jean-Pierre,Mukendi,jp.mukendi@unilu.cd,ProfPassword123!
Marie,Kabamba,m.kabamba@unilu.cd,ProfPassword123!
```

**Colonnes requises :**
- `firstName` : Prénom
- `lastName` : Nom de famille
- `email` : Email (doit être unique)
- `password` : Mot de passe initial

### 2️⃣ Lancer l'import

```powershell
npx tsx prisma/professors/import.ts
```

### 3️⃣ Vérifier dans Prisma Studio

```powershell
npx prisma studio
```

Allez dans la table `User` et filtrez par `systemRole = USER` pour voir vos professeurs.

---

## 🎓 Assigner des professeurs à des cours

Après l'import, les professeurs existent dans la base mais ne sont **pas encore assignés à des cours**.

### Option 1 : Via Prisma Studio

1. Ouvrez `npx prisma studio`
2. Allez dans la table `CourseEnrollment`
3. Cliquez sur "Add record"
4. Remplissez :
   - `userId` : ID du professeur
   - `courseId` : ID du cours
   - `courseRole` : `PROFESSOR`

### Option 2 : Via l'interface web

Une fois connecté en tant qu'admin, vous pourrez assigner les professeurs aux cours depuis le dashboard.

---

## 📊 Différences Professeur vs Étudiant

| Aspect | Étudiant | Professeur |
|--------|----------|------------|
| **systemRole** | `STUDENT` | `USER` |
| **StudentEnrollment** | ✅ Oui (B1, M1, etc.) | ❌ Non |
| **CourseEnrollment** | Automatique | Manuel (assigné aux cours) |

---

## 💡 Commandes rapides

```powershell
# Importer les professeurs
npx tsx prisma/professors/import.ts

# Voir tous les utilisateurs
npx prisma studio
```

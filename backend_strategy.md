# Stratégie Backend & Base de Données - UNILU Géologie

Ce document synthétise les solutions techniques validées pour le développement du Backend, afin de garantir une base de données performante, sécurisée et adaptée aux réalités locales (connexion instable, sécurité anti-triche).

---

## 1. Structure Générale & Performance
**Objectif :** Gérer des milliers d'étudiants et leurs cours sans ralentir l'application.

*   **Architecture :** Base de données relationnelle (PostgreSQL via Prisma).
*   **Optimisation :** Utilisation intensive des **INDEX** (`@@index` dans Prisma).
*   **Logique de Requête :** On ne cherche pas par classe ("Donne-moi tout BAC 2"), mais par utilisateur ("Quels sont les cours de David ?").

---

## 2. Gestion des Inscriptions & Rattrapages
**Problème :** Comment gérer un étudiant de BAC 2 qui a un cours de rattrapage en BAC 1 ?
**Solution :** Double niveau d'inscription.
1.  **Promotion :** L'étudiant est administrativement lie à une "Promo" (ex: BAC 2).
2.  **Inscriptions aux Cours (`StudentCourseEnrollment`) :** Table pivot qui lie `User` <-> `Course`.
    *   L'inscription en masse se fait automatiquement (Script : BAC 2 = 10 cours par défaut).
    *   Les rattrapages sont des lignes ajoutées individuellement ("Géologie BAC 1").
    *   **Avantaqe :** L'horaire affiche tous les cours de cette liste, peu importe l'année d'origine.

---

## 3. Gestion de l'Horaire (Emploi du temps)
**Concept :** "Créneaux Récurrents" (Slots).
*   Table `ScheduleSlot` : Définit "Le Cours X a lieu le Lundi de 8h à 10h".
*   **Affichage :** Le Backend récupère les Slots de tous les cours inscrits de l'étudiant.
*   **Conflits :** Si un étudiant a deux cours en même temps (ex: Cours normal + Rattrapage), le système détecte le conflit d'heure et l'affiche visuellement, mais ne bloque pas l'inscription.

---

## 4. Stratégie de Présence & QR Code (Anti-Triche & Offline)
**Objectif :** Garantir que l'étudiant est physiquement là, même sans internet, et empêcher la triche (WhatsApp).

### Le Workflow "Preuve Asynchrone"
1.  **Le Professeur (L'Ancre)** :
    *   Active la session.
    *   Le système enregistre : **Heure de début/fin** + **Coordonnées GPS du prof**.
    *   Génération d'un QR Token unique.

2.  **L'Étudiant (Le Scan)** :
    *   L'app capture instantanément : **Timestamp (Heure scan)** + **GPS Étudiant**.
    *   Ces données sont chiffrées localement.

3.  **Gestion Hors-Ligne (No Internet)** :
    *   Si pas de réseau, le paquet complet est stocké dans le téléphone ("Pending Sync").
    *   Dès que le téléphone capte internet (même 5h plus tard), le paquet est envoyé tel quel.
    *   L'intégrité des données (Heure du scan) est préservée.

4.  **Validation Serveur (Le Juge)** :
    *   Le serveur reçoit le paquet différé.
    *   **Vérification Géographique :** `Distance(GPS Prof, GPS Étudiant) < 100m` ?
    *   **Vérification Temporelle :** `HeureScan` est-elle comprise dans `[HeureDébut, HeureFin]` ?
    *   Si tout match -> **PRÉSENT**. Sinon -> **ABSENT**.

---

### Workflow Technique & Sécurité (Qui sait quoi ?)
Pour empêcher la triche (Fake GPS, émulateurs), la logique de validation est **Server-Side Only**.

1.  **Création (Prof) :**
    *   Le Frontend envoie GPS Prof + Heure.
    *   Le **Backend** stocke ces "Critères Secrets" (Corrigé) dans la **Database**.
    *   Le Backend envoie un *Token* public (le QR) au frontend.
    *   *Sécurité :* Le QR ne contient PAS les coordonnées GPS cibles.

2.  **Scan (Étudiant) :**
    *   Le Frontend capture GPS Étudiant + Heure.
    *   Il envoie ces données "brutes" au **Backend**.
    *   *Sécurité :* L'étudiant ne connaît pas la zone de validité. Il ne peut pas "viser" une fausse coordonnée.

3.  **Validation (Backend) :**
    *   Le **Backend** compare (GPS Étudiant) vs (GPS Cible stocké en Database).
    *   Si distance < 100m et Heure valide -> Écriture dans **Database** (`AttendanceRecord`).
    *   Retourne succès/échec au Frontend.

### Gestion des Retards (Double Scan)
Le QR code n'étant pas affiché en permanence (projecteur utilisé pour le cours), une logique de "Rattrapage fin de cours" est prévue.

1.  **QR Début (0-15min) :** Marque `PRESENT`. Disparaît quand le prof commence le cours.
2.  **QR Fin (Optionnel) :** Le prof peut générer un "QR Retardataire" à la fin du cours.
    *   Les étudiants scannent ce code spécifique.
    *   Le Backend force le statut `LATE` (Retard) peu importe l'heure.
    *   *Avantage :* Ne perturbe pas le cours, oblige les retardataires à rester jusqu'à la fin.

## 5. Notes & Bulletins
*   **Calcul Dynamique :** Les moyennes ne sont pas stockées en dur mais recalculées.
*   **Audit :** Chaque modification de note (ex: 8/20 -> 12/20) est enregistrée dans une table `GradeAuditLog` avec :
    *   Qui a changé ? (Admin/Prof)
    *   Quand ?
    *   Pourquoi ? (Raison/Justificatif).

---

## 6. Structure de Base de Données (Prisma Schema - Cœur)
*(Brouillon de la structure validée)*

```prisma
model User {
  id String @id @default(uuid())
  role Role // STUDENT, PROFESSOR, ADMIN
  enrollments StudentCourseEnrollment[]
}

model ClassSession {
  id String @id @default(uuid())
  qrToken String @unique
  openAt DateTime
  closeAt DateTime
  latitude Float?  // Position Prof referentielle
  longitude Float?
  radius Int @default(100) // En mètres
}

model AttendanceRecord {
  id String @id
  sessionId String
  studentId String
  
  // Données de preuve
  scannedAt DateTime
  captureLatitude Float?
  captureLongitude Float?
  
  isSyncedLate Boolean @default(false) // Si envoyé en différé
  status AttendanceStatus // PRESENT, REJECTED (Too far/Too late)
}
```

---
*Document généré le 28/12/2025 - Trace écrite pour implémentation future.*

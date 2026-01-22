# 🚀 Guide de Déploiement en Production - UNILU Géologie

## Prérequis
- Compte [Vercel](https://vercel.com) ou [Railway](https://railway.app) (gratuit)
- Repository Git (GitHub, GitLab)
- Base de données PostgreSQL (Prisma Accelerate déjà configuré ✅)

---

## 📋 Checklist Avant Déploiement

### 1. Vérifications de Sécurité ✅
- [x] JWT_SECRET configuré dans `.env`
- [x] Rate Limiting actif sur l'API
- [x] Toutes les routes protégées par authentification
- [x] Contrôle de rôle sur les routes sensibles
- [x] Gestionnaire d'erreurs global
- [x] Headers de sécurité (Helmet)
- [x] `.gitignore` configuré pour exclure `.env`

### 2. Configuration Production
- [ ] URL de production dans `mobile/services/config.ts`
- [ ] `NODE_ENV=production` sur le serveur de prod

---

## 🌐 Déploiement du Backend (Option A: Vercel)

### Étape 1: Préparer le projet
```bash
cd backend
git add .
git commit -m "Préparation pour production"
git push origin main
```

### Étape 2: Déployer sur Vercel
1. Va sur [vercel.com](https://vercel.com) et connecte ton GitHub
2. Clique "New Project" → Sélectionne ton repo
3. Configure le projet:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build` (ou laisser vide)
   - **Output Directory**: (laisser vide)

### Étape 3: Configurer les Variables d'Environnement
Dans Vercel → Settings → Environment Variables, ajoute :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(colle ta vraie URL Prisma)* |
| `JWT_SECRET` | *(colle ton secret JWT)* |
| `CLOUDINARY_CLOUD_NAME` | `duceiamzj` |
| `CLOUDINARY_API_KEY` | *(ta clé)* |
| `CLOUDINARY_API_SECRET` | *(ton secret)* |

### Étape 4: Récupérer l'URL
Une fois déployé, Vercel te donne une URL comme :
`https://unilu-geology-backend.vercel.app`

---

## 🌐 Déploiement du Backend (Option B: Railway)

Railway est souvent plus simple pour les backends Node.js :

1. Va sur [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Sélectionne le dossier `backend`
4. Ajoute les variables d'environnement (même liste que Vercel)
5. Railway génère automatiquement ton URL

---

## 📱 Mise à Jour de l'Application Mobile

### Étape 1: Configurer l'URL de Production
Ouvre `application UNILU/mobile/services/config.ts` et modifie :

```typescript
const API_URLS = {
    development: 'http://192.168.11.110:3001/api',
    production: 'https://TON-URL-VERCEL-OU-RAILWAY.app/api', // ← Mets ta vraie URL ici
};
```

### Étape 2: Tester en mode production
```bash
cd "application UNILU/mobile"
npx expo start --no-dev
```

### Étape 3: Build pour distribution
```bash
# Pour Android (APK)
npx expo build:android

# Pour iOS (via Expo)
npx expo build:ios
```

---

## 🔒 HTTPS (Sécurité des Communications)

### C'est quoi HTTPS ?
HTTPS crypte toutes les données entre l'app mobile et le serveur. Sans ça, un pirate sur le même WiFi peut voir les mots de passe en clair.

### Bonne nouvelle !
**Vercel et Railway fournissent HTTPS automatiquement** sur leurs domaines. Tu n'as rien à faire !

Si tu utilises ton propre serveur Linux, tu devras configurer Nginx + Let's Encrypt.

---

## 💾 Backups Automatiques

### Prisma Accelerate
Tu utilises déjà Prisma Accelerate qui héberge ta base de données. Leurs backups sont automatiques.

### Vérifier/Configurer les Backups
1. Va sur [console.prisma.io](https://console.prisma.io)
2. Sélectionne ton projet
3. Va dans Settings → Backups
4. Active les backups automatiques (si pas déjà fait)

### Recommandation
Configure un backup quotidien et garde au moins 7 jours d'historique.

---

## 🧪 Tests Post-Déploiement

Après le déploiement, vérifie :

1. **Health Check** : Visite `https://ton-url.app/api/health`
   - Doit retourner `{ "status": "ok", ... }`

2. **Login** : Teste la connexion avec un compte existant

3. **Fonctionnalités critiques** :
   - Consulter les cours ✅
   - Voir les notes ✅
   - Scanner QR Code ✅

---

## 🆘 Dépannage

### Le serveur ne démarre pas
- Vérifie que toutes les variables d'environnement sont configurées
- Regarde les logs dans Vercel/Railway

### L'app mobile ne se connecte pas
- Vérifie que l'URL de production est correcte dans `config.ts`
- Vérifie que le backend est bien déployé (`/api/health`)

### Erreur 401 "Non autorisé"
- Le token JWT a peut-être expiré
- Déconnecte et reconnecte l'utilisateur

---

## 📞 Support

En cas de problème, vérifie :
1. Les logs du serveur (Vercel/Railway dashboard)
2. La console du navigateur (pour le web)
3. Les logs Expo (pour mobile)

---

*Document créé le 18 Janvier 2026*
*Projet UNILU Géologie - Version Production Ready*

# 🔍 Guide de Débogage - Erreurs 403 Vercel

## 📋 Problème Identifié

Les logs Vercel montrent des **erreurs 403 (Forbidden)** sur TOUS les endpoints `/api/professor/*`:
- `/api/professor/dashboard`
- `/api/professor/courses`
- Et tous les autres endpoints protégés

## 🎯 Cause Probable

Le middleware d'authentification JWT bloque les requêtes pour l'une de ces raisons :

1. ⚠️ **Token JWT expiré** - Le token a dépassé sa durée de validité
2. ⚠️ **Token JWT manquant** - Le token n'est pas dans localStorage
3. ⚠️ **Token JWT invalide** - Le token est corrompu ou mal formé
4. ⚠️ **Mauvaise configuration CORS** - Le header Authorization n'est pas transmis

## 🛠️ Solutions Mises en Place

### 1. Logs de Débogage Améliorés

Le fichier `professor.ts` affiche maintenant des logs détaillés dans la console :
- ✅ Présence du token
- ✅ Premiers caractères du token
- ✅ Status des réponses HTTP
- ✅ Messages d'erreur clairs pour 401/403

### 2. Utilitaire de Diagnostic `authDebug`

Un nouvel outil global est disponible dans la console du navigateur :

```javascript
// Vérifier les infos du token JWT
authDebug.getTokenInfo()
// Affiche: userId, role, date d'expiration, temps restant, etc.

// Tester une requête API
authDebug.testAPICall('https://unilu-geologie-depository-1-a6kx.vercel.app/api/professor/dashboard')

// Vérifier si un token existe
authDebug.hasToken()

// Effacer le token (si expiré)
authDebug.clearAuth()
```

## 📝 Étapes de Débogage

### Étape 1 : Vérifier le Token dans le Navigateur

1. Ouvrez votre site web en production
2. Ouvrez la **Console Développeur** (F12)
3. Tapez : `authDebug.getTokenInfo()`
4. Observez le résultat :
   - ✅ Si le token est **valide** : Le problème vient d'ailleurs
   - ❌ Si le token est **expiré** : Reconnectez-vous
   - ❌ Si **aucun token** : Vous n'êtes pas connecté

### Étape 2 : Vérifier les Headers de Requête

Dans les **DevTools** → Onglet **Network** :
1. Rechargez la page
2. Cliquez sur la requête `/api/professor/dashboard`
3. Vérifiez les **Request Headers** :
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. ✅ Si présent : Le token est bien envoyé
5. ❌ Si absent : Problème CORS ou de configuration

### Étape 3 : Tester Manuellement avec ChatGPT

Copiez ce code dans la console :

```javascript
const token = localStorage.getItem('token');
console.log('Token:', token);

fetch('https://unilu-geologie-depository-1-a6kx.vercel.app/api/professor/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => console.log('Data:', data))
.catch(err => console.error('Error:', err));
```

## 🔑 Solutions Possibles

### Solution 1 : Token Expiré → Reconnexion

Si `authDebug.getTokenInfo()` indique que le token est expiré :

1. Effacez le token : `authDebug.clearAuth()`
2. Retournez à la page de connexion
3. Reconnectez-vous

### Solution 2 : Augmenter la Durée de Validité du Token

Dans `backend/src/api/controllers/auth.controller.ts`, augmentez l'expiration :

```typescript
const token = jwt.sign(
  { userId, role },
  JWT_SECRET,
  { expiresIn: '7d' } // Au lieu de '24h'
);
```

### Solution 3 : Vérifier les Variables d'Environnement Vercel

Assurez-vous que `JWT_SECRET` est bien défini dans Vercel :

1. Allez sur **Vercel Dashboard**
2. Sélectionnez votre projet backend
3. **Settings** → **Environment Variables**
4. Vérifiez que `JWT_SECRET` est défini
5. Si modifié, **Redéployez** le projet

### Solution 4 : Vérifier la Configuration CORS

Dans `backend/src/server.ts`, ligne 76, ajoutez votre domaine frontend exact :

```typescript
const corsOptions = {
    origin: isProduction
        ? [
            'https://uniluhub.com',
            'https://www.uniluhub.com',
            'https://unilu-geologie-depository-1-qtz2.vercel.app',
            'https://unilu-geologie.vercel.app',
            'VOTRE_DOMAINE_FRONTEND_ICI' // ⬅️ Ajoutez le votre
          ]
        : '*',
    // ...
}
```

## 📊 Vérification Finale

Une fois le problème résolu :

1. Rechargez la page
2. Ouvrez la console
3. Vérifiez les logs :
   ```
   ✅ [Professor Service] Token trouvé: eyJhbGciOiJIUzI1N...
   📊 [Professor Service] Appel GET /dashboard
   ```
4. ✅ Plus d'erreurs 403 !

## 🚨 Si Rien ne Fonctionne

1. **Vérifiez les logs Vercel Backend** pour voir l'erreur exacte
2. **Testez l'API avec Postman** pour isoler le problème
3. **Vérifiez que le backend est bien déployé** et accessible
4. **Contactez-moi** avec les logs complets

---

**Fait le**: 2026-01-24  
**Par**: Assistant AI Antigravity

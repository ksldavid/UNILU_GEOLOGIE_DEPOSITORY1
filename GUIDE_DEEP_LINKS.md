# 📱 Guide: Activer le Scan QR via Appareil Photo Natif

## 🎯 Objectif
Permettre aux étudiants de scanner les QR codes de présence avec l'appareil photo natif de leur téléphone (Android/iPhone) au lieu d'ouvrir l'application mobile.

## ✅ Modifications Déjà Effectuées

### 1. Configuration Deep Links (`app.json`)
- ✅ Ajout du scheme `unilu`
- ✅ Configuration iOS Universal Links
- ✅ Configuration Android Intent Filters

### 2. Utilitaire Deep Link (`utils/deepLinkHandler.ts`)
- ✅ Création du fichier pour extraire les tokens depuis les URLs

### 3. App Principal (`App.tsx`)
- ✅ Import de `Linking` depuis React Native
- ✅ Ajout du state `deepLinkToken`
- ✅ Gestion complète des deep links (app ouverte et fermée)
- ✅ Passage du token au ScannerScreen

### 4. Scanner Screen (`ScannerScreen.tsx`)
- ✅ Accepte le prop `deepLinkToken`
- ⚠️ **À FAIRE MANUELLEMENT** : Ajouter le useEffect pour traiter le token automatiquement

## 🛠️ Modification Manuelle Requise

### Dans `ScannerScreen.tsx`, ajouter après la ligne 74 :

```typescript
// 🆕 Traiter automatiquement le token depuis le deep link
useEffect(() => {
    if (deepLinkToken && !scanned && !isProcessing) {
        console.log('📱 [DEEP LINK] Auto-processing token from camera scan:', deepLinkToken);
        // Simuler un scan avec le token du deep link
        handleBarCodeScanned({ data: deepLinkToken });
    }
}, [deepLinkToken]);
```

## 📋 Étapes de Test

### 1. Rebuild l'application
```bash
cd "application UNILU/mobile"
eas build --platform android --profile preview
```

### 2. Installer l'APK sur un téléphone Android

### 3. Tester le Scan
1. Générer un QR code depuis l'interface professeur
2. **Ouvrir l'appareil photo natif** du téléphone
3. Scanner le QR code
4. L'application UNILU devrait s'ouvrir automatiquement
5. Le scan de présence devrait se faire automatiquement

## 🔧 Configuration du Domaine

**IMPORTANT** : Dans `app.json`, remplacez `unilu-geologie.onrender.com` par votre vrai domaine si différent.

Lignes à vérifier :
- Ligne 18 : `"associatedDomains": ["applinks:VOTRE-DOMAINE.com"]`
- Ligne 44 : `"host": "VOTRE-DOMAINE.com"`

## 📱 Comment ça marche ?

### Avant (Compliqué)
1. Étudiant ouvre l'app UNILU
2. Clique sur "Scanner"
3. Scanne le QR code
4. Présence validée

### Après (Simple) ✨
1. Étudiant ouvre l'appareil photo
2. Scanne le QR code
3. **L'app s'ouvre automatiquement**
4. **Présence validée automatiquement**

## 🌐 Format des QR Codes

Les QR codes générés contiennent déjà le bon format :
```
https://votre-domaine.com/scan?t=TOKEN_ICI
```

Quand l'appareil photo scanne ce lien :
- **Android** : Détecte le intent filter et ouvre l'app
- **iOS** : Détecte l'associated domain et ouvre l'app
- L'app extrait le `TOKEN_ICI` et traite la présence

## 🚀 Prochaines Étapes

1. ✅ Commit et push les modifications
2. ⚠️ Ajouter manuellement le useEffect dans ScannerScreen.tsx
3. 🔨 Rebuild l'APK avec EAS
4. 📱 Tester sur un vrai téléphone
5. 🎉 Déployer !

## 💡 Fallback Web

Si l'app n'est pas installée, le lien ouvre la page web `/scan?t=TOKEN` qui peut :
- Afficher un message pour télécharger l'app
- Ou permettre le scan via le web (déjà implémenté)

## 🐛 Debug

Pour voir les logs du deep link :
- Connecter le téléphone via USB
- Lancer `adb logcat | grep "DEEP LINK"`
- Scanner un QR code avec l'appareil photo
- Vérifier que le token est bien extrait

---

**Créé le** : 2026-02-11
**Auteur** : Antigravity AI Assistant

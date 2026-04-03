# 🚀 Guide de Déploiement ArtisanNow

## 📋 Prérequis

### Comptes Nécessaires
- ✅ Compte Expo (https://expo.dev)
- ✅ Compte Apple Developer ($99/an) pour iOS
- ✅ Compte Google Play Console ($25 une fois) pour Android

### Installation des Outils
```bash
# Installer Expo CLI globalement
npm install -g expo-cli eas-cli

# Se connecter à Expo
eas login
```

## 🎨 Assets Personnalisés

Les assets suivants ont été générés pour ArtisanNow :

### Icône de l'application (1024x1024)
**URL:** https://r2-pub.rork.com/generated-images/f6a410a4-b978-4e55-81d2-c4928b439dcb.png
- Utilisé pour l'icône iOS et Android
- Design: Clé à molette et marteau croisés sur fond bleu-teal

### Splash Screen (1024x1536)
**URL:** https://r2-pub.rork.com/generated-images/d30b80d0-84f0-48f8-84f7-71cf2fdd3051.png
- Écran de chargement au démarrage
- Logo + nom de l'app + tagline

### Favicon (1024x1024)
**URL:** https://r2-pub.rork.com/generated-images/d408649c-084f-4c99-acbd-cb3a02f8daac.png
- Pour la version web

## 📝 Configuration app.json

Les points clés à configurer dans `app.json` :

```json
{
  "expo": {
    "name": "ArtisanNow",
    "slug": "artisan-now",
    "version": "1.0.0",
    "icon": "[URL de l'icône ci-dessus]",
    "splash": {
      "image": "[URL du splash screen ci-dessus]",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.artisannow.app",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.artisannow.app",
      "versionCode": 1
    }
  }
}
```

## 🔧 Étapes de Déploiement

### 1️⃣ Configuration Initiale EAS

```bash
# Initialiser EAS dans le projet
eas build:configure

# Créer un projet sur Expo
eas init
```

### 2️⃣ Build Android (APK pour tests)

```bash
# Build APK pour tester localement
eas build --platform android --profile preview

# Ou build pour Google Play Store
eas build --platform android --profile production
```

Le build prend 10-20 minutes. Une fois terminé, vous recevrez un lien pour télécharger l'APK.

### 3️⃣ Build iOS (nécessite un compte Apple Developer)

```bash
# Build iOS pour TestFlight
eas build --platform ios --profile production
```

**Note:** Pour iOS, vous devez :
- Avoir un compte Apple Developer actif
- Configurer les certificats et provisioning profiles
- EAS peut gérer cela automatiquement avec : `eas credentials`

### 4️⃣ Soumettre aux Stores

#### Google Play Store
```bash
# Soumettre directement à Google Play
eas submit --platform android
```

#### Apple App Store
```bash
# Soumettre à App Store Connect
eas submit --platform ios
```

## 📱 Tests sur Appareils Physiques

### Option 1 : Expo Go (Développement)
```bash
# Démarrer le serveur de développement
npm start

# Scanner le QR code avec Expo Go app
```

### Option 2 : APK de développement
```bash
# Build APK de test
eas build --platform android --profile preview

# Télécharger et installer l'APK sur votre téléphone
```

### Option 3 : TestFlight (iOS)
1. Build iOS avec EAS
2. Télécharger TestFlight depuis l'App Store
3. Inviter des testeurs via App Store Connect
4. Distribuer la build via TestFlight

## 🔐 Variables d'Environnement

Pour la production, configurez les variables d'environnement dans EAS :

```bash
# Ajouter des secrets EAS
eas secret:create --name EXPO_PUBLIC_TOOLKIT_URL --value "https://votre-api.com"
eas secret:create --name STRIPE_SECRET_KEY --value "sk_live_xxx"
```

## 📊 Versions et Mises à Jour

### Incrémenter les Versions

Avant chaque nouveau build :

**Android** : Incrémenter `versionCode` dans `app.json`
```json
{
  "android": {
    "versionCode": 2  // 1 -> 2 -> 3...
  }
}
```

**iOS** : Incrémenter `buildNumber` dans `app.json`
```json
{
  "ios": {
    "buildNumber": "2"  // "1" -> "2" -> "3"...
  }
}
```

**Version utilisateur** : Incrémenter `version`
```json
{
  "version": "1.0.1"  // 1.0.0 -> 1.0.1 -> 1.1.0
}
```

### Over-The-Air (OTA) Updates

Expo permet les mises à jour OTA (sans passer par les stores) :

```bash
# Publier une mise à jour OTA
eas update --branch production --message "Fix bug de paiement"
```

**Limitations OTA :**
- ✅ JavaScript et assets peuvent être mis à jour
- ❌ Changements natifs nécessitent un nouveau build

## 🧪 Profils de Build (eas.json)

Voir le fichier `eas.json` pour les différents profils :
- **development** : Pour les tests internes
- **preview** : Pour les testeurs externes (APK)
- **production** : Pour les stores officiels

## ⚠️ Checklist Avant Publication

### Technique
- [ ] Tests sur iOS et Android
- [ ] Vérifier les permissions (localisation, notifications, caméra)
- [ ] Tester les paiements en mode production
- [ ] Vérifier les notifications push
- [ ] Tester le mode hors ligne
- [ ] Performance (temps de chargement < 3s)

### Contenu
- [ ] Screenshots pour les stores (minimum 4-5 par plateforme)
- [ ] Description de l'app (courts et longs)
- [ ] Politique de confidentialité (obligatoire)
- [ ] Conditions d'utilisation
- [ ] Support email configuré

### Légal
- [ ] RGPD/CCPA compliance
- [ ] Politique de remboursement
- [ ] Mentions légales
- [ ] CGU/CGV

## 📞 Support et Ressources

- [Documentation Expo EAS](https://docs.expo.dev/eas/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)

## 🎉 Après Publication

1. **Monitoring** : Installer un outil d'analytics (ex: Firebase Analytics)
2. **Crash Reporting** : Configurer Sentry ou Bugsnag
3. **Feedback** : Ajouter un système de retour utilisateur
4. **Reviews** : Demander aux utilisateurs de noter l'app

---

**Bon déploiement ! 🚀**

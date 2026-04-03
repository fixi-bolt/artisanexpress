# 🧪 Guide de test en temps réel - ArtisanNow

## 🎯 Objectif

Ce guide explique comment tester l'application **ArtisanNow** en temps réel sur différents environnements.

---

## 🖥️ 1. Test sur Web (navigateur)

### Démarrage rapide :

```bash
# Dans le terminal, à la racine du projet
npx expo start --web
```

ou via Rork :

```bash
# Dans la console Rork
rork app
```

### Accès :

- **URL locale** : http://localhost:8081
- **URL réseau** : http://[VOTRE_IP]:8081 (pour tester depuis mobile)

### Avantages :
✅ Rechargement instantané (Fast Refresh)
✅ DevTools intégrés (Console, Network, etc.)
✅ Pas besoin d'émulateur
✅ Idéal pour le design et la logique

### Limitations :
⚠️ Certaines APIs natives limitées (caméra, notifications push)
⚠️ Performance différente du mobile

---

## 📱 2. Test sur mobile avec Expo Go

### Prérequis :

**iOS :**
- Installer **Expo Go** depuis l'App Store
- iPhone/iPad avec iOS 13+

**Android :**
- Installer **Expo Go** depuis le Google Play Store
- Android 5.0+ (API 21+)

### Démarrage :

```bash
# Dans le terminal
npx expo start
```

### Connexion :

**iOS :**
1. Ouvrir l'app **Caméra** native
2. Scanner le QR code affiché dans le terminal
3. Appuyer sur la notification Expo

**Android :**
1. Ouvrir l'app **Expo Go**
2. Scanner le QR code depuis l'onglet "Scan QR"

### Avantages :
✅ Test sur vrai device mobile
✅ Toutes les APIs natives disponibles
✅ Performance réelle
✅ Test de gestures tactiles
✅ Rechargement automatique (Fast Refresh)

### Limitations :
⚠️ Nécessite connexion au même réseau WiFi
⚠️ Limité aux modules Expo (pas de code natif custom)

---

## 🔧 3. Test sur émulateur/simulateur

### iOS Simulator (macOS uniquement) :

```bash
# Installer les outils iOS
npx expo run:ios

# Ou démarrer le simulateur directement
npx expo start --ios
```

### Android Emulator :

**Prérequis :**
- Android Studio installé
- Émulateur Android configuré (AVD)

```bash
# Démarrer l'émulateur
npx expo start --android

# Ou
npx expo run:android
```

### Avantages :
✅ Pas besoin de device physique
✅ Test de différentes tailles d'écran
✅ Debug natif possible

### Limitations :
⚠️ Performance simulée (pas toujours représentatif)
⚠️ Certaines features limitées (GPS, caméra)

---

## 🚀 4. Build natif (production-like)

### iOS (macOS + Xcode requis) :

```bash
# Build et install sur simulateur
npx expo run:ios --configuration Release

# Build sur device physique (nécessite Apple Developer)
npx expo run:ios --device
```

### Android :

```bash
# Build et install sur émulateur
npx expo run:android --variant release

# Build sur device physique (via USB)
npx expo run:android --device
```

### Avantages :
✅ Build optimisé (comme en production)
✅ Test de performance réelle
✅ Test de toutes les features natives

### Limitations :
⚠️ Temps de build plus long
⚠️ Pas de Fast Refresh

---

## 🔥 5. Test des fonctionnalités spécifiques

### 🗺️ Google Maps (déjà configuré)

**Test :**
1. Créer une nouvelle demande client
2. Vérifier l'affichage de la carte
3. Chercher une adresse
4. Voir les artisans à proximité

**Points de contrôle :**
- ✅ Carte s'affiche correctement
- ✅ Géolocalisation fonctionne
- ✅ Autocomplete d'adresses
- ✅ Marqueurs artisans visibles

---

### 💳 Stripe Payments (mode test)

**Cartes de test Stripe :**
```
Carte qui réussit :
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
Code postal : 12345

Carte qui échoue :
Numéro : 4000 0000 0000 0002
```

**Test :**
1. Créer une demande
2. Accepter par un artisan
3. Procéder au paiement
4. Vérifier dans Stripe Dashboard

**Points de contrôle :**
- ✅ Interface de paiement s'affiche
- ✅ Validation des champs
- ✅ Confirmation de paiement
- ✅ Transaction visible dans Stripe

---

### 🎙️ Voice AI (si OpenAI configuré)

**Test :**
1. Aller sur la page de création de demande
2. Appuyer sur le bouton micro 🎙️
3. Parler : "J'ai une fuite d'eau dans la cuisine"
4. Vérifier le remplissage automatique

**Points de contrôle :**
- ✅ Permissions micro accordées
- ✅ Enregistrement audio démarre
- ✅ Conversion voix → texte
- ✅ Formulaire rempli automatiquement

---

### 📸 Computer Vision (si Vision API configurée)

**Test :**
1. Créer une demande
2. Ajouter une photo (fuite, câble, etc.)
3. Attendre l'analyse IA
4. Vérifier les suggestions

**Points de contrôle :**
- ✅ Upload photo réussi
- ✅ Analyse IA effectuée
- ✅ Catégorie suggérée pertinente
- ✅ Estimation de coût affichée

---

### 📱 Push Notifications

**Test :**
1. Accepter les notifications lors du premier lancement
2. Créer une demande (client)
3. Accepter la demande (artisan)
4. Vérifier la réception des notifications

**Points de contrôle :**
- ✅ Permission notifications accordée
- ✅ Token enregistré
- ✅ Notification reçue
- ✅ Deep link fonctionne (ouvre l'app)

---

## 🐛 Debug et logs

### Afficher les logs :

```bash
# Logs complets
npx expo start

# Puis presser :
# - 'j' pour ouvrir le debugger
# - 'm' pour ouvrir le menu
# - 'r' pour reload
# - 'shift + m' pour changer le mode
```

### Console logs dans l'app :

L'application utilise `console.log` extensivement pour le debug :
- 🟢 Actions utilisateur
- 🔵 Requêtes API
- 🟡 Warnings
- 🔴 Erreurs

### React DevTools :

```bash
# Installer globally
npm install -g react-devtools

# Lancer
react-devtools
```

---

## 🎨 Test du design responsive

### Tailles d'écran à tester :

**Mobile :**
- iPhone SE (375x667) - Petit écran
- iPhone 14 (390x844) - Standard
- iPhone 14 Pro Max (430x932) - Grand écran
- Samsung Galaxy S21 (360x800)
- Pixel 7 (412x915)

**Tablette :**
- iPad Mini (768x1024)
- iPad Pro (1024x1366)

### Dans le navigateur :

1. Ouvrir DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Sélectionner différentes tailles

---

## ⚡ Performance testing

### Metrics à surveiller :

**Temps de chargement :**
- Initial load : < 3s
- Navigation : < 500ms
- Images : < 1s

**Mémoire :**
- Usage RAM : < 200MB
- Pas de memory leaks

**Réseau :**
- API calls : < 2s
- Retry sur échec
- Offline mode graceful

### Outils :

- React DevTools Profiler
- Chrome DevTools Performance
- Flipper (debug natif)

---

## 📊 Test des flows complets

### Flow Client :

1. ✅ Onboarding / Login
2. ✅ Créer une demande (avec/sans photo)
3. ✅ Voir les artisans disponibles
4. ✅ Accepter un artisan
5. ✅ Suivre en temps réel
6. ✅ Payer
7. ✅ Noter l'artisan

### Flow Artisan :

1. ✅ Inscription / Vérification
2. ✅ Voir les demandes disponibles
3. ✅ Accepter une mission
4. ✅ Navigation vers le client
5. ✅ Compléter la mission
6. ✅ Recevoir le paiement
7. ✅ Voir les revenus

### Flow Admin :

1. ✅ Dashboard analytics
2. ✅ Gérer utilisateurs
3. ✅ Modérer missions
4. ✅ Voir transactions
5. ✅ Support client

---

## 🔒 Test de sécurité

### Points de contrôle :

- ✅ Authentification requise pour actions sensibles
- ✅ Validation des inputs côté client ET serveur
- ✅ Clés API protégées (pas exposées côté client)
- ✅ HTTPS en production
- ✅ Rate limiting sur les APIs
- ✅ Pas de logs sensibles (mots de passe, tokens)

---

## 🌍 Test multi-langues

```typescript
// Changer la langue dans l'app
import { useLocalization } from '@/contexts/LocalizationContext';

const { changeLanguage } = useLocalization();
changeLanguage('en'); // ou 'fr'
```

**Langues supportées :**
- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇪🇸 Espagnol (à venir)

---

## 📝 Checklist avant déploiement

### Fonctionnel :
- [ ] Tous les flows testés
- [ ] Paiements testés (Stripe test mode)
- [ ] Notifications fonctionnelles
- [ ] Maps et géolocalisation OK
- [ ] Upload photos OK
- [ ] Chat temps réel OK

### Performance :
- [ ] Pas de crash
- [ ] Pas de freeze UI
- [ ] Chargement < 3s
- [ ] Animations fluides (60fps)

### Design :
- [ ] Responsive toutes tailles
- [ ] Dark mode fonctionne
- [ ] Icônes et images OK
- [ ] Pas de texte tronqué

### Sécurité :
- [ ] Clés API protégées
- [ ] Authentification forcée
- [ ] Validation inputs
- [ ] Pas de logs sensibles

### Accessibilité :
- [ ] Contrastes suffisants
- [ ] Taille de police lisible
- [ ] Labels pour screen readers

---

## 🆘 Problèmes fréquents

### "No base url found"

**Solution :**
```bash
# Vérifier .env
EXPO_PUBLIC_RORK_API_BASE_URL=https://toolkit.rork.com
```

### "Cannot read property of undefined"

**Solution :**
- Vérifier que les providers sont bien wrappés dans `_layout.tsx`
- Vérifier l'ordre des providers

### Carte Google Maps ne s'affiche pas

**Solution :**
```bash
# Vérifier .env
GOOGLE_MAPS_API_KEY=AIzaSy...

# Vérifier app.json
"config": {
  "googleMapsApiKey": "AIzaSy..."
}
```

### Paiement Stripe échoue

**Solution :**
- Vérifier mode test activé : `USE_STRIPE_TEST_MODE=true`
- Utiliser carte de test : `4242 4242 4242 4242`
- Vérifier les clés commencent par `pk_test_` et `sk_test_`

---

## 📞 Support

**Questions ou bugs ?**
- Documentation : `/docs`
- Email : support@artisannow.app
- GitHub Issues : (si applicable)

---

## 🎉 Prêt pour le test !

```bash
# Commande magique pour tout démarrer
npx expo start

# Puis :
# - Presser 'w' pour web
# - Scanner QR pour mobile
# - Presser 'i' pour iOS simulator
# - Presser 'a' pour Android emulator
```

**Bon test ! 🚀**

# 🤖 Configuration des fonctionnalités IA - ArtisanNow

## 📋 Vue d'ensemble

Ce guide explique comment activer et configurer les fonctionnalités d'intelligence artificielle avancées dans ArtisanNow :

- 🧠 **Computer Vision** : Analyse automatique des problèmes via photo
- 🎙️ **Voice AI** : Assistant vocal pour décrire les problèmes
- 💬 **Chat Assistant** : Assistant conversationnel intelligent
- 💰 **Dynamic Pricing** : Tarification dynamique basée sur l'IA
- 🎯 **Smart Recommendations** : Recommandations d'artisans intelligentes

---

## 🚀 Configuration rapide

### ✅ Déjà configuré dans votre projet :

- ✅ **Google Maps API** : Activée avec 31 APIs
- ✅ **Stripe (Test Mode)** : Clés configurées
- ✅ **Expo Toolkit** : URL configurée pour l'IA intégrée

### 🔑 Clés API nécessaires pour l'IA :

#### 1️⃣ OpenAI (GPT-4 + DALL-E)

**Utilisation :**
- Chat assistant intelligent
- Génération de descriptions
- Estimation de coûts
- Suggestions de catégories

**Comment obtenir :**
1. Créer un compte sur : https://platform.openai.com
2. Aller dans "API Keys" : https://platform.openai.com/api-keys
3. Cliquer sur "Create new secret key"
4. Copier la clé (format : `sk-proj-...`)

**Ajouter dans `.env` :**
```bash
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE
```

**Coût estimé :**
- GPT-4 Turbo : ~0.01€ par requête
- GPT-3.5 Turbo : ~0.002€ par requête
- Budget mensuel recommandé : 50-100€ pour débuter

---

#### 2️⃣ Google Cloud Vision API

**Utilisation :**
- Analyse automatique des photos de problèmes
- Détection d'objets (fuite, câble, serrure, etc.)
- Extraction de texte (OCR)
- Classification automatique

**Comment obtenir :**
1. Aller sur : https://console.cloud.google.com
2. Sélectionner votre projet existant (celui avec Maps API)
3. Activer **Cloud Vision API** :
   - Menu → "APIs & Services" → "Library"
   - Rechercher "Cloud Vision API"
   - Cliquer "Enable"
4. Créer une clé API :
   - Menu → "APIs & Services" → "Credentials"
   - "Create Credentials" → "API Key"
   - (Utiliser la même clé que Google Maps si restrictions OK)

**Ajouter dans `.env` :**
```bash
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg
```

**Note :** Vous pouvez utiliser la même clé Google Maps si elle n'est pas restreinte par API.

**Coût estimé :**
- 1 000 premières images/mois : **GRATUIT**
- Au-delà : 1,50€ pour 1 000 images
- Largement suffisant pour commencer

---

#### 3️⃣ Google Cloud Speech-to-Text API (Voice AI)

**Utilisation :**
- Conversion voix → texte
- Assistant vocal pour décrire les problèmes
- Support multi-langues (français, anglais, etc.)

**Comment obtenir :**
1. Même console Google Cloud que ci-dessus
2. Activer **Speech-to-Text API** :
   - Menu → "APIs & Services" → "Library"
   - Rechercher "Cloud Speech-to-Text API"
   - Cliquer "Enable"
3. Utiliser la même clé API que Google Maps/Vision

**Ajouter dans `.env` :**
```bash
GOOGLE_CLOUD_SPEECH_API_KEY=AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg
```

**Coût estimé :**
- 60 premières minutes/mois : **GRATUIT**
- Au-delà : 0,006€/15 secondes
- Très économique pour une startup

---

## 🧪 Mode de test (sans clés IA)

L'application fonctionne **sans clés IA** avec des fonctionnalités simulées :

- 🎯 Suggestions de catégories basiques (règles prédéfinies)
- 💰 Estimation de coûts par défaut (fourchette moyenne)
- 🗺️ Matching géographique simple (distance)

Pour activer les fonctionnalités avancées, il suffit d'ajouter les clés API.

---

## 📊 Récapitulatif des coûts mensuels

| Service | Coût mensuel estimé | Usage |
|---------|---------------------|-------|
| Google Maps API | 0-50€ | Inclus : 28 000 requêtes gratuites/mois |
| Google Vision API | 0€ | 1 000 images gratuites/mois |
| Google Speech-to-Text | 0€ | 60 minutes gratuites/mois |
| OpenAI GPT-4 | 50-100€ | ~5 000 requêtes |
| Stripe | 0€ + 1,4% + 0,25€ | Commission par transaction |
| **TOTAL** | **50-150€/mois** | Pour une phase de test/MVP |

---

## 🔒 Sécurité et bonnes pratiques

### ✅ À faire :

1. **Ne JAMAIS committer les clés dans Git**
   - `.env` est déjà dans `.gitignore`
   - Utiliser `.env.example` comme template

2. **Restreindre les clés Google Cloud**
   ```
   API restrictions : Sélectionner les APIs utilisées seulement
   Application restrictions : Limiter aux domaines autorisés
   ```

3. **Activer la facturation avec alerte**
   ```
   Google Cloud Console → Billing → Budgets & Alerts
   Définir un budget de 100€/mois avec alerte à 80%
   ```

4. **Utiliser Stripe en mode TEST**
   ```
   STRIPE_PUBLIC_KEY commence par pk_test_
   STRIPE_SECRET_KEY commence par sk_test_
   USE_STRIPE_TEST_MODE=true
   ```

5. **Monitorer l'usage**
   - Google Cloud Console : Dashboard → Quotas
   - OpenAI : https://platform.openai.com/usage
   - Stripe : Dashboard → Developers → Logs

### ⚠️ À éviter :

- ❌ Exposer les clés API côté client (sauf STRIPE_PUBLIC_KEY et GOOGLE_MAPS_API_KEY)
- ❌ Utiliser les clés de production en développement
- ❌ Laisser les clés sans restriction
- ❌ Oublier de mettre des limites de budget

---

## 🧪 Tester en temps réel

### Sur le web (développement) :

```bash
# Terminal 1 : Démarrer l'app
npx expo start --web

# Ouvrir dans le navigateur
http://localhost:8081
```

### Sur mobile (Expo Go) :

```bash
# Démarrer Expo
npx expo start

# Scanner le QR code avec :
# - iOS : App "Caméra"
# - Android : App "Expo Go"
```

### Sur mobile (build natif) :

Pour iOS :
```bash
# Installer sur simulateur
npx expo run:ios
```

Pour Android :
```bash
# Installer sur émulateur ou device
npx expo run:android
```

---

## 🎯 Activation par fonctionnalité

### 1️⃣ Computer Vision (Analyse photo)

**Fichiers concernés :**
- `backend/trpc/routes/ai/vision-analyze/route.ts`
- `components/AIProblemAnalyzer.tsx`

**Test :**
1. Créer une nouvelle demande client
2. Ajouter une photo
3. L'IA analyse automatiquement le problème
4. Affiche suggestions de catégorie et estimation

**Configuration requise :**
```env
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...
```

---

### 2️⃣ Voice AI (Assistant vocal)

**Fichiers concernés :**
- `components/VoiceAssistant.tsx`
- Speech-to-Text intégré (Expo toolkit)

**Test :**
1. Ouvrir la page de création de demande
2. Appuyer sur le bouton micro 🎙️
3. Parler : "J'ai une fuite d'eau dans la cuisine"
4. L'IA remplit automatiquement le formulaire

**Configuration requise :**
```env
GOOGLE_CLOUD_SPEECH_API_KEY=AIzaSy...
```

---

### 3️⃣ Chat Assistant

**Fichiers concernés :**
- `app/ai-assistant.tsx`
- `backend/trpc/routes/ai/chat-assistant/route.ts`

**Test :**
1. Ouvrir l'assistant IA depuis le menu
2. Poser une question : "Quel artisan pour une fuite ?"
3. L'IA répond avec suggestions pertinentes

**Configuration requise :**
```env
OPENAI_API_KEY=sk-proj-...
```

---

### 4️⃣ Dynamic Pricing

**Fichiers concernés :**
- `backend/trpc/routes/ai/dynamic-pricing/route.ts`
- `backend/trpc/routes/ml/dynamic-price/route.ts`

**Test :**
1. Créer une demande
2. Le prix s'ajuste automatiquement selon :
   - Distance
   - Urgence
   - Disponibilité artisans
   - Historique

**Configuration requise :**
```env
OPENAI_API_KEY=sk-proj-...
```

---

### 5️⃣ Smart Recommendations

**Fichiers concernés :**
- `backend/trpc/routes/recommendations/get-smart-recommendations/route.ts`
- `backend/trpc/routes/matching/find-best-artisans/route.ts`

**Test :**
1. Créer plusieurs demandes
2. L'IA apprend vos préférences
3. Suggère les meilleurs artisans

**Configuration requise :**
```env
OPENAI_API_KEY=sk-proj-...
```

---

## 📚 Ressources supplémentaires

- **Google Cloud Console** : https://console.cloud.google.com
- **OpenAI Documentation** : https://platform.openai.com/docs
- **Stripe Dashboard** : https://dashboard.stripe.com
- **Expo Documentation** : https://docs.expo.dev

---

## 🆘 Besoin d'aide ?

**Support ArtisanNow :**
- Email : support@artisannow.app
- Documentation : /docs
- GitHub Issues : (si applicable)

**Support APIs :**
- Google Cloud Support : https://cloud.google.com/support
- OpenAI Support : https://help.openai.com
- Stripe Support : https://support.stripe.com

---

## 🎉 Prochaines étapes

Une fois les APIs configurées :

1. ✅ Tester chaque fonctionnalité IA individuellement
2. ✅ Monitorer les coûts pendant 1 semaine
3. ✅ Ajuster les limites et quotas
4. ✅ Passer en production avec clés LIVE (Stripe, etc.)
5. ✅ Configurer le monitoring (Sentry, Analytics)

**Objectif :** Application prête pour levée de fonds Série A ! 🚀

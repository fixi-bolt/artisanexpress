# 🚀 Guide de Déploiement Complet - ArtisanNow

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Configuration des APIs](#configuration-des-apis)
3. [Base de données](#base-de-données)
4. [Déploiement Backend](#déploiement-backend)
5. [Déploiement Web](#déploiement-web)
6. [Application Mobile](#application-mobile)
7. [Tests finaux](#tests-finaux)

---

## 1. Prérequis

### Comptes nécessaires
- [ ] Compte Google Cloud (pour Maps, Vision, Speech)
- [ ] Compte Stripe (pour paiements)
- [ ] Compte Supabase ou Firebase (base de données)
- [ ] Compte Expo (pour notifications push)
- [ ] Compte Vercel/Netlify/Railway (pour hébergement)
- [ ] Nom de domaine (ex: artisannow.app)

### Outils à installer localement
```bash
# Node.js 18+
node --version

# Bun (gestionnaire de paquets)
curl -fsSL https://bun.sh/install | bash

# Expo CLI
npm install -g expo-cli

# Git
git --version
```

---

## 2. Configuration des APIs

### 🗺️ Google Maps API

#### Étapes:
1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Créer un nouveau projet "ArtisanNow"
3. Activer les APIs suivantes:
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Directions API
   - **Vision API** (pour analyse d'images)
   - **Speech-to-Text API** (pour assistant vocal)

4. Créer une clé API:
   - Navigation > APIs & Services > Credentials
   - Create Credentials > API Key
   - Restreindre la clé:
     ```
     Application restrictions: HTTP referrers
     Website restrictions:
     - https://artisannow.app/*
     - https://*.artisannow.app/*
     - localhost:* (pour développement)
     
     API restrictions: Restrict key
     - Maps JavaScript API
     - Geocoding API
     - Places API
     - Directions API
     - Cloud Vision API
     - Cloud Speech-to-Text API
     ```

5. Ajouter dans `.env`:
```env
GOOGLE_MAPS_API_KEY=AIzaSy...votre_clé
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...votre_clé
GOOGLE_CLOUD_SPEECH_API_KEY=AIzaSy...votre_clé
```

**⚠️ Important**: Activez la facturation sur Google Cloud (carte bancaire requise). Google offre $300 de crédit gratuit pour 90 jours.

---

### 💳 Stripe Payments

#### Étapes:
1. Créer un compte sur [Stripe](https://dashboard.stripe.com)
2. Mode Test d'abord:
   - Dashboard > Developers > API keys
   - Copier `Publishable key` et `Secret key`

3. Configurer Webhooks:
   ```
   URL: https://api.artisannow.app/api/stripe/webhook
   Événements à écouter:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - customer.created
   - charge.refunded
   ```

4. Ajouter dans `.env`:
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
COMMISSION_PERCENTAGE=0.15
```

5. **Passage en production**:
   - Activer le compte Stripe (KYC requis)
   - Remplacer par les clés de production: `pk_live_...` et `sk_live_...`

---

### 🔐 Supabase (Base de données + Auth)

#### Étapes:
1. Créer un projet sur [Supabase](https://app.supabase.com)
2. Nom du projet: "ArtisanNow"
3. Région: Europe West (Paris) - pour RGPD

4. Créer les tables SQL:
```sql
-- Table Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  type TEXT CHECK (type IN ('client', 'artisan', 'admin')),
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Artisans (détails supplémentaires)
CREATE TABLE artisans (
  id UUID PRIMARY KEY REFERENCES users(id),
  category TEXT NOT NULL,
  hourly_rate NUMERIC,
  available BOOLEAN DEFAULT true,
  latitude NUMERIC,
  longitude NUMERIC,
  certifications TEXT[]
);

-- Table Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES users(id),
  artisan_id UUID REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  price NUMERIC,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Table Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  stripe_payment_id TEXT UNIQUE,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES missions(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_artisans_category ON artisans(category);
CREATE INDEX idx_artisans_location ON artisans(latitude, longitude);
```

5. Configurer Authentication:
   - Settings > Authentication
   - Email provider: Activé
   - Google OAuth (optionnel)

6. Ajouter dans `.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

### 📱 Expo Push Notifications

#### Étapes:
1. Créer un projet Expo: [expo.dev](https://expo.dev)
2. Lier votre projet local:
```bash
expo login
eas init
```

3. Obtenir le token push:
```bash
expo push:android:show
expo push:ios:show
```

4. Ajouter dans `.env`:
```env
EXPO_PUSH_TOKEN=ExponentPushToken[...]
EXPO_PROJECT_ID=votre-project-id
```

---

### 🤖 OpenAI (pour IA)

1. Compte sur [OpenAI Platform](https://platform.openai.com)
2. Générer une API key
3. Ajouter dans `.env`:
```env
OPENAI_API_KEY=sk-proj-...
```

**Note**: L'app utilise déjà `@rork/toolkit-sdk` qui inclut de l'IA, mais OpenAI peut être utilisé pour des fonctionnalités avancées.

---

## 3. Base de données

### Option A: Supabase (Recommandé)
✅ Déjà configuré ci-dessus avec tables SQL

### Option B: Firebase
Si vous préférez Firebase:
1. [Console Firebase](https://console.firebase.google.com)
2. Créer un projet
3. Activer:
   - Authentication (Email + Google)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions

4. Ajouter dans `.env`:
```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_PROJECT_ID=artisannow
FIREBASE_AUTH_DOMAIN=artisannow.firebaseapp.com
FIREBASE_STORAGE_BUCKET=artisannow.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
```

---

## 4. Déploiement Backend

### Option A: Vercel (Recommandé pour Hono + tRPC)

1. Installer Vercel CLI:
```bash
npm i -g vercel
```

2. Déployer:
```bash
vercel login
vercel
```

3. Configurer les variables d'environnement:
```bash
vercel env add GOOGLE_MAPS_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add SUPABASE_URL
# ... toutes les autres
```

4. Le backend sera accessible à: `https://artisannow.vercel.app`

### Option B: Railway

1. Compte sur [Railway](https://railway.app)
2. New Project > Deploy from GitHub
3. Variables d'environnement: copier tout le contenu de `.env`
4. Deploy

### Option C: Render

1. Compte sur [Render](https://render.com)
2. New Web Service
3. Connect repository
4. Build command: `bun install`
5. Start command: `bun run backend/hono.ts`

---

## 5. Déploiement Web (React Native Web)

### Avec Vercel

1. Créer `vercel.json`:
```json
{
  "buildCommand": "expo export -p web",
  "outputDirectory": "dist",
  "framework": "expo",
  "env": {
    "EXPO_PUBLIC_TOOLKIT_URL": "https://toolkit.rork.com",
    "EXPO_PUBLIC_RORK_API_BASE_URL": "https://toolkit.rork.com"
  }
}
```

2. Déployer:
```bash
vercel --prod
```

### Avec Netlify

1. `netlify.toml`:
```toml
[build]
  command = "expo export -p web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. Déployer:
```bash
netlify deploy --prod
```

---

## 6. Application Mobile

### Build avec EAS (Expo Application Services)

**⚠️ Important**: Vous ne pouvez pas faire de build natif dans cet environnement. Vous devrez le faire localement ou via Expo EAS.

#### Pour Android (APK/AAB):

1. Configuration initiale:
```bash
eas build:configure
```

2. Modifier `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

3. Lancer le build:
```bash
eas build --platform android --profile production
```

4. Récupérer l'APK et le distribuer ou le soumettre sur Google Play

#### Pour iOS (IPA):

**Requis**:
- Compte Apple Developer ($99/an)
- Certificats de distribution

```bash
eas build --platform ios --profile production
```

### Distribution

#### Google Play Store:
1. [Console Google Play](https://play.google.com/console)
2. Créer une application
3. Remplir le listing:
   - Titre: "ArtisanNow - Artisans à la demande"
   - Description courte: "Trouvez un artisan en quelques secondes, comme Uber"
   - Catégorie: "Maison et habitation"
4. Uploader l'AAB
5. Content rating, prix gratuit
6. Publier

#### Apple App Store:
1. [App Store Connect](https://appstoreconnect.apple.com)
2. Créer une nouvelle app
3. Bundle ID: com.artisannow.app
4. Métadonnées et screenshots
5. Soumettre pour review

---

## 7. Configuration du domaine

### DNS Configuration (chez votre registrar):

```
Type    Name        Value
A       @           76.76.21.21 (IP Vercel)
CNAME   www         cname.vercel-dns.com
CNAME   api         artisannow-api.vercel.app
CNAME   app         artisannow.vercel.app
```

### HTTPS / SSL:
✅ Automatique avec Vercel/Netlify/Railway

---

## 8. Tests finaux

### Checklist avant lancement:

- [ ] Toutes les clés API sont en production (pas de test)
- [ ] Variables d'environnement configurées sur le serveur
- [ ] Base de données accessible et sécurisée
- [ ] Paiements Stripe en mode live
- [ ] Notifications push fonctionnelles
- [ ] Google Maps s'affiche correctement
- [ ] Webhooks Stripe configurés et testés
- [ ] Upload de photos fonctionne
- [ ] Chat en temps réel opérationnel
- [ ] Géolocalisation activée
- [ ] Tests sur iOS et Android
- [ ] Tests sur navigateurs (Chrome, Safari, Firefox)
- [ ] RGPD: Politique de confidentialité + CGU ajoutées
- [ ] Mentions légales présentes
- [ ] Support client configuré (email/chat)

### Tests de charge:
```bash
# Installer k6 pour tests de performance
brew install k6

# Tester l'API
k6 run load-test.js
```

---

## 9. Monitoring & Analytics

### Sentry (Erreurs)
```bash
npm install @sentry/react-native
```

Ajouter dans `.env`:
```env
SENTRY_DSN=https://...@sentry.io/...
```

### Google Analytics
```env
GA_TRACKING_ID=G-XXXXXXXXXX
```

### Mixpanel (Analytics avancées)
```env
MIXPANEL_TOKEN=your_token
```

---

## 10. Coûts estimés mensuels

| Service | Gratuit | Payant (1000 users) |
|---------|---------|---------------------|
| Google Maps | $200 crédit | ~$50-200/mois |
| Stripe | Gratuit | 1.4% + 0.25€ par transaction |
| Supabase | 2 projets gratuits | $25/mois (Pro) |
| Vercel | Gratuit | $20/mois (Pro) |
| Expo EAS | 1 build/mois gratuit | $29/mois (Production) |
| **TOTAL** | **~$0** | **~$150-300/mois** |

---

## 🆘 Support

En cas de problème:
1. Vérifier les logs sur Vercel/Railway
2. Console Google Cloud pour erreurs API
3. Stripe Dashboard pour problèmes de paiement
4. Supabase Logs pour base de données

---

## 📚 Ressources

- [Documentation Expo](https://docs.expo.dev)
- [Stripe Docs](https://stripe.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Google Maps Platform](https://developers.google.com/maps)
- [Vercel Docs](https://vercel.com/docs)

---

✅ **Une fois tout configuré, votre app sera 100% fonctionnelle en production !**

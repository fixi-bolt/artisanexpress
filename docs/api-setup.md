# 🔧 Guide de Configuration des APIs - ArtisanNow

Ce guide vous accompagne dans la configuration complète de toutes les APIs et services externes nécessaires au fonctionnement d'ArtisanNow.

---

## 📋 Table des matières

1. [Google Maps & Geolocation](#1-google-maps--geolocation)
2. [Stripe Payments](#2-stripe-payments)
3. [Supabase Database & Auth](#3-supabase-database--auth)
4. [Firebase (Alternative)](#4-firebase-alternative)
5. [Push Notifications](#5-push-notifications)
6. [Intelligence Artificielle](#6-intelligence-artificielle)
7. [Email Service](#7-email-service)
8. [SMS Notifications](#8-sms-notifications)
9. [Analytics & Monitoring](#9-analytics--monitoring)
10. [Cloud Storage](#10-cloud-storage)
11. [Vérification de la configuration](#11-vérification-de-la-configuration)

---

## 1. 🗺️ Google Maps & Geolocation

### Étapes de configuration

#### 1.1 Créer un projet Google Cloud

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Cliquer sur **Créer un projet**
3. Nommer le projet : `ArtisanNow`
4. Attendre la création (environ 30 secondes)

#### 1.2 Activer les APIs nécessaires

Dans le menu de navigation > **APIs et services** > **Bibliothèque**, activer les APIs suivantes :

- ✅ **Maps JavaScript API** (affichage des cartes)
- ✅ **Geocoding API** (conversion adresse ↔ coordonnées)
- ✅ **Places API** (suggestions d'adresses, autocomplétion)
- ✅ **Directions API** (calcul d'itinéraires)
- ✅ **Distance Matrix API** (calcul de distances)
- ✅ **Geolocation API** (localisation via IP/WiFi)

#### 1.3 Créer une clé API

1. Aller dans **APIs et services** > **Identifiants**
2. Cliquer sur **Créer des identifiants** > **Clé API**
3. Copier la clé générée

#### 1.4 Restreindre la clé API (SÉCURITÉ IMPORTANTE)

1. Cliquer sur la clé créée pour l'éditer
2. **Restrictions d'application** :
   - Pour le web : sélectionner "Références HTTP" et ajouter :
     - `https://artisannow.app/*`
     - `https://*.artisannow.app/*`
     - `http://localhost:*` (pour développement)
   - Pour mobile : sélectionner "Applications Android/iOS" et ajouter les bundle IDs
3. **Restrictions d'API** :
   - Sélectionner "Restreindre la clé"
   - Cocher uniquement les 6 APIs activées ci-dessus
4. Sauvegarder

#### 1.5 Configuration dans .env

```bash
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### 1.6 Facturation

⚠️ **Important** : Activer la facturation pour lever les limites gratuites.

- Crédit gratuit : 200 $/mois
- Au-delà : tarification au coût par requête
- Configurer des alertes de budget pour éviter les surprises

---

## 2. 💳 Stripe Payments

### Étapes de configuration

#### 2.1 Créer un compte Stripe

1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/register)
2. Créer un compte (email professionnel recommandé)
3. Vérifier l'email

#### 2.2 Mode Test vs Live

🧪 **Mode TEST** (développement) :
- Utiliser les clés commençant par `pk_test_` et `sk_test_`
- Cartes de test disponibles dans la [documentation Stripe](https://stripe.com/docs/testing)

🚀 **Mode LIVE** (production) :
- Compléter l'activation du compte (informations bancaires, KYC)
- Utiliser les clés commençant par `pk_live_` et `sk_live_`

#### 2.3 Récupérer les clés API

1. Dans le Dashboard Stripe > **Développeurs** > **Clés API**
2. Copier :
   - **Clé publiable** (`pk_test_...`) → côté client
   - **Clé secrète** (`sk_test_...`) → côté serveur (⚠️ CONFIDENTIEL)

#### 2.4 Configurer les Webhooks

1. Dans **Développeurs** > **Webhooks**
2. Cliquer sur **Ajouter un point de terminaison**
3. URL du endpoint : `https://api.artisannow.app/api/stripe/webhook`
4. Sélectionner les événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
   - `payout.paid`
5. Copier le **Secret de signature du webhook** (`whsec_...`)

#### 2.5 Configuration dans .env

```bash
STRIPE_PUBLIC_KEY=pk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COMMISSION_PERCENTAGE=0.15
```

#### 2.6 Test de paiement

Cartes de test à utiliser :
- ✅ Succès : `4242 4242 4242 4242`
- ❌ Échec : `4000 0000 0000 0002`
- 🔐 3D Secure : `4000 0027 6000 3184`

Date d'expiration : n'importe quelle date future  
CVC : n'importe quel 3 chiffres

---

## 3. 🔐 Supabase Database & Auth

### Étapes de configuration

#### 3.1 Créer un projet Supabase

1. Aller sur [Supabase](https://app.supabase.com)
2. Se connecter avec GitHub
3. Cliquer sur **New Project**
4. Remplir :
   - **Name** : `artisannow`
   - **Database Password** : générer un mot de passe fort (le sauvegarder !)
   - **Region** : `Europe West (Ireland)` ou `Europe West (Paris)`
5. Attendre la création (2-3 minutes)

#### 3.2 Récupérer les clés API

1. Dans le projet > **Settings** > **API**
2. Copier :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public** : clé publique (safe pour le client)
   - **service_role** : clé secrète (⚠️ backend uniquement)

#### 3.3 Configuration dans .env

```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2XXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTXXXXXXXX
```

#### 3.4 Créer les tables de la base de données

Dans **SQL Editor**, exécuter le script suivant :

```sql
-- Table Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('client', 'artisan', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Artisans (profil artisan)
CREATE TABLE artisans (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  bio TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  total_missions INTEGER DEFAULT 0,
  hourly_rate NUMERIC(10,2),
  available BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Requests (demandes clients)
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES artisans(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  address TEXT,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount NUMERIC(10,2) NOT NULL,
  commission NUMERIC(10,2),
  artisan_amount NUMERIC(10,2),
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES artisans(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Messages (chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX idx_artisans_location ON artisans(latitude, longitude);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_client ON requests(client_id);
CREATE INDEX idx_requests_artisan ON requests(artisan_id);
CREATE INDEX idx_messages_request ON messages(request_id);
CREATE INDEX idx_ratings_artisan ON ratings(artisan_id);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies basiques (à personnaliser selon vos besoins)
CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
```

#### 3.5 Configurer l'authentification

1. Dans **Authentication** > **Providers**
2. Activer :
   - ✅ Email (avec confirmation email)
   - ✅ Google OAuth (optionnel)
   - ✅ Phone (SMS via Twilio, optionnel)

---

## 4. 🔥 Firebase (Alternative ou Complément)

### Utilisation recommandée

Si vous utilisez déjà Supabase, Firebase peut servir pour :
- 📱 **Firebase Cloud Messaging** (push notifications)
- 🖼️ **Firebase Storage** (stockage de photos)
- 📊 **Firebase Analytics** (tracking utilisateur)

### Étapes de configuration

#### 4.1 Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Cliquer sur **Ajouter un projet**
3. Nom : `ArtisanNow`
4. Activer Google Analytics (recommandé)
5. Sélectionner un compte Analytics ou en créer un

#### 4.2 Ajouter une application

1. Cliquer sur l'icône **Web** (`</>`)
2. Nom de l'app : `ArtisanNow Web`
3. Cocher "Configurer Firebase Hosting" (optionnel)
4. Copier la configuration fournie

#### 4.3 Activer les services

**Authentication** :
1. Aller dans **Authentication** > **Commencer**
2. Activer les méthodes :
   - Email/Mot de passe
   - Google (optionnel)

**Cloud Storage** :
1. Aller dans **Storage** > **Commencer**
2. Mode de sécurité : **Mode test** (développement) ou **Mode production** (avec règles)
3. Région : `europe-west` (plus proche)

**Cloud Messaging** :
1. Aller dans **Paramètres du projet** > **Cloud Messaging**
2. Générer une clé serveur (legacy) si nécessaire
3. Copier l'**ID de l'expéditeur**

#### 4.4 Configuration dans .env

```bash
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_PROJECT_ID=artisannow-xxxxx
FIREBASE_AUTH_DOMAIN=artisannow-xxxxx.firebaseapp.com
FIREBASE_DATABASE_URL=https://artisannow-xxxxx.firebaseio.com
FIREBASE_STORAGE_BUCKET=artisannow-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef123456
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 5. 📱 Push Notifications

### Option 1 : Expo Push Notifications (recommandé pour Expo)

#### 5.1 Obtenir un token Expo

1. Créer un compte sur [Expo.dev](https://expo.dev)
2. Créer un nouveau projet ou lier le projet existant
3. Aller dans **Project Settings** > **Push Notifications**
4. Générer un **Access Token**

#### 5.2 Configuration dans .env

```bash
EXPO_PUSH_TOKEN=ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
EXPO_PROJECT_ID=@username/artisannow
```

#### 5.3 Test d'envoi

Utiliser l'outil Expo Push Notification Tool :
```bash
https://expo.dev/notifications
```

### Option 2 : Firebase Cloud Messaging (FCM)

#### 5.1 Configuration FCM

1. Dans Firebase Console > **Paramètres du projet** > **Cloud Messaging**
2. Copier la **Clé du serveur** (Server Key)

#### 5.2 Configuration dans .env

```bash
FCM_SERVER_KEY=AAAA_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_MESSAGING_SENDER_ID=123456789012
```

---

## 6. 🤖 Intelligence Artificielle

### 6.1 OpenAI (GPT-4, DALL-E, Whisper)

#### Configuration

1. Créer un compte sur [OpenAI Platform](https://platform.openai.com)
2. Aller dans **API Keys**
3. Cliquer sur **Create new secret key**
4. Copier la clé (⚠️ elle ne sera plus visible)

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Utilisation dans ArtisanNow

- **Chat Assistant** : GPT-4 pour répondre aux questions
- **Analyse d'images** : GPT-4 Vision pour détecter les problèmes
- **Génération d'images** : DALL-E 3 pour illustrations
- **Speech-to-Text** : Whisper pour assistant vocal

#### Tarification

- GPT-4 Turbo : ~$0.01 / 1K tokens input, ~$0.03 / 1K tokens output
- GPT-4 Vision : ~$0.01 / image
- DALL-E 3 : ~$0.04 / image (1024x1024)
- Whisper : ~$0.006 / minute

### 6.2 Google Cloud Vision & Speech

#### Configuration

1. Aller sur [Google Cloud Console](https://console.cloud.google.com)
2. Activer **Cloud Vision API** et **Cloud Speech-to-Text API**
3. Créer des identifiants API (clé API)

```bash
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_CLOUD_SPEECH_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Utilisation

- **Vision** : Détection d'objets, OCR, labels
- **Speech** : Transcription vocale en temps réel

### 6.3 Azure Cognitive Services (Alternative)

```bash
AZURE_COGNITIVE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_COGNITIVE_ENDPOINT=https://westeurope.api.cognitive.microsoft.com/
```

---

## 7. 📧 Email Service

### Option 1 : Resend (recommandé, moderne et simple)

#### Configuration

1. Créer un compte sur [Resend](https://resend.com)
2. Vérifier votre domaine (ou utiliser `onboarding@resend.dev` pour test)
3. Créer une clé API

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@artisannow.app
EMAIL_FROM_NAME=ArtisanNow
```

### Option 2 : SendGrid

#### Configuration

1. Créer un compte sur [SendGrid](https://sendgrid.com)
2. Créer une clé API dans **Settings** > **API Keys**
3. Vérifier le domaine expéditeur

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@artisannow.app
EMAIL_FROM_NAME=ArtisanNow
```

### Vérification du domaine

Pour envoyer depuis `@artisannow.app`, configurer les enregistrements DNS :
- **SPF** : `v=spf1 include:_spf.resend.com ~all`
- **DKIM** : fourni par le service email
- **DMARC** : `v=DMARC1; p=none; rua=mailto:dmarc@artisannow.app`

---

## 8. 📲 SMS Notifications (Twilio)

### Configuration

#### 8.1 Créer un compte Twilio

1. Aller sur [Twilio](https://www.twilio.com/try-twilio)
2. S'inscrire et vérifier le numéro de téléphone
3. Obtenir $15 de crédit gratuit

#### 8.2 Acheter un numéro de téléphone

1. Dans la console Twilio > **Phone Numbers** > **Buy a Number**
2. Choisir un numéro français (+33) avec SMS activé
3. Coût : ~1€/mois

#### 8.3 Récupérer les identifiants

1. Aller dans **Account** > **API credentials**
2. Copier :
   - **Account SID**
   - **Auth Token**

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+33612345678
```

---

## 9. 📊 Analytics & Monitoring

### 9.1 Google Analytics

```bash
GA_TRACKING_ID=G-XXXXXXXXXX
```

### 9.2 Sentry (Error Tracking)

1. Créer un compte sur [Sentry.io](https://sentry.io)
2. Créer un projet React Native
3. Copier le DSN

```bash
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o123456.ingest.sentry.io/7654321
```

### 9.3 Mixpanel (User Analytics)

```bash
MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 10. ☁️ Cloud Storage

### Option 1 : AWS S3

#### Configuration

1. Créer un compte AWS
2. Créer un bucket S3 : `artisannow-uploads`
3. Région : `eu-west-3` (Paris)
4. Créer un utilisateur IAM avec accès S3
5. Générer des clés d'accès

```bash
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=eu-west-3
AWS_S3_BUCKET=artisannow-uploads
```

### Option 2 : Google Cloud Storage

```bash
GCS_PROJECT_ID=artisannow
GCS_BUCKET_NAME=artisannow-storage
GCS_KEYFILE_PATH=./gcs-keyfile.json
```

---

## 11. ✅ Vérification de la configuration

### Checklist finale

Avant de passer en production, vérifier :

#### Sécurité
- [ ] Fichier `.env` ajouté au `.gitignore`
- [ ] Clés API Stripe en mode TEST pour développement
- [ ] Restrictions IP/domaine configurées pour Google Maps
- [ ] HTTPS activé sur tous les domaines
- [ ] CORS configuré correctement

#### APIs essentielles
- [ ] Google Maps : carte s'affiche correctement
- [ ] Stripe : paiement test fonctionne
- [ ] Supabase : connexion réussie, tables créées
- [ ] Push notifications : test d'envoi réussi
- [ ] Email : test d'envoi réussi

#### Monitoring
- [ ] Sentry installé et erreurs trackées
- [ ] Analytics configuré et trafic détecté
- [ ] Logs serveur actifs

#### Performance
- [ ] Images optimisées et hébergées sur CDN
- [ ] API responses < 500ms
- [ ] Lighthouse score > 90 (web)

### Script de test

Créer un fichier `test-config.js` pour tester les connexions :

```javascript
require('dotenv').config();

const tests = [
  { name: 'Google Maps', key: 'GOOGLE_MAPS_API_KEY' },
  { name: 'Stripe Public', key: 'STRIPE_PUBLIC_KEY' },
  { name: 'Stripe Secret', key: 'STRIPE_SECRET_KEY' },
  { name: 'Supabase URL', key: 'SUPABASE_URL' },
  { name: 'Supabase Key', key: 'SUPABASE_ANON_KEY' },
  { name: 'OpenAI', key: 'OPENAI_API_KEY' },
];

console.log('🔍 Vérification de la configuration...\n');

let errors = 0;
tests.forEach(test => {
  const value = process.env[test.key];
  if (!value || value === '') {
    console.log(`❌ ${test.name}: manquant`);
    errors++;
  } else {
    console.log(`✅ ${test.name}: configuré`);
  }
});

console.log(`\n${errors === 0 ? '✅ Configuration complète !' : `⚠️  ${errors} clés manquantes`}`);
```

Exécuter : `node test-config.js`

---

## 🆘 Support & Ressources

### Documentation officielle

- [Google Maps](https://developers.google.com/maps/documentation)
- [Stripe](https://stripe.com/docs)
- [Supabase](https://supabase.com/docs)
- [Firebase](https://firebase.google.com/docs)
- [Expo](https://docs.expo.dev)
- [OpenAI](https://platform.openai.com/docs)

### Contact support ArtisanNow

- 📧 Email : dev@artisannow.app
- 💬 Slack : [lien vers workspace]
- 📖 Wiki interne : [lien vers documentation]

---

**Version du document** : 1.0  
**Dernière mise à jour** : 2025-10-17  
**Auteur** : Équipe Technique ArtisanNow

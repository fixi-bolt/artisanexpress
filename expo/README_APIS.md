# 🔑 APIs et Configuration - ArtisanNow

## 📊 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     ARTISANNOW - APIs STATUS                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ GOOGLE MAPS          │  Opérationnel  │  31 APIs  │  0€    │
│  ✅ STRIPE PAYMENTS      │  Test Mode     │  Actif    │  0€    │
│  ⏳ VISION AI            │  À activer     │  Gratuit  │  0€    │
│  ⏳ SPEECH AI            │  À activer     │  Gratuit  │  0€    │
│  ⏳ OPENAI GPT-4         │  Optionnel     │  Payant   │  100€  │
│                                                                 │
│  💰 COÛT ACTUEL : 0€/mois                                       │
│  💰 AVEC IA COMPLÈTE : 100-150€/mois                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ 1. Google Maps API - OPÉRATIONNEL

### 🔑 Clé API
```
AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg
```

### 📍 APIs activées (31 au total)
```
✅ Maps JavaScript API        → Affichage cartes web
✅ Maps SDK for iOS           → Affichage cartes iOS
✅ Maps SDK for Android       → Affichage cartes Android
✅ Geocoding API              → Adresse ↔ Coordonnées
✅ Places API                 → Recherche lieux + autocomplete
✅ Directions API             → Calcul itinéraires
✅ Distance Matrix API        → Calcul distances
✅ Geolocation API            → Localisation par IP/WiFi
✅ Roads API                  → Snap to road
✅ Time Zone API              → Fuseau horaire
✅ Routes API                 → Routes optimisées
✅ Address Validation API     → Validation adresses
+ 19 autres APIs
```

### 💰 Coût
```
📊 Inclus gratuit :
   • 28 000 chargements de cartes/mois
   • 40 000 recherches Geocoding/mois
   • 100 000 requêtes Places Autocomplete/mois

💵 Au-delà : ~0,002€ par requête
🎯 Estimation : 0-50€/mois (phase MVP)
```

### 🧪 Test
```bash
# 1. Créer une demande
# 2. Chercher une adresse → Autocomplete doit fonctionner
# 3. Voir les artisans sur la carte → Marqueurs visibles
# 4. Calculer un itinéraire → Directions affichées
```

---

## ✅ 2. Stripe Payments - OPÉRATIONNEL (TEST MODE)

### 🔑 Clés API
```bash
# Clé publique (côté client - safe)
pk_test_51Rzz6bEEWX9P4nBgi8oFlVv3qAyq04gOlsDYLZ3Ldc9L0pZBMr78TgXbHIrCCtsA9EwF3xhRbXgvRgD9wG5evqG9002e5sMCVj

# Clé secrète (côté serveur - CONFIDENTIEL)
sk_test_51Rzz6bEEWX9P4nBgwx7hIlIo93zhTavFoJ3ku6uSkxw8jMCKlNAKKKV8SixXB695VH94z3CezrOYlkjP4A9xq6DU00yuM4TjGQ
```

### 💳 Cartes de test
```
✅ Succès :
   Numéro : 4242 4242 4242 4242
   Date : 12/34
   CVC : 123
   Code postal : 12345

❌ Échec :
   Numéro : 4000 0000 0000 0002

💰 3D Secure requis :
   Numéro : 4000 0027 6000 3184
```

### 💰 Coût
```
Commission Stripe : 1,4% + 0,25€ par transaction réussie
Commission ArtisanNow : 15% (configurable)

Exemple :
  Client paie : 100€
  Stripe prélève : 1,65€
  ArtisanNow prélève : 15€
  Artisan reçoit : 83,35€
```

### 🧪 Test
```bash
# 1. Créer une demande
# 2. Accepter en tant qu'artisan
# 3. Payer avec carte test : 4242 4242 4242 4242
# 4. Vérifier dans Stripe Dashboard :
#    https://dashboard.stripe.com/test/payments
```

### 🚨 Avant production
```bash
# 1. Passer en mode LIVE
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# 2. Configurer webhook
URL : https://api.artisannow.app/api/stripe/webhook
Events : payment_intent.succeeded, payment_intent.payment_failed

# 3. Activer 3D Secure (requis en Europe)
```

---

## ⏳ 3. Google Cloud Vision API - À ACTIVER (GRATUIT)

### 🎯 Fonctionnalité : Analyse automatique de photos

**Ce que ça fait :**
```
1. Client prend une photo du problème
   📸 Photo de fuite d'eau

2. IA analyse l'image
   🤖 Détection : "fuite", "tuyau", "eau"

3. Suggestion automatique
   💡 Catégorie : Plomberie
   👨‍🔧 Artisan : Plombier
   💰 Estimation : 80-150€
```

### 🔑 Activation (5 minutes)
```bash
# 1. Aller sur Google Cloud Console
https://console.cloud.google.com

# 2. Sélectionner le même projet que Google Maps

# 3. Activer "Cloud Vision API"
Menu → APIs & Services → Library
Rechercher : "Cloud Vision API" → Enable

# 4. Utiliser la même clé API
# (Ou créer une nouvelle si restrictions)

# 5. Ajouter dans .env
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg

# 6. Redémarrer l'app
npx expo start --clear
```

### 💰 Coût
```
🆓 GRATUIT : 1 000 premières images/mois
💵 Au-delà : 1,50€ / 1 000 images

Estimation MVP : 0€/mois (largement suffisant)
```

### 🧪 Test
```bash
# 1. Créer une demande
# 2. Appuyer sur "Ajouter une photo"
# 3. Prendre/choisir une photo
# 4. Attendre l'analyse (2-3 secondes)
# 5. Voir les suggestions automatiques :
#    - Catégorie détectée
#    - Estimation de coût
#    - Description générée
```

---

## ⏳ 4. Google Cloud Speech-to-Text - À ACTIVER (GRATUIT)

### 🎯 Fonctionnalité : Assistant vocal

**Ce que ça fait :**
```
1. Client appuie sur le micro 🎙️

2. Client parle :
   "J'ai une fuite d'eau dans la cuisine depuis hier soir"

3. IA convertit en texte et analyse :
   🤖 Catégorie : Plomberie
   🤖 Urgence : Haute (depuis hier)
   🤖 Localisation : Cuisine

4. Formulaire rempli automatiquement
   📝 Titre : "Fuite d'eau"
   📝 Description : "Fuite d'eau dans la cuisine depuis hier soir"
   📝 Catégorie : Plomberie
   📝 Urgence : Haute
```

### 🔑 Activation (5 minutes)
```bash
# 1. Même console Google Cloud

# 2. Activer "Cloud Speech-to-Text API"
Menu → APIs & Services → Library
Rechercher : "Cloud Speech-to-Text API" → Enable

# 3. Utiliser la même clé

# 4. Ajouter dans .env
GOOGLE_CLOUD_SPEECH_API_KEY=AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg

# 5. Redémarrer
npx expo start --clear
```

### 💰 Coût
```
🆓 GRATUIT : 60 premières minutes/mois
💵 Au-delà : 0,006€ / 15 secondes

Estimation MVP : 0€/mois
```

### 🧪 Test
```bash
# 1. Créer une demande
# 2. Appuyer sur le bouton micro 🎙️
# 3. Parler clairement (en français)
# 4. Voir la transcription en temps réel
# 5. Vérifier que le formulaire est rempli
```

---

## ⏳ 5. OpenAI GPT-4 - OPTIONNEL (PAYANT)

### 🎯 Fonctionnalités avancées

**Ce que ça fait :**
```
✨ Chat Assistant intelligent
   💬 "Quel artisan pour réparer ma serrure ?"
   🤖 Répond avec suggestions personnalisées

💰 Tarification dynamique
   📊 Ajuste prix selon demande, distance, urgence
   🎯 Prix optimisé pour maximiser conversions

🎯 Recommandations intelligentes
   👨‍🔧 Suggère artisans selon historique
   ⭐ Analyse avis et performances
   📍 Optimise selon localisation

💡 Estimation précise
   📸 Analyse photo + description
   💵 Estime coût avec précision 90%+
```

### 🔑 Activation (15 minutes)
```bash
# 1. Créer compte OpenAI
https://platform.openai.com

# 2. Ajouter carte bancaire
# (Nécessaire même pour test)

# 3. Générer clé API
Menu → API Keys → Create new secret key
Format : sk-proj-XXXXXXXXXXXXXXXX

# 4. Ajouter dans .env
OPENAI_API_KEY=sk-proj-VOTRE_CLE_ICI

# 5. Définir un budget
Menu → Settings → Billing
Budget recommandé : 100€/mois (alerte à 80€)

# 6. Redémarrer
npx expo start --clear
```

### 💰 Coût
```
💵 GPT-4 Turbo : ~0,01€ par requête
💵 GPT-3.5 Turbo : ~0,002€ par requête

Estimation :
  • 5 000 requêtes/mois = 50€
  • 10 000 requêtes/mois = 100€

Budget recommandé MVP : 100€/mois
```

### 🧪 Test
```bash
# 1. Ouvrir l'assistant IA (menu)
# 2. Poser une question :
#    "Quel artisan pour une fuite d'eau ?"
# 3. Voir la réponse intelligente
# 4. Créer une demande avec estimation IA
# 5. Vérifier la tarification dynamique
```

---

## 📊 Comparaison des options

### Option A : ACTUEL (0€/mois)
```
✅ Google Maps (cartes, recherche, directions)
✅ Stripe (paiements test)
✅ Interface complète
❌ Pas d'analyse photo
❌ Pas d'assistant vocal
❌ Pas de tarification dynamique

🎯 Parfait pour : Demo investisseurs
```

### Option B : IA GRATUITE (0€/mois)
```
✅ Tout de l'Option A
✅ Vision API (analyse photo)
✅ Speech API (assistant vocal)
❌ Pas de chat avancé
❌ Pas de tarification dynamique

🎯 Parfait pour : MVP public, premiers clients
⏱️ Activation : 10 minutes
```

### Option C : IA COMPLÈTE (100€/mois)
```
✅ Tout de l'Option B
✅ OpenAI GPT-4 (chat avancé)
✅ Tarification dynamique
✅ Recommandations intelligentes
✅ Estimation précise

🎯 Parfait pour : Scaling, Série A
⏱️ Activation : 30 minutes
```

---

## 🚀 Plan d'action

### IMMÉDIAT (0 minute, 0€)
```bash
# L'app est déjà prête !
npx expo start --web

# Tester :
✅ Google Maps
✅ Paiements Stripe (4242...)
✅ Flows complets
```

### CETTE SEMAINE (10 minutes, 0€)
```bash
# Activer Vision + Speech (gratuit)

1. Google Cloud Console
2. Enable "Cloud Vision API"
3. Enable "Cloud Speech-to-Text API"
4. Ajouter clés dans .env
5. Redémarrer l'app

# Effet "wow" garanti !
```

### SI BESOIN (30 minutes, 100€/mois)
```bash
# Activer OpenAI (après levée)

1. Créer compte OpenAI
2. Ajouter carte
3. Générer clé API
4. Budget 100€/mois
5. Ajouter dans .env
6. Tester features avancées
```

---

## 📞 Support

### Dashboards
- **Google Cloud :** https://console.cloud.google.com
- **Stripe :** https://dashboard.stripe.com
- **OpenAI :** https://platform.openai.com/usage

### Documentation
- `/docs/ai-features-setup.md` - Guide IA complet
- `/docs/testing-guide.md` - Tests
- `QUICK_START.md` - Démarrage rapide
- `NEXT_STEPS.md` - Plan d'action détaillé

### Problèmes
```bash
# Carte ne s'affiche pas
# → Vérifier GOOGLE_MAPS_API_KEY dans .env

# Paiement échoue
# → Utiliser carte test 4242 4242 4242 4242

# "No base url found"
# → Vérifier EXPO_PUBLIC_RORK_API_BASE_URL
```

---

## ✅ Checklist

### Configuration actuelle
- [x] Google Maps API activé (31 APIs)
- [x] Stripe test mode configuré
- [x] .env créé avec clés
- [x] Application fonctionnelle
- [ ] Vision API (optionnel - gratuit)
- [ ] Speech API (optionnel - gratuit)
- [ ] OpenAI (optionnel - 100€/mois)

### Avant production
- [ ] Stripe mode LIVE
- [ ] Webhooks configurés
- [ ] Database réelle (Supabase/Firebase)
- [ ] Notifications push (Expo)
- [ ] Monitoring (Sentry)
- [ ] Analytics (Mixpanel)

---

## 🎯 Résumé

```
AUJOURD'HUI (0€) :
  ✅ Prêt pour demo investisseurs
  ✅ Google Maps + Stripe fonctionnels
  ✅ Interface complète

CETTE SEMAINE (0€, 10 min) :
  ⏳ Ajouter Vision + Speech
  ✨ Effet "wow" garanti
  🎯 Différenciation concurrentielle

APRÈS LEVÉE (100€/mois, 30 min) :
  ⏳ Ajouter OpenAI
  🚀 Prêt pour scaling
  💰 Série A ready
```

**Commande magique :**
```bash
npx expo start
# Presser 'w' pour web
# Ou scanner QR pour mobile
```

**C'est parti ! 🚀**

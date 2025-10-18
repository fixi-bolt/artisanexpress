# ⚡ Quick Start - ArtisanNow

## 🚀 Démarrage en 3 étapes

### 1️⃣ Vérifier la configuration

```bash
# Vérifier que .env contient vos clés
cat .env | grep "GOOGLE_MAPS_API_KEY"
cat .env | grep "STRIPE_PUBLIC_KEY"
```

✅ **Google Maps :** `AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg`
✅ **Stripe :** Configuré en mode test

---

### 2️⃣ Lancer l'application

**Option A : Web (recommandé pour débuter)**
```bash
npx expo start --web
```

**Option B : Mobile (Expo Go)**
```bash
npx expo start
# Puis scanner le QR code avec votre téléphone
```

**Option C : Via Rork**
```bash
rork app
```

---

### 3️⃣ Tester les fonctionnalités

#### 🗺️ Google Maps
1. Créer une nouvelle demande
2. Chercher une adresse → **Autocomplete doit fonctionner**
3. Voir les artisans sur la carte → **Marqueurs visibles**

#### 💳 Stripe (Test Mode)
1. Créer une demande
2. Accepter en tant qu'artisan
3. Payer avec : **4242 4242 4242 4242**
4. Vérifier dans [Stripe Dashboard](https://dashboard.stripe.com)

---

## 📊 État actuel

### ✅ Opérationnel
- Google Maps (31 APIs activées)
- Stripe Payments (mode test)
- Interface complète (iOS, Android, Web)
- Navigation et routing
- State management

### ⏳ À configurer (optionnel pour IA)
- OpenAI GPT-4 (50-100€/mois)
- Google Vision API (gratuit jusqu'à 1k images)
- Google Speech API (gratuit jusqu'à 60min)

---

## 📚 Documentation complète

- `/docs/current-configuration.md` - État détaillé
- `/docs/ai-features-setup.md` - Activer l'IA
- `/docs/testing-guide.md` - Guide de test complet
- `/docs/api-setup.md` - Configuration APIs
- `/docs/security-best-practices.md` - Sécurité

---

## 💰 Coûts actuels

**Mode test actuel :** **0€/mois**

**Avec IA (optionnel) :** **50-150€/mois**
- OpenAI : 50-100€
- Google Vision : Gratuit (1k images)
- Google Speech : Gratuit (60min)
- Google Maps : 0-50€ (28k requêtes gratuites)

---

## 🆘 Problèmes fréquents

### Carte ne s'affiche pas
```bash
# Vérifier .env
GOOGLE_MAPS_API_KEY=AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg

# Redémarrer Expo
npx expo start --clear
```

### Paiement échoue
```bash
# Utiliser une carte de test Stripe
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
```

### "No base url found"
```bash
# Vérifier .env
EXPO_PUBLIC_RORK_API_BASE_URL=https://toolkit.rork.com

# Redémarrer
npx expo start --clear
```

---

## 📞 Support

- **Documentation :** `/docs`
- **Email :** support@artisannow.app
- **Stripe Dashboard :** https://dashboard.stripe.com
- **Google Cloud :** https://console.cloud.google.com

---

## ✅ Checklist avant demo

- [ ] `npx expo start --web` fonctionne
- [ ] Google Maps s'affiche correctement
- [ ] Recherche d'adresse fonctionne (autocomplete)
- [ ] Paiement test Stripe réussit (4242...)
- [ ] Navigation entre les pages fluide
- [ ] Pas d'erreurs dans la console

---

## 🎯 Prêt !

```bash
# Démarrer maintenant
npx expo start

# Puis presser :
# - 'w' pour ouvrir dans le navigateur
# - 'i' pour iOS simulator (macOS)
# - 'a' pour Android emulator
# - Scanner QR pour mobile (Expo Go)
```

**Bon test ! 🚀**

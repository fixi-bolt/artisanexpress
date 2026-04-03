# 📊 ANALYSE : État Actuel vs Brief (Work.com / Artisan Connect)

**Date**: 26 Octobre 2025  
**Projet**: ArtisanNow (Work.com)  
**Type**: Plateforme de mise en relation Artisans-Clients

---

## 🎯 SYNTHÈSE GÉNÉRALE

### ✅ Points Forts
- Architecture solide avec Supabase + tRPC
- Authentification fonctionnelle avec RLS
- Base de données complète et optimisée
- Contextes React bien structurés
- UI/UX mobile moderne et clean

### ⚠️ Gaps Critiques à Combler
- Géolocalisation temps réel **non implémentée**
- Workflow d'inscription artisan **incomplet**
- Intégration Stripe **absente**
- Notifications temps réel **partielles**

---

## 🔴 PRIORITÉ 1 : GÉOLOCALISATION EN TEMPS RÉEL

### 📋 Demandé dans le Brief

#### Backend
```javascript
// Route pour mettre à jour la position artisan toutes les 30s
POST /api/artisans/update-location
{
  artisan_id, latitude, longitude, accuracy
}

// Fonction PostgreSQL pour trouver missions proches
find_nearby_missions(artisan_id, latitude, longitude)
  → Retourne missions dans intervention_radius
```

#### Frontend
- `watchPosition()` pour tracking artisan
- Carte avec missions à proximité
- Filtrage par distance + catégorie
- Notifications push des missions proches

---

### ✅ Ce qui est FAIT

#### Base de données ✅
```sql
-- Table artisans
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
intervention_radius INTEGER DEFAULT 10

-- Table missions
latitude DECIMAL(10, 8)
longitude DECIMAL(11, 8)
artisan_latitude DECIMAL(10, 8)  -- Pour tracking
artisan_longitude DECIMAL(11, 8)

-- Fonction distance
CREATE FUNCTION calculate_distance(lat1, lon1, lat2, lon2)
  → Retourne distance en km

-- Fonction recherche artisans proches
CREATE FUNCTION find_nearby_artisans(...)
  → Fonctionne correctement
```

#### Context Mission ✅
```typescript
// contexts/MissionContext.tsx
- updateArtisanLocation(missionId, location) ✅
- Supabase Realtime subscriptions ✅
- Filtrage missions par catégorie ✅
```

#### MapView Component ✅
```typescript
// components/MapView.tsx (web + native)
- Affichage carte Google Maps ✅
- Marqueurs personnalisés ✅
- Compatible web/mobile ✅
```

---

### ❌ Ce qui MANQUE (PRIORITÉ MAX)

#### 1. Route Backend tRPC
```typescript
// ❌ N'existe PAS
backend/trpc/routes/artisans/update-location/route.ts

// À créer :
updateLocationProcedure = protectedProcedure
  .input(z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional()
  }))
  .mutation(async ({ ctx, input }) => {
    // Mettre à jour position artisan
    // Trouver missions à proximité
    // Retourner nearby_missions[]
  })
```

#### 2. Fonction SQL optimisée
```sql
-- ❌ N'existe PAS (mais facile à créer)
CREATE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL
) RETURNS TABLE(...)

-- Doit retourner :
- Missions avec status='pending'
- Dans la catégorie de l'artisan
- Distance <= intervention_radius
- Ordonnées par distance ASC
```

#### 3. Tracking temps réel artisan
```typescript
// ❌ N'existe PAS dans app/(artisan)/dashboard.tsx

useEffect(() => {
  // Demander permission géolocalisation
  // watchPosition() toutes les 30s
  // Envoyer au backend via tRPC
  // Mettre à jour liste missions proches
}, []);
```

#### 4. Carte missions côté artisan
```typescript
// ❌ Dashboard artisan n'a PAS de carte
// Actuellement : Liste simple de missions

// À ajouter :
<MapView>
  {nearbyMissions.map(m => (
    <Marker 
      position={[m.latitude, m.longitude]}
      icon={getCategoryIcon(m.category)}
    >
      <Popup>
        <MissionCard 
          distance={m.distance_km}
          onAccept={handleAccept}
        />
      </Popup>
    </Marker>
  ))}
</MapView>
```

#### 5. Géolocalisation client
```typescript
// ❌ app/request.tsx utilise hardcoded location
latitude: 48.8566,  // Paris hardcodé
longitude: 2.3522,

// À remplacer par :
navigator.geolocation.getCurrentPosition((pos) => {
  setLocation({
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude
  })
})
```

---

### 🔧 PLAN D'ACTION - Géolocalisation

**Estimation**: 2-3 jours

#### Jour 1 : Backend
1. Créer `backend/trpc/routes/artisans/update-location/route.ts`
2. Créer fonction SQL `find_nearby_missions()`
3. Ajouter au router tRPC
4. Tester avec Postman

#### Jour 2 : Frontend Artisan
1. Ajouter `useLocation()` hook pour tracking
2. Implémenter `watchPosition()` avec mise à jour 30s
3. Ajouter MapView au dashboard artisan
4. Afficher missions avec marqueurs
5. Filtrer par distance + catégorie

#### Jour 3 : Frontend Client
1. Remplacer hardcoded location par géolocalisation réelle
2. Ajouter bouton "Ma position actuelle"
3. Validation adresse avec geocoding
4. Tests end-to-end

---

## 🟠 PRIORITÉ 2 : INSCRIPTION ARTISAN AVEC SPÉCIALITÉS

### 📋 Demandé dans le Brief

#### Formulaire multi-étapes
```typescript
// Étape 1 : Choix type compte (client/artisan) ✅
// Étape 2 : Spécialité principale + compétences ❌
// Étape 3 : Tarification (hourly_rate, travel_fee, radius) ❌
// Étape 4 : Documents (certification, assurance, portfolio) ❌
```

---

### ✅ Ce qui est FAIT

#### Authentification ✅
```typescript
// app/auth.tsx
- Sélection type client/artisan ✅
- Inscription avec nom, email, password ✅
- Création user dans Supabase ✅
```

#### Base de données ✅
```sql
-- Table artisans
category TEXT NOT NULL
specialties TEXT[] DEFAULT '{}'
hourly_rate DECIMAL(10, 2)
travel_fee DECIMAL(10, 2)
intervention_radius INTEGER
```

#### Écran spécialité ✅
```typescript
// app/(artisan)/specialty.tsx
- Sélection catégorie principale ✅
- Liste TOP 10 métiers ✅
- Autres métiers déroulants ✅
- Input personnalisé ✅
```

---

### ❌ Ce qui MANQUE

#### 1. Workflow d'inscription complet
```typescript
// ❌ app/auth.tsx ne redirige PAS vers specialty.tsx

// Flux attendu :
1. Sélection "Je suis artisan"
2. Email/password
3. → REDIRECT /specialty ❌ Manquant
4. → REDIRECT /artisan-profile ❌ N'existe pas
5. → REDIRECT /dashboard ✅
```

#### 2. Écran profil artisan
```typescript
// ❌ N'existe PAS : app/(artisan)/profile-setup.tsx

// Doit contenir :
- Tarif horaire (input)
- Frais de déplacement (input)
- Rayon d'intervention (slider 5-50 km)
- Spécialités secondaires (multi-select)
- Photo profil
- Numéro SIRET (validation)
```

#### 3. Upload documents
```typescript
// ❌ Pas d'upload de fichiers

// Documents requis :
- Certification professionnelle
- Assurance responsabilité civile
- Portfolio photos (max 5)
- Kbis ou SIRET

// Stack possible :
- Supabase Storage ✅ Disponible
- expo-image-picker ✅ Déjà utilisé
```

#### 4. Multi-sélection compétences
```typescript
// ❌ specialty.tsx permet UNE SEULE catégorie

// Brief demande :
category: "plomberie"  // Primaire
specialties: [
  "Installation sanitaires",
  "Dépannage urgence",
  "Devis gratuit"
]
```

---

### 🔧 PLAN D'ACTION - Inscription Artisan

**Estimation**: 2 jours

#### Jour 1
1. Créer `app/(artisan)/profile-setup.tsx`
   - Tarifs (hourly_rate, travel_fee)
   - Rayon intervention (slider)
   - Spécialités secondaires (checkboxes)
2. Modifier flux auth.tsx
   ```typescript
   // Après signup artisan :
   router.push('/(artisan)/specialty')
   
   // Dans specialty.tsx après sauvegarde :
   router.push('/(artisan)/profile-setup')
   
   // Dans profile-setup après sauvegarde :
   router.push('/(artisan)/dashboard')
   ```

#### Jour 2
1. Créer `app/(artisan)/documents-upload.tsx`
2. Setup Supabase Storage bucket "artisan-documents"
3. Upload + preview photos
4. Validation SIRET avec API entreprise.data.gouv.fr
5. Tests complets workflow

---

## 🔴 PRIORITÉ 3 : PAIEMENT STRIPE

### 📋 Demandé dans le Brief

#### Backend
```typescript
POST /api/payments/create-payment-intent
  → Créer PaymentIntent Stripe
  → Retourner client_secret

POST /api/payments/webhook
  → Écouter événements Stripe
  → Créditer wallet artisan
```

#### Frontend
```typescript
import { CardElement, useStripe } from '@stripe/react-stripe-js'

<CardElement />
<Button onClick={handlePayment}>
  Payer {amount}€
</Button>
```

---

### ✅ Ce qui est FAIT

#### Base de données ✅
```sql
-- Tables présentes
transactions (
  amount, commission, artisan_payout,
  payment_method_id, status
) ✅

wallets (
  balance, pending_balance,
  total_earnings, total_withdrawals
) ✅

withdrawals (
  amount, status, method
) ✅
```

#### Context Paiement ✅
```typescript
// contexts/PaymentContext.tsx
- createPaymentIntent() ✅
- processPayment() ✅
- calculateCommission() ✅
- getTotalEarnings() ✅
```

#### Routes tRPC ✅
```typescript
backend/trpc/routes/payments/
  create-payment-intent/route.ts ✅
  process-payment/route.ts ✅
  get-transactions/route.ts ✅
  get-earnings/route.ts ✅
```

---

### ❌ Ce qui MANQUE (CRITIQUE)

#### 1. Clés Stripe
```typescript
// ❌ .env ne contient PAS les clés

// À ajouter :
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 2. Initialisation Stripe
```typescript
// ❌ backend/hono.ts ne configure PAS Stripe

// À ajouter :
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
```

#### 3. Webhook handler
```typescript
// ❌ N'existe PAS : backend/hono.ts webhook route

POST /api/payments/webhook

// Gérer événements :
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded
```

#### 4. Frontend formulaire paiement
```typescript
// ❌ N'existe PAS : app/payment.tsx incomplet

// Manque :
import { Elements, CardElement, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

<Elements stripe={stripePromise}>
  <PaymentForm clientSecret={...} />
</Elements>
```

#### 5. Intégration missions
```typescript
// ❌ app/rate.tsx ne déclenche PAS de paiement

// Flux attendu :
1. Mission completed
2. Client note artisan
3. → PAYMENT SCREEN ❌ Manquant
4. Paiement Stripe
5. Crédit wallet artisan
```

---

### 🔧 PLAN D'ACTION - Stripe

**Estimation**: 2-3 jours

#### Jour 1 : Setup Backend
1. Installer `stripe` package
2. Ajouter clés dans .env (fournies par client)
3. Initialiser Stripe dans `backend/hono.ts`
4. Implémenter webhook handler
5. Tester avec Stripe CLI

#### Jour 2 : Frontend
1. Installer `@stripe/react-stripe-js` + `@stripe/stripe-js`
2. Créer composant `PaymentForm.tsx`
3. Intégrer CardElement
4. Connecter à `createPaymentIntent`
5. Gérer succès/échec

#### Jour 3 : Intégration
1. Modifier flux `app/rate.tsx`
   ```typescript
   onSubmitRating() {
     // Si client rate artisan
     router.push(`/payment?missionId=${...}`)
   }
   ```
2. Crédit automatique wallet après paiement
3. Notification artisan "Paiement reçu"
4. Tests end-to-end avec cartes test Stripe

---

## 🟡 PRIORITÉ 4 : NOTIFICATIONS TEMPS RÉEL

### 📋 Demandé dans le Brief

#### Architecture
```
Client crée mission
  ↓
Trigger Supabase Realtime
  ↓
N artisans proches reçoivent notification
  ↓
Premier qui accepte → Mission assignée
  ↓
Autres artisans → Notification disparaît
```

---

### ✅ Ce qui est FAIT

#### Base de données ✅
```sql
-- Table notifications
CREATE TABLE notifications (
  user_id UUID,
  type TEXT CHECK (type IN ('mission_request', ...)),
  title TEXT,
  message TEXT,
  mission_id UUID,
  read BOOLEAN DEFAULT false
) ✅
```

#### Context Notifications ✅
```typescript
// contexts/NotificationContext.tsx
- Expo Notifications setup ✅
- sendNotification() ✅
- registerPushToken() ✅
- Subscription écouteur ✅
```

#### Routes tRPC ✅
```typescript
backend/trpc/routes/notifications/
  send-notification/route.ts ✅
  register-token/route.ts ✅
```

#### Supabase Realtime ✅
```typescript
// contexts/MissionContext.tsx
- Subscription missions changes ✅
- Subscription notifications INSERT ✅
```

---

### ❌ Ce qui MANQUE

#### 1. Notifications multi-artisans
```typescript
// ❌ createMission() ne notifie PAS tous les artisans proches

// Actuellement :
createMission() {
  // Insert mission ✅
  // Notification AU CLIENT uniquement ✅
  // ❌ PAS de notification aux artisans
}

// Attendu :
createMission() {
  // 1. Insert mission
  // 2. Trouver artisans proches (SQL)
  const nearbyArtisans = await supabase.rpc('find_nearby_artisans', {
    latitude: mission.latitude,
    longitude: mission.longitude,
    category: mission.category,
    max_distance: 20
  })
  
  // 3. Notifier CHAQUE artisan
  for (const artisan of nearbyArtisans) {
    await sendNotification({
      userId: artisan.id,
      type: 'mission_request',
      title: '🔔 Nouvelle mission proche',
      message: `${mission.title} à ${artisan.distance_km}km`,
      missionId: mission.id
    })
  }
}
```

#### 2. Disparition notification après acceptation
```typescript
// ❌ acceptMission() ne nettoie PAS les autres notifications

// Attendu :
acceptMission(missionId, artisanId) {
  // 1. Update mission ✅
  // 2. Notifier client ✅
  // 3. ❌ Manque : Supprimer/masquer notifications des autres artisans
  
  await supabase
    .from('notifications')
    .update({ read: true, hidden: true })
    .eq('mission_id', missionId)
    .neq('user_id', artisanId)
}
```

#### 3. Affichage toasts temps réel
```typescript
// ❌ Dashboard artisan n'affiche PAS de toasts

// Brief demande :
- Toast qui pop en haut
- Son notification
- Bouton "ACCEPTER MAINTENANT"
- Compte à rebours (optionnel)
```

#### 4. Push notifications natives
```typescript
// ⚠️ Partiellement implémenté

// Fonctionne :
- Permission demandée ✅
- Token enregistré ✅

// Manque :
- ❌ Envoi via Expo Push API
- ❌ Gestion badges iOS
- ❌ Catégories notifications
```

---

### 🔧 PLAN D'ACTION - Notifications

**Estimation**: 1-2 jours

#### Jour 1
1. Modifier `contexts/MissionContext.tsx`
   ```typescript
   createMission() {
     // Après insert mission :
     const { data: nearbyArtisans } = await supabase
       .rpc('find_nearby_artisans', { ... })
     
     // Notifier tous
     await Promise.all(
       nearbyArtisans.map(a => sendNotification({
         userId: a.artisan_id,
         type: 'mission_request',
         ...
       }))
     )
   }
   ```

2. Ajouter nettoyage dans `acceptMission()`

#### Jour 2
1. Créer composant `<NotificationToast />`
2. Afficher en haut du dashboard artisan
3. Auto-hide après 10s ou acceptance
4. Tests avec 3+ artisans simultanés

---

## 📊 RÉCAPITULATIF DES GAPS

| Feature | Brief | Implémenté | Manque | Priorité |
|---------|-------|------------|--------|----------|
| **Géolocalisation** | ✅ Requis | 🟡 Partiel | Routes backend, tracking temps réel, carte artisan | 🔴 MAX |
| **Inscription artisan** | ✅ Requis | 🟡 Partiel | Tarifs, documents, workflow complet | 🟠 Haute |
| **Paiement Stripe** | ✅ Requis | 🟡 Partiel | Clés, webhook, formulaire frontend | 🔴 MAX |
| **Notifications temps réel** | ✅ Requis | 🟡 Partiel | Multi-artisans, toasts, nettoyage | 🟡 Moyenne |

---

## 🎯 ROADMAP RECOMMANDÉE

### Sprint 1 (3-4 jours) - MVP Fonctionnel
**Objectif**: Application utilisable end-to-end

1. **Géolocalisation** (2j)
   - Route `update-location` tRPC
   - Fonction SQL `find_nearby_missions()`
   - Tracking artisan watchPosition()
   - Carte missions dashboard

2. **Paiement Stripe** (2j)
   - Setup clés + webhook
   - Formulaire CardElement
   - Tests cartes test
   - Crédit wallet automatique

### Sprint 2 (2-3 jours) - Inscription Complète
**Objectif**: Onboarding artisan professionnel

3. **Profile artisan** (1j)
   - Écran tarifs + rayon
   - Spécialités secondaires
   - Workflow complet

4. **Documents** (1j)
   - Upload Supabase Storage
   - Validation SIRET
   - Portfolio photos

### Sprint 3 (1-2 jours) - Notifications
**Objectif**: Expérience "Uber-like"

5. **Multi-artisans** (1j)
   - Notifier tous proches
   - Nettoyage après accept
   - Toasts temps réel

---

## ✅ POINTS POSITIFS DU PROJET ACTUEL

### Architecture
- ✅ Supabase + tRPC = Stack moderne et scalable
- ✅ RLS bien configurée (sécurité)
- ✅ Contextes React propres
- ✅ TypeScript strict

### Base de données
- ✅ Schéma complet et optimisé
- ✅ Triggers + fonctions SQL
- ✅ Indexes performants
- ✅ Support earthdistance pour géolocalisation

### UX/UI
- ✅ Design mobile moderne
- ✅ Animations fluides
- ✅ Composants réutilisables
- ✅ SafeAreaView correctement géré

### Features avancées
- ✅ Chat temps réel
- ✅ IA (vision, suggestions, assistant)
- ✅ Analytics
- ✅ Admin dashboard
- ✅ Marketplace

---

## 🚨 RISQUES À ADRESSER

### 1. Géolocalisation mobile
- **Risque**: Battery drain avec watchPosition()
- **Solution**: 
  - Update toutes les 60s (pas 30s)
  - Désactiver quand app en background
  - Utiliser `geofencing` pour zones

### 2. Stripe webhook
- **Risque**: Miss payment events
- **Solution**:
  - Vérifier signature Stripe
  - Logger tous événements
  - Retry automatique si échec

### 3. Notifications concurrentes
- **Risque**: 2 artisans acceptent en même temps
- **Solution**:
  - Transaction atomique SQL
  - UPDATE avec WHERE status='pending'
  - Renvoyer erreur si déjà pris

### 4. Performance carte
- **Risque**: Trop de marqueurs ralentissent
- **Solution**:
  - Clustering marqueurs proches
  - Pagination missions (LIMIT 50)
  - Lazy loading markers

---

## 📝 NOTES TECHNIQUES

### Expo Go Limitations
```typescript
// ⚠️ Pas de packages natifs custom
// OK : expo-location, expo-notifications
// ❌ KO : react-native-maps custom builds

// Solution actuelle :
- MapView web/native split ✅
- Google Maps API ✅
```

### Web Compatibility
```typescript
// ✅ Bien géré partout
Platform.select({
  web: webImplementation,
  default: nativeImplementation
})
```

### Supabase RLS
```sql
-- ✅ Très bien configuré
-- Artisans voient missions pending dans leur catégorie
-- Clients voient uniquement leurs missions
-- Admins voient tout
```

---

## 🎬 CONCLUSION

### État Actuel: 60% du Brief

**Fait** ✅:
- Architecture solide
- Authentification complète
- Base de données optimisée
- UI/UX professionnelle
- Supabase Realtime
- Features bonus (IA, chat, analytics)

**Manque** ❌:
- Géolocalisation temps réel (backend + frontend)
- Workflow inscription artisan complet
- Intégration Stripe end-to-end
- Notifications multi-artisans

### Effort Restant: ~7-9 jours

**Sprint 1**: Géolocalisation + Stripe (3-4j) → MVP fonctionnel  
**Sprint 2**: Inscription artisan (2-3j) → Onboarding pro  
**Sprint 3**: Notifications Uber-like (1-2j) → Polish final

### Recommandation
✅ **Prioriser absolument**:
1. Géolocalisation (fonctionnalité cœur)
2. Paiement Stripe (monétisation)
3. Workflow artisan (acquisition)

⏳ **Peut attendre**:
- Documents upload (V2)
- Analytics avancées (V2)
- IA features (bonus)

---

**📌 Ce projet a une excellente base technique. Avec 1 semaine de focus sur les 3 features critiques, il sera 100% conforme au brief et production-ready.**

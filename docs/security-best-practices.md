# 🔒 Sécurité et bonnes pratiques - ArtisanNow

## 🎯 Vue d'ensemble

Ce document décrit les meilleures pratiques de sécurité pour ArtisanNow, couvrant :
- Protection des clés API
- Sécurité des paiements
- Authentification et autorisation
- Protection des données utilisateur
- Conformité RGPD

---

## 🔑 1. Gestion des clés API

### ✅ Règles d'or

1. **Ne JAMAIS committer les clés dans Git**
   ```bash
   # .gitignore doit contenir :
   .env
   .env.local
   .env.production
   *.pem
   *.key
   ```

2. **Utiliser des variables d'environnement**
   ```typescript
   // ✅ BON
   const apiKey = process.env.STRIPE_SECRET_KEY;
   
   // ❌ MAUVAIS
   const apiKey = "sk_test_123456789";
   ```

3. **Séparer les clés client vs serveur**
   ```typescript
   // ✅ Côté client (safe to expose)
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
   
   // ❌ Côté serveur SEULEMENT (never expose)
   STRIPE_SECRET_KEY
   OPENAI_API_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

---

## 🗺️ 2. Sécurité Google Maps API

### Configuration recommandée :

1. **Restreindre par domaine/app**
   ```
   Google Cloud Console → Credentials → [Votre clé]
   
   Application restrictions :
   - HTTP referrers (web) :
     - https://artisannow.app/*
     - https://*.artisannow.app/*
     - http://localhost:* (dev seulement)
   
   - iOS apps :
     - Bundle ID : com.artisannow.app
   
   - Android apps :
     - Package name : com.artisannow.app
     - SHA-1 fingerprint : [votre fingerprint]
   ```

2. **Restreindre par API**
   ```
   API restrictions :
   ✅ Maps JavaScript API
   ✅ Geocoding API
   ✅ Places API
   ✅ Directions API
   ✅ Distance Matrix API
   ✅ Cloud Vision API (si utilisée)
   ❌ Toutes les autres (désactivées)
   ```

3. **Définir un quota**
   ```
   IAM & Admin → Quotas
   
   Limites recommandées :
   - Maps API : 25 000 requêtes/jour
   - Geocoding : 10 000 requêtes/jour
   - Places : 5 000 requêtes/jour
   ```

4. **Activer les alertes de facturation**
   ```
   Billing → Budgets & Alerts
   
   Créer une alerte :
   - Budget mensuel : 100€
   - Alerte à 50%, 80%, 100%
   - Notification par email
   ```

---

## 💳 3. Sécurité Stripe

### ✅ Bonnes pratiques

1. **Utiliser le mode test en développement**
   ```bash
   # .env.development
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   USE_STRIPE_TEST_MODE=true
   ```

2. **Protéger la clé secrète**
   ```typescript
   // ✅ BON - Côté serveur seulement
   // backend/hono.ts
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
   
   // ❌ MAUVAIS - Jamais côté client
   // app/payment.tsx
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // DANGER!
   ```

3. **Valider les webhooks**
   ```typescript
   // Vérifier la signature Stripe
   const sig = request.headers.get('stripe-signature');
   const event = stripe.webhooks.constructEvent(
     payload,
     sig,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

4. **Implémenter l'idempotence**
   ```typescript
   // Éviter les doubles paiements
   const paymentIntent = await stripe.paymentIntents.create(
     { amount, currency },
     { idempotencyKey: `mission_${missionId}` }
   );
   ```

5. **Configurer les webhooks**
   ```
   Stripe Dashboard → Developers → Webhooks
   
   URL : https://api.artisannow.app/api/stripe/webhook
   
   Events à écouter :
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ charge.refunded
   ✅ customer.subscription.created
   ✅ customer.subscription.deleted
   ```

---

## 🔐 4. Authentification et autorisation

### Flux sécurisé

```typescript
// 1. Authentification (qui êtes-vous ?)
const { user, login, logout } = useAuth();

// 2. Autorisation (qu'avez-vous le droit de faire ?)
if (user.role !== 'admin') {
  throw new Error('Unauthorized');
}

// 3. Validation côté serveur
// backend/trpc/routes/admin/delete-mission/route.ts
export const deleteMissionProcedure = protectedProcedure
  .input(z.object({ missionId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Vérifier le rôle
    if (ctx.user.role !== 'admin') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }
    
    // Vérifier les permissions
    const mission = await db.mission.findUnique({ id: input.missionId });
    if (!mission) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    
    // Action
    await db.mission.delete({ id: input.missionId });
  });
```

### Sessions sécurisées

```typescript
// Utiliser des tokens JWT avec expiration courte
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '1h' }
);

// Refresh token avec expiration longue
const refreshToken = jwt.sign(
  { userId: user.id },
  process.env.JWT_REFRESH_SECRET!,
  { expiresIn: '7d' }
);
```

---

## 🛡️ 5. Validation des inputs

### Toujours valider côté serveur

```typescript
import { z } from 'zod';

// ✅ BON - Validation stricte
const createMissionSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(5000),
  category: z.enum(['plumbing', 'electricity', 'locksmith']),
  urgency: z.enum(['low', 'medium', 'high']),
  budget: z.number().positive().max(10000),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const createMissionProcedure = protectedProcedure
  .input(createMissionSchema)
  .mutation(async ({ input }) => {
    // Input déjà validé par Zod
    return await createMission(input);
  });
```

### Sanitiser les données

```typescript
// Éviter les injections SQL/XSS
import DOMPurify from 'isomorphic-dompurify';

const sanitizedDescription = DOMPurify.sanitize(description);
```

---

## 🔒 6. Protection des données (RGPD)

### Données personnelles

```typescript
// Chiffrer les données sensibles
import crypto from 'crypto';

function encrypt(text: string): string {
  const cipher = crypto.createCipher(
    'aes-256-cbc',
    process.env.ENCRYPTION_SALT!
  );
  return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

// Stocker uniquement le nécessaire
const user = {
  id: '123',
  email: 'user@example.com', // ✅ Nécessaire
  phone: encrypt('+33612345678'), // ✅ Chiffré
  // password: '...' // ❌ Jamais en clair (hasher avec bcrypt)
};
```

### Consentement explicite

```typescript
// Demander le consentement avant de collecter
const consent = {
  analytics: false, // Opt-in
  marketing: false, // Opt-in
  essential: true,  // Toujours actif (légalement autorisé)
};
```

### Droit à l'oubli

```typescript
// Implémenter la suppression de compte
export const deleteAccountProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    // Supprimer ou anonymiser les données
    await db.user.update({
      where: { id: ctx.user.id },
      data: {
        email: `deleted_${Date.now()}@deleted.com`,
        phone: null,
        avatar: null,
        isDeleted: true,
      },
    });
    
    // Garder les données légales (factures) 10 ans
    // Mais anonymiser l'utilisateur
  });
```

---

## 📱 7. Sécurité mobile

### Stockage sécurisé

```typescript
import * as SecureStore from 'expo-secure-store';

// ✅ BON - Stockage chiffré
await SecureStore.setItemAsync('auth_token', token);

// ❌ MAUVAIS - Stockage non sécurisé
await AsyncStorage.setItem('auth_token', token); // Accessible
```

### Deep linking sécurisé

```typescript
// Valider les deep links
const handleDeepLink = (url: string) => {
  const parsed = new URL(url);
  
  // Vérifier le scheme
  if (parsed.protocol !== 'artisannow:') {
    console.error('Invalid scheme');
    return;
  }
  
  // Vérifier le domaine (pour https://)
  if (parsed.hostname !== 'artisannow.app') {
    console.error('Invalid domain');
    return;
  }
  
  // Procéder
  router.push(parsed.pathname);
};
```

---

## 🌐 8. Sécurité réseau

### HTTPS uniquement

```typescript
// app.json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": false // Forcer HTTPS
    },
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": false // Forcer HTTPS
        }
      }
    }
  }
}
```

### Rate limiting

```typescript
// Limiter les requêtes abusives
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requêtes
});

app.use('/api/', limiter);
```

---

## 🔍 9. Monitoring et logging

### Logs sécurisés

```typescript
// ✅ BON
console.log('User logged in', { userId: user.id });

// ❌ MAUVAIS
console.log('User logged in', { 
  userId: user.id,
  password: user.password, // DANGER!
  token: authToken, // DANGER!
});
```

### Erreurs génériques

```typescript
// ✅ BON - Message générique
throw new Error('Invalid credentials');

// ❌ MAUVAIS - Révèle trop d'infos
throw new Error('User john@doe.com does not exist');
throw new Error('Password incorrect for user 12345');
```

---

## 📋 10. Checklist sécurité

### Avant le déploiement

- [ ] `.env` dans `.gitignore`
- [ ] Clés API restreintes (domaines, IPs, APIs)
- [ ] Stripe en mode LIVE (pas test)
- [ ] HTTPS activé partout
- [ ] Rate limiting configuré
- [ ] Logs ne contiennent pas de données sensibles
- [ ] Validation inputs côté serveur
- [ ] Authentification sur toutes les routes protégées
- [ ] Webhooks Stripe vérifiés (signature)
- [ ] Quotas et alertes Google Cloud
- [ ] Backup base de données activé
- [ ] Sentry ou monitoring d'erreurs
- [ ] CGU et Politique de confidentialité
- [ ] Consentement cookies/RGPD
- [ ] Tests de sécurité (OWASP)

---

## 🆘 En cas de fuite de clé API

### Actions immédiates

1. **Révoquer la clé compromise**
   ```
   Google Cloud : Credentials → [Clé] → Delete
   Stripe : API Keys → [Clé] → Delete
   ```

2. **Générer une nouvelle clé**

3. **Mettre à jour `.env` et redéployer**

4. **Vérifier les logs d'usage**
   - Google Cloud : Logs Explorer
   - Stripe : Dashboard → Logs

5. **Surveiller les charges anormales**

6. **Notifier les utilisateurs si nécessaire** (RGPD)

---

## 📚 Ressources

- **OWASP Top 10** : https://owasp.org/www-project-top-ten/
- **Stripe Security** : https://stripe.com/docs/security
- **Google Cloud Security** : https://cloud.google.com/security/best-practices
- **Expo Security** : https://docs.expo.dev/guides/security/
- **RGPD** : https://www.cnil.fr/

---

## 🎯 Résumé

### 3 règles d'or

1. **Ne jamais exposer les clés secrètes côté client**
2. **Toujours valider les inputs côté serveur**
3. **Assumer que tout input utilisateur est malveillant**

### Protection en profondeur

```
🔒 Client : Validation basique, UX
🔒 Réseau : HTTPS, Rate limiting
🔒 Backend : Validation stricte, Auth
🔒 Database : Chiffrement, Backup
🔒 Monitoring : Logs, Alerts, Sentry
```

**Sécurité = confiance = croissance 🚀**
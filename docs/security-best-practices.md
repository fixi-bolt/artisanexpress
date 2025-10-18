# 🔒 Bonnes Pratiques de Sécurité - ArtisanNow

## ⚠️ IMPORTANT : Configuration Immédiate Requise

### 🗺️ Google Maps API - Restrictions Obligatoires

**État actuel** : Votre clé API Google Maps est **NON RESTREINTE** et peut être utilisée par n'importe qui !

**Action immédiate requise** :

1. Aller sur : [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/credentials)
2. Sélectionner votre clé API : `AIzaSyDFbRWjaRlK-RFgkpo-XizRR7x2_O5y1Mg`
3. Cliquer sur **"Modifier"**

#### Restrictions d'Application (OBLIGATOIRE)

**Pour une application mobile + web** :

1. **Restrictions HTTP** :
   - Ajouter vos domaines autorisés :
     - `artisannow.app/*`
     - `*.artisannow.app/*`
     - `localhost:*` (pour développement)

2. **Restrictions d'API** :
   - ✅ Activer UNIQUEMENT ces APIs :
     - Maps JavaScript API
     - Geocoding API
     - Places API
     - Directions API
     - Distance Matrix API
   - ❌ Désactiver toutes les autres

3. **Quota Limits** :
   - Définir une limite quotidienne (ex : 25 000 requêtes/jour)
   - Configurer des alertes à 80% et 100%

---

### 💳 Stripe - Configuration Sécurisée

**État actuel** : Vous utilisez les clés **TEST** (recommandé pour développement).

#### Mode Test vs Production

| Environnement | Clé Publique | Clé Secrète |
|--------------|--------------|-------------|
| **Test** (actuel) | `pk_test_...` | `sk_test_...` |
| **Production** | `pk_live_...` | `sk_live_...` |

⚠️ **NE JAMAIS** utiliser les clés `live` en développement !

#### Configuration du Webhook Stripe

1. Aller sur : [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)

2. Créer un endpoint :
   ```
   URL: https://api.artisannow.app/api/stripe/webhook
   ```

3. Sélectionner les événements :
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.deleted`

4. Copier le **Webhook Secret** (commence par `whsec_...`)

5. Ajouter dans `.env` :
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI
   ```

#### Restrictions IP (Production)

Pour la production, restreindre l'accès à votre API :

1. Dashboard Stripe > Developers > API keys
2. Ajouter les IP de vos serveurs backend uniquement

---

## 🔐 Variables d'Environnement Sensibles

### ❌ NE JAMAIS committer ces fichiers :

```bash
# Déjà configuré dans .gitignore
.env
.env.local
.env.production
*.pem
*.p12
*.key
```

### ✅ Vérification .gitignore

Vérifiez que `.gitignore` contient :

```
# Environment
.env
.env.*
!.env.example

# Secrets
*.pem
*.key
secrets/
```

---

## 🛡️ Checklist Sécurité Pre-Production

### Google Maps API
- [ ] Restreindre par domaine/URL
- [ ] Activer uniquement les APIs nécessaires
- [ ] Configurer quotas et alertes
- [ ] Activer la facturation (après le free tier)

### Stripe
- [ ] Configurer webhook avec secret
- [ ] Tester les paiements en mode test
- [ ] Vérifier gestion des erreurs
- [ ] Configurer les emails de reçu
- [ ] Activer l'authentification 3D Secure
- [ ] Passer en mode LIVE uniquement après tests complets

### Supabase/Firebase
- [ ] Activer Row Level Security (RLS) sur toutes les tables
- [ ] Créer des index sur colonnes fréquemment requêtées
- [ ] Limiter l'accès Anon Key (lecture seule)
- [ ] Configurer politique de backup automatique

### JWT & Sessions
- [ ] Générer un `JWT_SECRET` fort (32+ caractères aléatoires)
- [ ] Définir expiration des tokens (24h recommandé)
- [ ] Utiliser HTTPS uniquement en production
- [ ] Implémenter refresh tokens

---

## 🚨 Monitoring & Alertes

### Stripe
- Activer les emails pour :
  - Paiements échoués
  - Disputes/chargebacks
  - Seuils de revenus

### Google Maps
- Configurer alertes Budget & Quotas
- Email à 80% et 100% de consommation

### Sentry (recommandé)
```bash
# Installer Sentry pour monitoring d'erreurs
npm install @sentry/react-native

# Dans .env
SENTRY_DSN=https://votre-dsn@sentry.io/projet
```

---

## 📋 Commandes Utiles

### Générer secrets sécurisés

```bash
# JWT Secret (32 caractères)
openssl rand -hex 32

# Encryption Salt (16 caractères)
openssl rand -hex 16

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Tester Stripe Webhook localement

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forwarder les webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🌐 URLs de Configuration

| Service | URL |
|---------|-----|
| Google Cloud Console | https://console.cloud.google.com |
| Stripe Dashboard | https://dashboard.stripe.com |
| Stripe Webhooks | https://dashboard.stripe.com/webhooks |
| Supabase Dashboard | https://app.supabase.com |
| Expo Dashboard | https://expo.dev |

---

## 🔄 Rotation des Clés

**Fréquence recommandée** :
- Production : tous les 3-6 mois
- En cas de suspicion de compromission : immédiatement

**Processus** :
1. Générer nouvelle clé
2. Déployer avec les deux clés (ancienne + nouvelle)
3. Attendre 24-48h
4. Retirer l'ancienne clé
5. Monitorer les erreurs d'authentification

---

## 📞 Support Urgence

**Stripe** : support@stripe.com (réponse < 2h pour comptes vérifiés)  
**Google Cloud** : https://cloud.google.com/support  
**Supabase** : support@supabase.io

---

**Dernière mise à jour** : 2025-10-18  
**Version** : 1.0

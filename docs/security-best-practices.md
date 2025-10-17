# 🔒 Bonnes Pratiques de Sécurité - ArtisanNow

Ce document détaille les meilleures pratiques de sécurité à suivre pour protéger ArtisanNow, ses utilisateurs et leurs données.

---

## 📋 Table des matières

1. [Gestion des clés API et secrets](#1-gestion-des-clés-api-et-secrets)
2. [Sécurité de la base de données](#2-sécurité-de-la-base-de-données)
3. [Authentification et autorisation](#3-authentification-et-autorisation)
4. [Protection des paiements](#4-protection-des-paiements)
5. [Sécurité des communications](#5-sécurité-des-communications)
6. [Protection des données personnelles (RGPD)](#6-protection-des-données-personnelles-rgpd)
7. [Sécurité du code](#7-sécurité-du-code)
8. [Monitoring et incident response](#8-monitoring-et-incident-response)
9. [Sécurité mobile](#9-sécurité-mobile)
10. [Checklist de déploiement](#10-checklist-de-déploiement)

---

## 1. 🔑 Gestion des clés API et secrets

### 1.1 Stockage sécurisé

#### ✅ À FAIRE

```bash
# Utiliser des fichiers .env (JAMAIS committé)
STRIPE_SECRET_KEY=sk_live_xxxxx
JWT_SECRET=$(openssl rand -hex 32)

# Ajouter au .gitignore
.env
.env.local
.env.production
```

#### ❌ À ÉVITER

```javascript
// JAMAIS de clés en dur dans le code
const stripeKey = "sk_live_123456789";

// JAMAIS de clés dans les commits
git add .env  # ⚠️ DANGER
```

### 1.2 Rotation des clés

- 🔄 **Rotation régulière** : tous les 90 jours minimum
- 🔄 **Rotation immédiate** si :
  - Clé exposée dans un commit public
  - Départ d'un membre de l'équipe
  - Suspicion de compromission
  - Après un incident de sécurité

### 1.3 Restriction des clés API

#### Google Maps

```plaintext
Application restrictions:
  ✅ HTTP referrers: https://artisannow.app/*
  ✅ IP addresses: [IPs du serveur backend]

API restrictions:
  ✅ Maps JavaScript API
  ✅ Geocoding API
  ✅ Places API
  ✅ Directions API
  ❌ Toutes les autres APIs (décoché)
```

#### Stripe

```plaintext
Testmode:
  ✅ pk_test_* pour développement
  ✅ sk_test_* pour backend test

Production:
  ✅ pk_live_* uniquement pour le frontend
  ✅ sk_live_* uniquement sur serveur sécurisé
  ✅ Webhook secret vérifié à chaque événement
```

### 1.4 Niveaux d'accès

```plaintext
DÉVELOPPEMENT:
  - Clés TEST uniquement
  - Logs détaillés activés
  - Vérifications relâchées (email, etc.)

STAGING:
  - Clés TEST ou clés LIVE restreintes
  - Environnement isolé de la prod
  - Tests de sécurité automatisés

PRODUCTION:
  - Clés LIVE avec restrictions maximales
  - Logs sans données sensibles
  - Monitoring 24/7
```

---

## 2. 🗄️ Sécurité de la base de données

### 2.1 Row Level Security (RLS) - Supabase

#### ✅ Activer RLS sur toutes les tables

```sql
-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
```

#### ✅ Politiques strictes

```sql
-- Les utilisateurs ne voient que leurs propres données
CREATE POLICY "Users can only read their own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Les clients voient uniquement leurs demandes
CREATE POLICY "Clients can only see their requests"
ON requests FOR SELECT
USING (auth.uid() = client_id);

-- Les artisans voient uniquement les demandes qui leur sont assignées
CREATE POLICY "Artisans can see assigned requests"
ON requests FOR SELECT
USING (
  auth.uid() = artisan_id 
  OR status = 'pending'  -- Toutes les demandes en attente visibles
);

-- Les paiements sont visibles uniquement par les parties concernées
CREATE POLICY "Payments visible to concerned parties"
ON payments FOR SELECT
USING (
  auth.uid() IN (
    SELECT client_id FROM requests WHERE id = request_id
    UNION
    SELECT artisan_id FROM requests WHERE id = request_id
  )
);
```

### 2.2 Chiffrement des données sensibles

#### Données à chiffrer

```sql
-- Chiffrer les données sensibles côté application
-- Avant insertion en base
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,  -- Chiffré côté app
  ssn TEXT,  -- Numéro sécu : chiffré
  iban TEXT,  -- IBAN : chiffré
  ...
);
```

#### Utiliser pgcrypto (PostgreSQL)

```sql
-- Activer l'extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Chiffrer une colonne
UPDATE users 
SET phone = pgp_sym_encrypt(phone, 'encryption-key')
WHERE phone IS NOT NULL;

-- Déchiffrer
SELECT pgp_sym_decrypt(phone::bytea, 'encryption-key') FROM users;
```

### 2.3 Sauvegardes sécurisées

```bash
# Sauvegardes automatiques quotidiennes
# Chiffrées avec GPG
pg_dump artisannow | gpg --encrypt --recipient admin@artisannow.app > backup_$(date +%Y%m%d).sql.gpg

# Stockage sur S3 avec chiffrement
aws s3 cp backup.sql.gpg s3://artisannow-backups/ --sse AES256

# Rétention : 30 jours (quotidien), 12 mois (mensuel)
```

---

## 3. 🔐 Authentification et autorisation

### 3.1 Authentification forte

#### ✅ Mots de passe

```javascript
// Exigences minimales
const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,  // Pas de nom, email, etc.
};

// Hachage avec bcrypt (minimum 12 rounds)
import bcrypt from 'bcrypt';
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

#### ✅ Multi-factor Authentication (MFA)

```javascript
// Activer 2FA pour tous les admins
// Recommander 2FA pour tous les utilisateurs
// Types : SMS, TOTP (Google Authenticator), Email

// Exemple avec Supabase
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
});
```

### 3.2 Gestion des sessions

#### ✅ Tokens JWT sécurisés

```javascript
// Configuration JWT
const jwtConfig = {
  secret: process.env.JWT_SECRET,  // 32+ caractères aléatoires
  expiresIn: '15m',  // Access token : 15 minutes
  refreshExpiresIn: '7d',  // Refresh token : 7 jours
  algorithm: 'HS256',
  issuer: 'artisannow.app',
  audience: 'artisannow-users',
};

// Rotation des tokens
// Refresh token unique par appareil
// Invalider tous les tokens au changement de mot de passe
```

#### ✅ Invalidation de session

```javascript
// Déconnexion sur tous les appareils
async function logoutAllDevices(userId) {
  // Supprimer tous les refresh tokens
  await db.refreshTokens.deleteMany({ userId });
  
  // Blacklist les access tokens actifs
  await redis.set(`blacklist:${userId}`, Date.now(), 'EX', 900);
}
```

### 3.3 Contrôle d'accès (RBAC)

```javascript
// Rôles définis
enum Role {
  CLIENT = 'client',
  ARTISAN = 'artisan',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Permissions par rôle
const permissions = {
  client: ['read:own_requests', 'create:request', 'rate:artisan'],
  artisan: ['read:requests', 'accept:request', 'update:own_profile'],
  admin: ['read:all', 'suspend:user', 'delete:request'],
  super_admin: ['*'],  // Tous les accès
};

// Middleware de vérification
function requireRole(allowedRoles: Role[]) {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

---

## 4. 💳 Protection des paiements

### 4.1 PCI-DSS Compliance

#### ✅ Utiliser Stripe (PCI Level 1)

```javascript
// ✅ CORRECT : Stripe gère les données de carte
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'eur',
  payment_method_types: ['card'],
  metadata: { requestId: '123' },
});

// ❌ INTERDIT : Jamais manipuler les numéros de carte
// JAMAIS stocker : numéro de carte, CVV, date d'expiration
```

### 4.2 Vérification des webhooks

```javascript
// ✅ TOUJOURS vérifier la signature Stripe
import Stripe from 'stripe';

app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement vérifié
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Marquer le paiement comme réussi
      break;
    case 'payment_intent.payment_failed':
      // Gérer l'échec
      break;
  }

  res.json({ received: true });
});
```

### 4.3 Prévention de la fraude

```javascript
// Limiter les tentatives de paiement
const rateLimiter = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,  // 15 minutes
};

// Vérifications anti-fraude
async function checkFraud(request) {
  const checks = [
    // Adresse IP suspecte
    await checkIpReputation(request.ip),
    
    // Email jetable
    await checkDisposableEmail(request.email),
    
    // Montant inhabituel pour ce client
    await checkUnusualAmount(request.clientId, request.amount),
    
    // Vélocité (trop de paiements en peu de temps)
    await checkVelocity(request.clientId),
    
    // Correspondance adresse IP / pays de la carte
    await checkIpCardCountryMatch(request.ip, request.cardCountry),
  ];

  const riskScore = checks.filter(c => c.suspicious).length;
  
  if (riskScore >= 3) {
    // Bloquer ou demander vérification manuelle
    await flagForReview(request);
    return false;
  }
  
  return true;
}
```

---

## 5. 🔒 Sécurité des communications

### 5.1 HTTPS obligatoire

```javascript
// Rediriger HTTP vers HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});

// Headers de sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 an
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 5.2 CORS configuré strictement

```javascript
const corsOptions = {
  origin: [
    'https://artisannow.app',
    'https://app.artisannow.app',
    process.env.NODE_ENV === 'development' && 'http://localhost:19006',
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

### 5.3 Rate limiting

```javascript
import rateLimit from 'express-rate-limit';

// Limiter les requêtes API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requêtes max
  message: 'Trop de requêtes, veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Limiter les tentatives de connexion
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 tentatives max
  skipSuccessfulRequests: true,
});

app.post('/api/auth/login', loginLimiter, loginHandler);
```

---

## 6. 🛡️ Protection des données personnelles (RGPD)

### 6.1 Minimisation des données

```javascript
// ✅ Collecter uniquement ce qui est nécessaire
const userSchema = {
  // Nécessaire
  email: String,
  name: String,
  phone: String,
  
  // ❌ Éviter si non nécessaire
  // dateOfBirth: Date,
  // gender: String,
  // ssn: String,
};
```

### 6.2 Consentement explicite

```javascript
// Tracking des consentements
const consents = {
  marketing: false,  // Emails marketing
  analytics: false,  // Tracking comportemental
  necessary: true,  // Cookies essentiels (toujours actif)
};

// Révocable à tout moment
async function updateConsents(userId, newConsents) {
  await db.users.update({
    where: { id: userId },
    data: { 
      consents: newConsents,
      consentsUpdatedAt: new Date(),
    },
  });
}
```

### 6.3 Droit à l'oubli

```javascript
// Anonymisation complète
async function anonymizeUser(userId) {
  await db.$transaction([
    // Anonymiser les données utilisateur
    db.users.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@anonymized.local`,
        name: 'Utilisateur supprimé',
        phone: null,
        avatarUrl: null,
        deletedAt: new Date(),
      },
    }),
    
    // Anonymiser les messages
    db.messages.updateMany({
      where: { senderId: userId },
      data: { content: '[Message supprimé]' },
    }),
    
    // Garder les transactions (obligation légale) mais anonymiser
    db.payments.updateMany({
      where: { userId },
      data: { userEmail: 'anonymized@deleted.local' },
    }),
  ]);
}
```

### 6.4 Export des données

```javascript
// Permettre l'export de toutes les données utilisateur
async function exportUserData(userId) {
  const data = {
    profile: await db.users.findUnique({ where: { id: userId } }),
    requests: await db.requests.findMany({ where: { clientId: userId } }),
    ratings: await db.ratings.findMany({ where: { clientId: userId } }),
    payments: await db.payments.findMany({ where: { userId } }),
    messages: await db.messages.findMany({ where: { senderId: userId } }),
  };
  
  // Générer un JSON ou CSV
  return JSON.stringify(data, null, 2);
}
```

---

## 7. 💻 Sécurité du code

### 7.1 Validation des entrées

```javascript
import { z } from 'zod';

// ✅ Valider TOUTES les entrées utilisateur
const createRequestSchema = z.object({
  category: z.enum(['plomberie', 'electricite', 'menuiserie']),
  description: z.string().min(10).max(1000),
  address: z.string().min(5),
  scheduledAt: z.string().datetime(),
});

app.post('/api/requests', async (req, res) => {
  try {
    const validated = createRequestSchema.parse(req.body);
    // Utiliser validated, pas req.body
  } catch (error) {
    return res.status(400).json({ error: error.errors });
  }
});
```

### 7.2 Protection contre les injections

#### SQL Injection

```javascript
// ✅ CORRECT : Utiliser des requêtes paramétrées
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ DANGER : Concaténation de strings
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

#### XSS (Cross-Site Scripting)

```javascript
// ✅ CORRECT : Échapper les données utilisateur
import DOMPurify from 'isomorphic-dompurify';

const cleanDescription = DOMPurify.sanitize(userInput);

// React échappe automatiquement
<Text>{userInput}</Text>  // ✅ Safe

// ❌ DANGER : dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 7.3 Dépendances à jour

```bash
# Vérifier les vulnérabilités
npm audit

# Mettre à jour automatiquement
npm audit fix

# Utiliser Dependabot (GitHub) ou Renovate
# pour les mises à jour automatiques
```

---

## 8. 📊 Monitoring et incident response

### 8.1 Logging sécurisé

```javascript
// ✅ Logger les événements de sécurité
const securityLog = {
  timestamp: new Date(),
  event: 'failed_login',
  userId: user?.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  // ❌ JAMAIS de mots de passe, tokens, cartes bancaires
};

// ❌ ÉVITER dans les logs
console.log('Password attempt:', password);  // DANGER
console.log('Credit card:', cardNumber);  // DANGER
console.log('JWT token:', token);  // DANGER

// ✅ Logger de manière sécurisée
console.log('Login attempt for user:', email);
console.log('Payment processed:', { requestId, amount, last4: card.last4 });
```

### 8.2 Alertes en temps réel

```javascript
// Configurer des alertes Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filtrer les données sensibles
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['Authorization'];
    }
    return event;
  },
});

// Alertes sur événements critiques
async function alertSecurityTeam(incident) {
  await sendSlackAlert({
    channel: '#security-alerts',
    text: `🚨 Security incident: ${incident.type}`,
    details: incident,
  });
  
  await sendEmail({
    to: 'security@artisannow.app',
    subject: `[URGENT] Security incident: ${incident.type}`,
    body: JSON.stringify(incident, null, 2),
  });
}
```

### 8.3 Plan de réponse aux incidents

```markdown
# Incident Response Plan

## Phase 1 : Détection (0-15 min)
- Alerte automatique déclenchée
- Équipe sécurité notifiée
- Évaluation initiale de la gravité

## Phase 2 : Confinement (15-60 min)
- Isolation des systèmes affectés
- Révocation des tokens/clés compromis
- Blocage des IPs malveillantes

## Phase 3 : Éradication (1-4h)
- Identification de la cause racine
- Correction de la vulnérabilité
- Vérification de l'absence de backdoors

## Phase 4 : Récupération (4-24h)
- Restauration des services
- Rotation de toutes les clés sensibles
- Tests de sécurité approfondis

## Phase 5 : Suivi (24-72h)
- Post-mortem détaillé
- Communication aux utilisateurs (si nécessaire)
- Mise à jour des procédures
```

---

## 9. 📱 Sécurité mobile

### 9.1 Stockage sécurisé

```javascript
import * as SecureStore from 'expo-secure-store';

// ✅ CORRECT : Utiliser SecureStore pour données sensibles
await SecureStore.setItemAsync('accessToken', token);
const token = await SecureStore.getItemAsync('accessToken');

// ❌ ÉVITER : AsyncStorage pour données sensibles
// AsyncStorage n'est pas chiffré
```

### 9.2 Certificate Pinning

```javascript
// Vérifier le certificat SSL du serveur
// Empêche les attaques man-in-the-middle

// Dans app.json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSPinnedDomains": {
            "api.artisannow.app": {
              "NSIncludesSubdomains": true,
              "NSPinnedLeafIdentities": [
                {
                  "SPKI-SHA256-BASE64": "your-certificate-hash"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 9.3 Détection de jailbreak/root

```javascript
import * as Device from 'expo-device';

async function isDeviceSecure() {
  // Vérifier si l'appareil est rooté/jailbreaké
  const isRooted = await Device.isRootedExperimentalAsync();
  
  if (isRooted) {
    console.warn('⚠️ Device is rooted/jailbroken');
    // Désactiver certaines fonctionnalités sensibles
    // ou afficher un avertissement
  }
  
  return !isRooted;
}
```

---

## 10. ✅ Checklist de déploiement

### Avant mise en production

#### Configuration
- [ ] `.env` contient uniquement les clés LIVE
- [ ] Toutes les clés TEST remplacées par LIVE
- [ ] `.env` ajouté au `.gitignore`
- [ ] Aucune clé commitée dans l'historique Git

#### APIs et Services
- [ ] Google Maps : restrictions de domaine configurées
- [ ] Stripe : mode LIVE activé, webhook configuré
- [ ] Supabase/Firebase : RLS activé sur toutes les tables
- [ ] HTTPS obligatoire sur tous les domaines
- [ ] Certificats SSL valides et renouvelables automatiquement

#### Authentification
- [ ] Mots de passe : exigences minimales configurées
- [ ] JWT : secret de 32+ caractères aléatoires
- [ ] Sessions : expiration < 24h
- [ ] 2FA activé pour les admins

#### Paiements
- [ ] Webhooks Stripe : signature vérifiée
- [ ] Aucune donnée de carte stockée
- [ ] Logs de paiements sans infos sensibles
- [ ] Tests de fraude configurés

#### Base de données
- [ ] Sauvegardes automatiques quotidiennes
- [ ] Chiffrement des données sensibles
- [ ] RLS actif et testé
- [ ] Indexes de performance créés

#### Monitoring
- [ ] Sentry configuré et testé
- [ ] Logs sans données sensibles
- [ ] Alertes configurées pour erreurs critiques
- [ ] Dashboard de monitoring accessible

#### Sécurité
- [ ] Rate limiting activé
- [ ] CORS configuré strictement
- [ ] Headers de sécurité (Helmet.js)
- [ ] Dependencies audit réussi (npm audit)
- [ ] Tests de pénétration effectués

#### RGPD
- [ ] Politique de confidentialité publiée
- [ ] Consentement tracking implémenté
- [ ] Export de données fonctionnel
- [ ] Droit à l'oubli implémenté
- [ ] DPO désigné (si nécessaire)

#### Tests finaux
- [ ] Tests de charge : API répond < 500ms
- [ ] Tests de sécurité : OWASP Top 10
- [ ] Tests de bout en bout : flux complets
- [ ] Tests mobile : iOS + Android
- [ ] Tests web : Chrome, Safari, Firefox

---

## 🆘 Contacts d'urgence

### En cas d'incident de sécurité

- 📧 **Email** : security@artisannow.app
- 📞 **Téléphone** : +33 X XX XX XX XX (24/7)
- 💬 **Slack** : #security-incidents (alerte @channel)

### Escalade

1. **Niveau 1** (Faible) : DevOps de garde
2. **Niveau 2** (Moyen) : Lead Technique + CTO
3. **Niveau 3** (Critique) : Tous les C-levels + Équipe légale

---

## 📚 Ressources complémentaires

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [RGPD - CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/security)

---

**⚠️ Ce document doit être mis à jour régulièrement et relu par l'équipe sécurité.**

**Version** : 1.0  
**Dernière révision** : 2025-10-17  
**Prochaine révision** : 2026-01-17 (tous les 3 mois)

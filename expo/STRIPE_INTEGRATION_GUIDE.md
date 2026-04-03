# 💳 GUIDE D'INTÉGRATION STRIPE - ARTISAN CONNECT

## ✅ CE QUI A ÉTÉ FAIT

### 1. Backend (Routes tRPC)

✅ **`backend/trpc/routes/payments/create-payment-intent/route.ts`**
- Crée un PaymentIntent Stripe
- Enregistre les métadonnées (mission_id, client_id, artisan_id)
- Retourne le client_secret pour le frontend

✅ **`backend/trpc/routes/payments/process-payment/route.ts`**
- Vérifie le statut du paiement
- Calcule et enregistre la commission (15%)
- Crédite le wallet de l'artisan
- Met à jour le statut de la mission

✅ **`backend/hono.ts`**
- Endpoint webhook: `/api/webhooks/stripe`
- Écoute les événements Stripe:
  - `payment_intent.succeeded` → Crédite wallet + notifie artisan
  - `payment_intent.payment_failed` → Marque mission comme échouée
  - `charge.refunded` → Met à jour transaction

### 2. Frontend

✅ **`app/_layout.tsx`**
- Ajout de `<StripeProvider>` avec clé publique
- Configuration globale de Stripe

✅ **`app/payment-stripe.tsx`** (NOUVELLE PAGE)
- Formulaire de paiement avec CardField React Native
- Affichage du récapitulatif (montant, commission, paiement artisan)
- Cartes test Stripe affichées
- Gestion complète du flow:
  1. Création PaymentIntent
  2. Confirmation paiement
  3. Traitement backend
  4. Redirection vers notation

### 3. Base de données

✅ **`database/STRIPE_PAYMENT_SETUP.sql`**
- Script SQL complet pour Supabase
- Colonnes: `stripe_customer_id`, `payment_intent_id`, `payment_status`
- Fonctions: `credit_artisan_wallet`, `debit_artisan_wallet`, `calculate_commission`
- Triggers: Auto-création wallet artisan
- Policies RLS pour sécurité
- Vues statistiques

---

## 🔑 CONFIGURATION REQUISE

### 1. Variables d'environnement (.env)

```env
# Clés Stripe (déjà configurées)
STRIPE_PUBLIC_KEY=pk_test_51Rzz6bEEWX9P4nBgi8oFlVv3qAyq04gOlsDYLZ3Ldc9L0pZBMr78TgXbHIrCCtsA9EwF3xhRbXgvRgD9wG5evqG9002e5sMCVj
STRIPE_SECRET_KEY=sk_test_51Rzz6bEEWX9P4nBgwx7hIlIo93zhTavFoJ3ku6uSkxw8jMCKlNAKKKV8SixXB695VH94z3CezrOYlkjP4A9xq6DU00yuM4TjGQ
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI

# Commission plateforme (15% = 0.15)
COMMISSION_PERCENTAGE=0.15
```

### 2. Installation Supabase

```bash
# 1. Aller sur https://nkxucjhavjfsogzpitry.supabase.co
# 2. Ouvrir SQL Editor
# 3. Coller le contenu de database/STRIPE_PAYMENT_SETUP.sql
# 4. Exécuter le script
```

### 3. Configuration Webhook Stripe

```bash
# 1. Aller sur Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
# 2. Cliquer "Add endpoint"
# 3. URL: https://VOTRE-DOMAINE.com/api/webhooks/stripe
# 4. Événements à écouter:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - charge.refunded
# 5. Copier le "Signing secret" (whsec_...)
# 6. Ajouter dans .env comme STRIPE_WEBHOOK_SECRET
```

---

## 🧪 TESTS

### 1. Cartes test Stripe

| Carte | Résultat |
|-------|----------|
| `4242 4242 4242 4242` | ✅ Paiement réussi |
| `4000 0000 0000 0002` | ❌ Paiement refusé |
| `4000 0000 0000 9995` | ❌ Fonds insuffisants |

**Date d'expiration**: N'importe quelle date future  
**CVV**: N'importe quel 3 chiffres  
**Code postal**: N'importe quel 5 chiffres

### 2. Flow de test complet

```bash
# 1. Créer une mission en tant que client
# 2. Accepter la mission en tant qu'artisan
# 3. Finaliser la mission (définir prix final)
# 4. Aller sur /payment-stripe?missionId=XXX
# 5. Entrer carte test 4242 4242 4242 4242
# 6. Cliquer "Payer"
# 7. Vérifier:
#    - Transaction créée dans Supabase
#    - Wallet artisan crédité
#    - Mission marquée comme "completed" et "paid"
#    - Notification artisan créée
```

### 3. Test webhook en local

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Se connecter
stripe login

# Écouter les webhooks en local
stripe listen --forward-to http://localhost:8081/api/webhooks/stripe

# Trigger un événement de test
stripe trigger payment_intent.succeeded
```

---

## 📊 FLUX DE PAIEMENT

```
┌─────────────┐
│   CLIENT    │
│ Crée mission│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ARTISAN    │
│Accepte+prix │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│    app/payment-stripe.tsx            │
│  1. Affiche récapitulatif            │
│  2. CardField Stripe                 │
│  3. createPaymentIntent mutation     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  backend/trpc/.../create-payment-    │
│  intent/route.ts                     │
│  → stripe.paymentIntents.create()    │
│  → Retourne client_secret            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│    confirmPayment (Stripe SDK)       │
│  → Affiche formulaire 3DS si besoin  │
│  → Confirme paiement                 │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  backend/trpc/.../process-payment/   │
│  route.ts                            │
│  1. Vérifie status = succeeded       │
│  2. Crée transaction                 │
│  3. credit_artisan_wallet()          │
│  4. Met à jour mission               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Webhook /api/webhooks/stripe        │
│  (backup au cas où)                  │
│  → payment_intent.succeeded          │
│  → Crédite wallet                    │
│  → Notifie artisan                   │
└──────────────────────────────────────┘
```

---

## 💰 CALCUL COMMISSION

```typescript
Montant mission: 100€

Commission plateforme (15%): 15€
Paiement artisan (85%): 85€

Exemple:
- Mission plomberie: 150€
- Commission: 22.50€
- Artisan reçoit: 127.50€
```

---

## 🛠️ DÉPANNAGE

### Erreur: "No client secret returned"

**Cause**: Clé Stripe invalide ou PaymentIntent échoué

**Solution**:
1. Vérifier `STRIPE_SECRET_KEY` dans .env
2. Check logs backend: `[STRIPE] Creating payment intent...`
3. Vérifier que la clé commence par `sk_test_`

### Erreur: "Payment not completed"

**Cause**: Paiement pas confirmé côté Stripe

**Solution**:
1. Vérifier carte test valide
2. Check statut dans Stripe Dashboard
3. Vérifier 3D Secure si activé

### Webhook ne reçoit rien

**Cause**: URL webhook incorrecte ou secret invalide

**Solution**:
1. Vérifier URL dans Stripe Dashboard
2. Vérifier `STRIPE_WEBHOOK_SECRET`
3. Test avec Stripe CLI: `stripe listen`

### Transaction créée mais wallet pas crédité

**Cause**: Fonction SQL `credit_artisan_wallet` échoue

**Solution**:
1. Exécuter script `database/STRIPE_PAYMENT_SETUP.sql`
2. Vérifier que wallet existe: `SELECT * FROM wallets WHERE artisan_id = 'XXX'`
3. Check logs Supabase

---

## 📱 UTILISATION DANS L'APP

### Rediriger vers paiement

```typescript
// Après que mission soit finalisée
router.push(`/payment-stripe?missionId=${missionId}`);
```

### Vérifier statut paiement

```typescript
const { data: transactions } = trpc.payments.getTransactions.useQuery({
  missionId
});

const isPaid = transactions?.some(t => t.status === 'completed');
```

### Afficher wallet artisan

```typescript
const { data: wallet } = trpc.wallet.getWallet.useQuery();

console.log('Solde:', wallet?.balance);
console.log('Gains totaux:', wallet?.total_earnings);
```

---

## 📄 FICHIERS MODIFIÉS/CRÉÉS

### Créés
- `app/payment-stripe.tsx` (page paiement)
- `database/STRIPE_PAYMENT_SETUP.sql` (script SQL)
- `STRIPE_INTEGRATION_GUIDE.md` (ce fichier)

### Modifiés
- `app/_layout.tsx` (ajout StripeProvider)
- `backend/trpc/routes/payments/create-payment-intent/route.ts` (intégration Stripe)
- `backend/trpc/routes/payments/process-payment/route.ts` (traitement complet)
- `backend/hono.ts` (webhook endpoint)
- `package.json` (ajout stripe + @stripe/stripe-react-native)

---

## ✅ CHECKLIST PRÉ-PRODUCTION

- [ ] Remplacer clés test par clés production
- [ ] Configurer webhook production
- [ ] Tester avec vraie carte (mode test)
- [ ] Vérifier RLS policies Supabase
- [ ] Activer 3D Secure (SCA)
- [ ] Configurer remboursements
- [ ] Test charge.refunded webhook
- [ ] Documenter support client
- [ ] Configurer alertes échecs paiements
- [ ] Test load avec 100 paiements simultanés

---

## 🎯 PROCHAINES ÉTAPES

1. **Maintenant**: Copier `database/STRIPE_PAYMENT_SETUP.sql` dans Supabase
2. **Tester**: Flow complet avec carte test
3. **Webhook**: Configurer dans Stripe Dashboard
4. **Production**: Remplacer clés test par clés live

---

## 📞 SUPPORT

Questions? Vérifier:
1. Logs console: `[STRIPE]`
2. Stripe Dashboard: https://dashboard.stripe.com/test/payments
3. Supabase logs: Table Editor > transactions
4. Ce guide: STRIPE_INTEGRATION_GUIDE.md

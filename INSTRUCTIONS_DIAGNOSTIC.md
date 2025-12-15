# 🔍 DIAGNOSTIC COMPLET DE LA BASE DE DONNÉES

## 📋 Instructions

### Étape 1 : Exécuter le diagnostic
1. Ouvrez Supabase Dashboard : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Ouvrez le fichier `database/DIAGNOSTIC_COMPLET_BASE.sql`
5. Copiez TOUT le contenu
6. Collez dans SQL Editor
7. Cliquez sur **Run**

### Étape 2 : Analyser les résultats

Le script va afficher 14 sections de diagnostic :

#### 📊 Section 1 : TABLES
- Vérifie que toutes les tables existent
- Vérifie que le RLS est activé

**✅ Attendu :**
- users, artisans, clients, admins, missions, notifications, transactions, wallets, etc.
- Toutes avec RLS activé

#### 📋 Section 2 : COLONNES CRITIQUES
- Vérifie les colonnes importantes

**⚠️ Point d'attention :**
- La colonne dans `notifications` doit être `read` (pas `is_read`)
- `user_type` doit exister dans `users`
- `latitude` et `longitude` doivent exister dans `artisans`

#### ⚙️ Section 3 : FONCTIONS
- Vérifie que les fonctions critiques existent

**✅ Attendu :**
- `calculate_distance_km`
- `handle_new_user`
- `update_user_rating`
- `update_wallet_on_transaction`
- `process_safe_withdrawal`

#### 🔔 Section 4 : TRIGGERS
- Vérifie tous les triggers

**✅ Attendu :**
- `on_auth_user_created` sur auth.users
- `update_rating_after_review` sur reviews
- `sync_wallet_on_transaction` sur transactions
- `update_*_updated_at` sur chaque table

#### 🔒 Section 5 : POLITIQUES RLS
- Liste toutes les politiques de sécurité

**✅ Attendu :**
- Au moins 20 politiques
- Politiques sur missions, notifications, wallets, etc.

#### 📑 Section 6 : INDEX
- Liste les index de performance

**✅ Attendu :**
- Index sur latitude/longitude pour artisans
- Index sur status pour missions
- Index sur artisan_id pour transactions

#### 📈 Section 7 : STATISTIQUES DONNÉES
- Compte le nombre d'enregistrements

**📊 Vérifiez :**
- Nombre d'artisans
- Nombre de clients
- Nombre de missions
- Nombre de notifications

#### 👷 Section 8 : ARTISANS DISPONIBLES
- Liste tous les artisans avec leurs paramètres

**⚠️ Vérifiez :**
- `is_available = true`
- `is_suspended = false`
- `is_verified = true`
- `latitude` et `longitude` renseignés
- `intervention_radius` correct

#### 📋 Section 9 : MISSIONS EN ATTENTE
- Liste les missions avec status 'pending'

**📊 Analyse :**
- Combien de missions en attente ?
- Depuis combien de temps ?

#### 🔔 Section 10 : NOTIFICATIONS NON LUES
- Liste les 20 dernières notifications non lues

**⚠️ CRITIQUE :**
- Vérifiez que la colonne `read` fonctionne
- Vérifiez qu'il y a des notifications pour les artisans

#### 💰 Section 11 : WALLETS
- État des portefeuilles artisans

**✅ Vérifiez :**
- Chaque artisan a un wallet
- Les balances sont cohérentes

#### 🗺️ Section 12 : TEST DISTANCE
- Test de la fonction de calcul de distance

**✅ Attendu :**
- Distance Paris → Lyon ≈ 392 km

#### 📡 Section 13 : REALTIME PUBLICATION
- Vérifie la configuration Realtime

**✅ Attendu :**
- Publication `supabase_realtime` existe
- Table `notifications` incluse

#### ✅ Section 14 : RÉSUMÉ
- Statistiques globales

---

## 🚨 Points de vérification critiques

### Pour que les notifications fonctionnent :

1. **Table notifications** doit avoir la colonne `read` (type BOOLEAN)
2. **Trigger** sur missions pour créer des notifications
3. **RLS** permet aux artisans de voir les notifications
4. **Realtime** activé sur la table notifications
5. **Index** sur `user_id` et `read`

### Pour que l'acceptation de mission fonctionne :

1. **Artisans** doivent avoir `latitude` et `longitude`
2. **Missions** avec status 'pending' doivent être visibles
3. **Fonction calculate_distance_km** doit fonctionner
4. **RLS** permet aux artisans de voir missions dans leur rayon
5. **Trigger** crée notification quand mission acceptée

---

## 📤 Envoyez-moi les résultats

Après avoir exécuté le diagnostic, copiez-collez les résultats complets pour que je puisse analyser l'état de votre base de données.

**Où trouver les résultats :**
- Dans Supabase SQL Editor, après exécution
- Onglet "Results" en bas
- Copiez tout et envoyez-moi

---

## 🔧 Problèmes courants

### Si une fonction manque :
→ Exécutez `database/PRODUCTION_READY_FINAL.sql`

### Si RLS n'est pas activé :
→ Exécutez la section RLS du script

### Si colonne `read` n'existe pas :
→ Colonne mal nommée, il faut la renommer

### Si pas de notifications :
→ Problème avec les triggers

---

**Temps estimé : 2 minutes**

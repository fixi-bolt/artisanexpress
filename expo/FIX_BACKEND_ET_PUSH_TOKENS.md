# ✅ CORRECTIONS APPLIQUÉES

## 🔧 Problèmes résolus

### 1. Backend tRPC désactivé ✅
**Problème:** `BACKEND_AVAILABLE = false` dans `lib/trpc.ts`
**Solution:** Changé à `true` car votre backend est accessible à `https://dev-vkzouaiv8hu7jb9nja678.rorktest.dev`

### 2. Table push_tokens manquante ✅
**Problème:** `ERROR: relation "public.push_tokens" does not exist`
**Solution:** Script SQL créé dans `database/FIX_PUSH_TOKENS_TABLE.sql`

---

## 📋 ACTIONS À FAIRE MAINTENANT

### Étape 1: Appliquer le script SQL dans Supabase

1. **Ouvrir Supabase:**
   - Aller sur https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry
   - Cliquer sur "SQL Editor" dans le menu de gauche

2. **Copier-coller le script:**
   - Ouvrir le fichier `database/FIX_PUSH_TOKENS_TABLE.sql`
   - Copier TOUT le contenu
   - Coller dans l'éditeur SQL de Supabase
   - Cliquer sur "Run" (bouton en bas à droite)

3. **Vérifier que ça fonctionne:**
   - Vous devriez voir des messages de succès
   - La dernière requête affiche les colonnes de la table créée

---

## 🎯 Ce que le script fait

### Table `push_tokens`
- Stocke les tokens de notification push (Expo Push Tokens, FCM tokens)
- Un utilisateur peut avoir plusieurs tokens (iPhone + iPad + Android)
- Colonnes:
  - `user_id` → Référence à l'utilisateur
  - `token` → Le token push (unique)
  - `platform` → 'ios', 'android', ou 'web'
  - `device_info` → Info sur l'appareil (modèle, version OS, etc.)
  - `is_active` → Token actif ou non

### Fonctions utilitaires créées

1. **`upsert_push_token(user_id, token, platform, device_info)`**
   - Enregistre ou met à jour un token
   - Désactive automatiquement les anciens tokens de l'utilisateur sur la même plateforme

2. **`get_active_push_tokens(user_id)`**
   - Récupère tous les tokens actifs d'un utilisateur
   - Utilisé pour envoyer les notifications push

3. **`deactivate_push_token(token)`**
   - Désactive un token (lors de la déconnexion)

---

## 🔐 Sécurité RLS

Le script configure automatiquement les politiques RLS :
- ✅ Les utilisateurs voient uniquement leurs propres tokens
- ✅ Les utilisateurs peuvent insérer/modifier/supprimer leurs propres tokens
- ✅ Le service_role (backend) peut tout faire

---

## 🧪 TEST RAPIDE

Après avoir exécuté le script, testez dans Supabase SQL Editor:

```sql
-- Vérifier que la table existe
SELECT * FROM public.push_tokens LIMIT 10;

-- Tester l'insertion d'un token (remplacer les valeurs)
SELECT public.upsert_push_token(
  'YOUR_USER_ID'::uuid,
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  'ios',
  '{"model": "iPhone 14", "osVersion": "17.0"}'::jsonb
);

-- Vérifier que le token a été inséré
SELECT * FROM public.push_tokens WHERE user_id = 'YOUR_USER_ID'::uuid;
```

---

## 🚀 Prochaines étapes après correction

1. **Recharger l'application** (rafraîchir la page ou redémarrer l'app)
2. Les erreurs "Backend désactivé" devraient disparaître
3. Les notifications push pourront être enregistrées correctement

---

## 🐛 Si des erreurs 404 persistent

Si vous voyez encore des erreurs 404 pour certaines routes tRPC, cela signifie que:
- La route n'existe pas dans votre backend
- Ou le backend n'est pas déployé correctement

**Pour identifier quelles routes manquent:**
Les logs afficheront maintenant l'URL complète de chaque requête qui échoue.

**Exemple de log:**
```
[trpc] 404 Not Found: https://dev-vkzouaiv8hu7jb9nja678.rorktest.dev/api/trpc/monetization.ads.getPreferences
```

→ Cela signifie que la route `monetization.ads.getPreferences` n'existe pas ou n'est pas enregistrée dans le router backend.

---

## ✅ Checklist

- [ ] Script SQL exécuté dans Supabase sans erreur
- [ ] Table `push_tokens` visible dans Supabase (onglet "Table Editor")
- [ ] Application rechargée
- [ ] Erreurs "Backend désactivé" disparues
- [ ] Tester l'enregistrement d'un token push (connexion à l'app)

---

## 📞 Support

Si problème persistant, fournissez:
1. Screenshot de l'erreur dans Supabase SQL Editor (si le script échoue)
2. Les nouvelles erreurs dans la console de l'app
3. L'URL complète des requêtes qui échouent (visible dans les logs maintenant)

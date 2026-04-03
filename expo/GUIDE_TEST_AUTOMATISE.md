# 🧪 Guide du Test Automatisé Post-Production

## 📋 Vue d'ensemble

Ce script de test automatisé vérifie l'intégralité du flux de votre application :

1. ✅ **Création des utilisateurs** - Un client et un artisan de test
2. ✅ **Demande d'intervention** - Le client crée une mission
3. ✅ **Notification artisan** - L'artisan reçoit la notification de nouvelle mission
4. ✅ **Artisan le plus proche** - Vérification de la localisation
5. ✅ **Acceptation mission** - L'artisan accepte la mission
6. ✅ **Notification client** - Le client reçoit la notification d'acceptation

---

## 🚀 Comment exécuter le test

### Option 1 : Utiliser npx directement

```bash
npx tsx scripts/test-complete-flow.ts
```

### Option 2 : Utiliser bun

```bash
bun run scripts/test-complete-flow.ts
```

### Option 3 : Utiliser node avec ts-node

```bash
npx ts-node scripts/test-complete-flow.ts
```

---

## 📊 Résultat attendu

Si tout fonctionne correctement, vous verrez :

```
╔════════════════════════════════════════════════════════════╗
║     🧪 TEST POST-PRODUCTION - FLUX COMPLET                ║
╚════════════════════════════════════════════════════════════╝

📡 Connexion à Supabase...
   URL: https://nkxucjhavjfsogzpitry.supabase.co

📝 ÉTAPE 1: Création des utilisateurs de test
✅ [Étape 1] Utilisateurs créés - Client: abc12345... | Artisan: def67890... (2500ms)

🚀 ÉTAPE 2: Création de la mission
✅ [Étape 2] Mission créée - ID: ghi12345... (1200ms)

🔔 ÉTAPE 3: Vérification des notifications artisan
✅ [Étape 3] Artisan a reçu 1 notification(s) (3100ms)

📍 ÉTAPE 4: Vérification artisan le plus proche
✅ [Étape 4] Artisan le plus proche identifié (800ms)

✅ ÉTAPE 5: Acceptation de la mission
✅ [Étape 5] Mission acceptée par l'artisan (1100ms)

🔔 ÉTAPE 6: Vérification des notifications client
✅ [Étape 6] Client a reçu 1 notification(s) d'acceptation (3200ms)

╔════════════════════════════════════════════════════════════╗
║                    ✅ TOUS LES TESTS RÉUSSIS              ║
╚════════════════════════════════════════════════════════════╝

⏱️  Durée totale: 12000ms (12.00s)

📊 RÉSUMÉ DES ÉTAPES:
   ✅ Étape 1: Utilisateurs créés
   ✅ Étape 2: Mission créée
   ✅ Étape 3: Artisan a reçu 1 notification(s)
   ✅ Étape 4: Artisan le plus proche identifié
   ✅ Étape 5: Mission acceptée par l'artisan
   ✅ Étape 6: Client a reçu 1 notification(s) d'acceptation

🧹 Nettoyage des données de test...
   ✓ Mission supprimée
   ✓ Client supprimé
   ✓ Artisan supprimé

╔════════════════════════════════════════════════════════════╗
║                    🏁 TEST TERMINÉ                         ║
╚════════════════════════════════════════════════════════════╝
```

---

## ❌ En cas d'erreur

Si une étape échoue, vous verrez un message détaillé :

```
❌ [Étape 3] Aucune notification reçue par l'artisan (3100ms)
   Data: { error: "..." }
```

### Erreurs communes et solutions

#### 🔴 Erreur Étape 1 : "Client non créé"
**Cause :** Problème d'authentification Supabase
**Solution :** Vérifiez que l'email confirmation est désactivé dans Supabase

#### 🔴 Erreur Étape 2 : "Mission non créée"
**Cause :** Erreur RLS ou champs manquants
**Solution :** Vérifiez les politiques RLS sur la table `missions`

#### 🔴 Erreur Étape 3 : "Aucune notification reçue"
**Cause :** Le trigger de notification n'a pas fonctionné
**Solution :** Vérifiez que le trigger `notify_nearby_artisans_on_new_mission` existe et fonctionne

#### 🔴 Erreur Étape 6 : "Aucune notification reçue par le client"
**Cause :** Le trigger de notification d'acceptation n'a pas fonctionné
**Solution :** Vérifiez que le trigger `notify_client_on_mission_accepted` existe et fonctionne

---

## 🔍 Vérification manuelle dans Supabase

Pendant l'exécution du test, vous pouvez vérifier dans le SQL Editor de Supabase :

### Vérifier les utilisateurs créés
```sql
SELECT id, email, name, user_type FROM users 
WHERE email LIKE 'test-%@test.com' 
ORDER BY created_at DESC LIMIT 10;
```

### Vérifier les missions créées
```sql
SELECT id, client_id, artisan_id, title, status 
FROM missions 
WHERE title LIKE 'Fuite d%' 
ORDER BY created_at DESC LIMIT 10;
```

### Vérifier les notifications
```sql
SELECT n.id, u.email, n.type, n.title, n.message, n.is_read
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE u.email LIKE 'test-%@test.com'
ORDER BY n.created_at DESC LIMIT 20;
```

---

## 🧹 Nettoyage automatique

Le script nettoie automatiquement toutes les données de test à la fin :
- ✅ Suppression de la mission
- ✅ Suppression des notifications
- ✅ Suppression du client
- ✅ Suppression de l'artisan

---

## ⚙️ Configuration

Le script utilise les variables d'environnement :
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Si elles ne sont pas définies, il utilise les valeurs par défaut du projet.

---

## 📝 Notes importantes

1. **Durée du test** : Environ 12-15 secondes
2. **Connexion internet** : Requise pour accéder à Supabase
3. **Données temporaires** : Toutes les données sont nettoyées automatiquement
4. **Email de test** : Format `test-client-{timestamp}@test.com`

---

## 🎯 Prochaines étapes

Si tous les tests passent ✅, votre application est prête pour la production !

Si un test échoue ❌, utilisez les logs détaillés pour identifier et corriger le problème.

# 🚀 CORRECTION IMMÉDIATE - NOTIFICATIONS PUSH

## ❌ Problème
La table `push_tokens` n'existe pas dans Supabase, ce qui empêche l'envoi de notifications push.

## ✅ Solution (2 minutes)

### ÉTAPE 1 : Ouvrir Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### ÉTAPE 2 : Coller le script
1. Cliquez sur "+ New query"
2. Ouvrez le fichier `database/FIX_PUSH_TOKENS_TABLE.sql`
3. **COPIEZ TOUT LE CONTENU** du fichier
4. **COLLEZ** dans l'éditeur SQL de Supabase
5. Cliquez sur **"Run"** (en bas à droite)

### ÉTAPE 3 : Vérifier que ça marche
Exécutez cette requête dans le SQL Editor :
```sql
SELECT * FROM push_tokens LIMIT 10;
```

Si vous voyez "Success. No rows returned", c'est parfait ! La table existe.

---

## 🎯 Ce qui a été corrigé

### 1. Table push_tokens créée
- Stocke les tokens Expo Push pour chaque utilisateur
- Supporte iOS, Android et Web
- Politiques RLS configurées pour la sécurité

### 2. Trigger automatique ajouté
Quand un artisan accepte une mission :
- ✅ Une notification est automatiquement créée dans la table `notifications`
- ✅ Le backend peut récupérer le token push du client
- ✅ Le push est envoyé via Expo

---

## 🧪 Test rapide

### 1. Vérifier que le token est enregistré
Après vous être connecté dans l'app :
```sql
SELECT user_id, token, platform, created_at 
FROM push_tokens 
ORDER BY created_at DESC 
LIMIT 5;
```

### 2. Accepter une mission
1. Connectez-vous en tant qu'artisan
2. Acceptez une mission en attente

### 3. Vérifier la notification
```sql
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.user_id,
  n.created_at,
  u.name as user_name
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC
LIMIT 5;
```

Vous devriez voir une nouvelle notification avec :
- Type: `mission_accepted`
- Title: "Mission acceptée"
- Message: "[Nom artisan] a accepté votre demande"

---

## 🐛 Si ça ne marche toujours pas

### Problème 1 : Pas de token enregistré
**Symptôme** : `SELECT * FROM push_tokens` est vide

**Solution** :
1. Redémarrez l'application
2. Acceptez les permissions de notification
3. Vérifiez les logs : recherchez "[Notifications] Expo push token:"

### Problème 2 : Notification créée mais pas de push
**Symptôme** : La notification existe dans `notifications` mais pas reçue sur le téléphone

**Causes possibles** :
- Permissions notifications désactivées sur le téléphone
- Token invalide
- Erreur backend lors de l'envoi

**Vérifications** :
```sql
-- 1. Vérifier que le token existe
SELECT * FROM push_tokens WHERE user_id = 'VOTRE_USER_ID';

-- 2. Vérifier la notification
SELECT * FROM notifications 
WHERE user_id = 'VOTRE_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Logs à chercher dans le backend** :
```
[Notifications] Push sent successfully
[Notifications] Error sending push notification
```

### Problème 3 : Erreur "Not a valid Expo push token"
**Solution** : Assurez-vous d'utiliser un vrai device ou l'app Expo Go, pas le simulateur iOS

---

## 📊 Structure de la table push_tokens

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | ID unique |
| user_id | UUID | Référence vers users(id) |
| token | TEXT | Token Expo Push (ExponentPushToken[...]) |
| platform | TEXT | 'ios', 'android' ou 'web' |
| is_active | BOOLEAN | Token encore valide ? |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Dernière mise à jour |

---

## ✨ Flux complet

```
1. Client ouvre l'app
   ↓
2. App demande permission notifications
   ↓
3. Expo génère un token push
   ↓
4. Token enregistré dans push_tokens
   ↓
5. Artisan accepte une mission
   ↓
6. Trigger SQL crée notification
   ↓
7. Backend récupère le token
   ↓
8. Backend envoie push via Expo
   ↓
9. Client reçoit notification 🎉
```

---

## 🎯 Résultat attendu

Après avoir collé le script, quand un artisan accepte une mission :
- ✅ Le client voit une notification dans la liste notifications
- ✅ Le client reçoit un push sur son téléphone
- ✅ Le push contient le nom de l'artisan
- ✅ Taper sur le push ouvre la mission

---

**🚀 Prêt ? Copiez-collez le contenu de `database/FIX_PUSH_TOKENS_TABLE.sql` dans Supabase SQL Editor et cliquez sur Run !**

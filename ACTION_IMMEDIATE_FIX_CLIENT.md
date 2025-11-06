# 🚨 ACTION IMMÉDIATE - FIX NOTIFICATIONS CLIENT

## Le problème
Le client ne reçoit pas de notification quand un artisan accepte sa mission.

## La cause
Le **trigger SQL** qui devait créer automatiquement la notification n'existe pas dans votre base de données Supabase.

---

## ⚡ SOLUTION EN 2 MINUTES

### Étape 1: Ouvrir Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2: Copier-coller le script
1. Ouvrez le fichier `database/FIX_NOTIFICATIONS_CLIENT_FINAL.sql`
2. **Copiez tout le contenu**
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **RUN** (ou Ctrl+Enter)

### Étape 3: Vérifier les résultats
Vous devriez voir à la fin :
```
✅ Trigger trouvé
✅ Fonction trouvée
✅ Realtime vérifié
🎉 CONFIGURATION TERMINÉE
```

---

## 🧪 TESTER

1. **Sur téléphone 1 (Client)** :
   - Connectez-vous en tant que client
   - Créez une nouvelle mission
   - Restez sur l'app

2. **Sur téléphone 2 (Artisan)** :
   - Connectez-vous en tant qu'artisan
   - Acceptez la mission

3. **Résultat attendu sur téléphone 1** :
   - 🔔 Une notification apparaît instantanément
   - Le statut de la mission passe à "Acceptée"
   - La page de suivi s'affiche automatiquement

---

## ❓ Si ça ne marche toujours pas

Vérifiez dans les logs de votre app :
```
🔔 Realtime: New notification
✅ Missions loaded
```

Si vous voyez ces logs, c'est que ça fonctionne ! La notification est bien créée et reçue.

---

## 📝 Ce que fait le script

1. **Crée un trigger SQL** qui s'exécute automatiquement quand une mission est acceptée
2. **Insère une notification** dans la table `notifications` pour le client
3. **Active Realtime** sur la table `notifications` pour que le client reçoive la notification instantanément
4. Le `MissionContext` écoute déjà les changements et affichera la notification automatiquement

**Aucune modification de code n'est nécessaire** - tout est déjà en place dans le code React Native !

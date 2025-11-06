# 🚨 FIX URGENT : Erreur colonne "read"

## ❌ Erreur actuelle
```
ERROR: column "read" of relation "notifications" does not exist
```

## ✅ Solution

### 1️⃣ Ouvrir Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Menu latéral → **SQL Editor**

### 2️⃣ Copier-coller ce script

Ouvrez le fichier **`database/FIX_COLUMN_READ_TO_IS_READ.sql`** et copiez tout son contenu dans l'éditeur SQL de Supabase.

### 3️⃣ Exécuter le script

Cliquez sur **"Run"** (ou Ctrl+Enter)

### 4️⃣ Vérifier les résultats

Vous devriez voir dans les logs :
```
✅ Colonne is_read existe déjà
✅ Trigger actif
✅ Fonction créée
✅ Colonne is_read présente
✅✅✅ CORRECTION TERMINÉE
```

## 🧪 Tester

1. Connectez-vous comme **artisan**
2. Acceptez une **mission**
3. Le **client** doit recevoir une notification immédiatement

## ❓ Si ça ne marche toujours pas

Vérifiez les notifications avec cette requête SQL :

```sql
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

Si aucune notification n'apparaît, vérifiez que le trigger existe :

```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'trg_notify_client_mission_accepted';
```

---

## 📝 Ce que fait le script

1. ✅ Supprime les anciennes fonctions qui utilisaient `read`
2. ✅ Crée/vérifie la colonne `is_read`
3. ✅ Migre les données de `read` vers `is_read` (si nécessaire)
4. ✅ Crée la nouvelle fonction qui utilise `is_read`
5. ✅ Crée le trigger qui envoie les notifications

---

**Temps estimé : 30 secondes** ⏱️

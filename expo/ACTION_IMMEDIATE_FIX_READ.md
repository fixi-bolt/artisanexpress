# ⚡ CORRECTION IMMÉDIATE - Colonne read → is_read

## 🔴 Problème
Erreur: `colonne n.read n'existe pas`

Une ou plusieurs fonctions SQL utilisent encore `n.read` au lieu de `n.is_read`.

## ✅ Solution (30 secondes)

### Étape 1: Ouvrir Supabase
1. Allez sur https://supabase.com
2. Ouvrez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2: Copier-Coller le script
1. Ouvrez le fichier: `database/FIX_READ_COLUMN_FINAL.sql`
2. **COPIEZ TOUT LE CONTENU**
3. **COLLEZ** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"**

### Étape 3: Vérifier
Vous devriez voir:
```
✅ Correction appliquée avec succès! Toutes les fonctions utilisent maintenant is_read
```

## 🎯 Ce que fait ce script

1. ✅ Drop toutes les fonctions problématiques
2. ✅ Recrée `notify_nearby_artisans()` avec `is_read`
3. ✅ Recrée `notify_mission_accepted()` avec `is_read`  
4. ✅ Recrée les triggers
5. ✅ Vérifie que la colonne `is_read` existe
6. ✅ Supprime l'ancienne colonne `read` si elle existe

## 📝 Après l'exécution

Testez immédiatement:
1. Créer une nouvelle mission
2. Vérifier que les artisans reçoivent la notification
3. Accepter la mission
4. Vérifier que le client reçoit la notification

---

**Temps estimé: 30 secondes** ⚡

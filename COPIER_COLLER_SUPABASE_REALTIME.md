# 🚀 CORRECTION REALTIME - À COPIER/COLLER

## 📋 ÉTAPES

### 1️⃣ Ouvrir l'éditeur SQL Supabase
- Aller sur votre dashboard Supabase
- Cliquer sur "SQL Editor" dans le menu de gauche

### 2️⃣ Copier le script ci-dessous

Ouvrez le fichier : `database/FIX_REALTIME_FINAL_CORRECT.sql`

### 3️⃣ Coller et exécuter
- Coller le script dans l'éditeur SQL
- Cliquer sur "Run" ou appuyer sur Ctrl+Enter

## ✅ CE QUE LE SCRIPT FAIT

1. ✅ Retire les tables `notifications` et `missions` de la publication (si elles y sont)
2. ✅ Les rajoute correctement
3. ✅ Active la réplication complète (REPLICA IDENTITY FULL)
4. ✅ Vérifie que tout est configuré correctement

## 🎯 RÉSULTAT ATTENDU

Vous devriez voir dans les logs :
```
Configuration Realtime OK
Table active: public.missions
Table active: public.notifications
```

## 🔍 VÉRIFICATION

Après avoir exécuté le script, le Realtime devrait fonctionner :
- Le client voit instantanément quand l'artisan accepte
- Les notifications arrivent en temps réel
- Le statut de la mission se met à jour automatiquement

---

**Note:** Ce script corrige l'erreur de syntaxe dans la boucle FOR en ajoutant la déclaration `r record;` dans le bloc DECLARE.

# 🔧 CORRECTION ERREUR "function round(double precision, integer) does not exist"

## 🎯 Problème Identifié

Vous ne pouvez plus créer de missions (demandes d'intervention) à cause d'une erreur PostgreSQL :

```
ERROR: function round(double precision, integer) does not exist
```

## 🔍 Cause du Problème

Le trigger `notify_nearby_artisans()` qui s'exécute lors de la création d'une mission utilise la fonction `format()` avec `%.1f` sur une variable `DOUBLE PRECISION`. En interne, PostgreSQL essaie d'utiliser `round(double precision, integer)` qui **n'existe pas**.

PostgreSQL ne supporte que :
- `round(numeric)` - 1 argument
- `round(numeric, integer)` - 2 arguments (pour les décimales)
- `round(double precision)` - 1 argument uniquement

## ✅ Solution

Convertir explicitement `distance_km` de `DOUBLE PRECISION` vers `NUMERIC` avant de l'utiliser dans les messages.

## 📋 Action à Faire MAINTENANT

### 1️⃣ Ouvrir Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**

### 2️⃣ Copier-Coller le Script

Copiez **TOUT** le contenu du fichier `database/FIX_ROUND_FUNCTION_FINAL.sql` et collez-le dans l'éditeur SQL.

### 3️⃣ Exécuter

Cliquez sur le bouton **Run** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

### 4️⃣ Vérifier

Vous devriez voir ces messages dans la console :

```
✅ VÉRIFICATION DE LA CORRECTION
════════════════════════════════════════
✓ Trigger "on_mission_created_notify_artisans" existe
✓ Fonction "notify_nearby_artisans" existe
════════════════════════════════════════
✅ CORRECTION RÉUSSIE !
🎯 Vous pouvez maintenant créer des missions sans erreur
```

## 🧪 Test

Après avoir exécuté le script :

1. **Sur l'app client** : Créez une nouvelle demande d'intervention
2. **Vérifiez** : La mission devrait se créer sans erreur
3. **Bonus** : Les artisans à proximité devraient recevoir une notification

## 📊 Ce que le Script Fait

1. ✅ Supprime l'ancienne fonction avec l'erreur
2. ✅ Recrée la fonction en convertissant `DOUBLE PRECISION` → `NUMERIC`
3. ✅ Utilise `CAST` pour formater correctement les distances
4. ✅ Recrée le trigger pour notifier les artisans
5. ✅ Vérifie que tout est installé correctement

## 🔧 Changements Techniques

### Avant (❌ Erreur)
```sql
format(
  'Mission "%s" à %.1f km de vous',
  NEW.category,
  distance_km  -- DOUBLE PRECISION → Erreur !
)
```

### Après (✅ Corrigé)
```sql
'Mission "' || NEW.category || '" à ' || 
CAST(CAST(distance_km AS NUMERIC(10,1)) AS TEXT) || 
' km de vous'
```

## ❓ Questions Fréquentes

### Q : Pourquoi ça marchait avant ?
**R :** Le trigger a peut-être été ajouté récemment ou la version de PostgreSQL a changé.

### Q : Vais-je perdre des données ?
**R :** Non, ce script ne touche pas aux données existantes, seulement à la fonction trigger.

### Q : Les notifications vont marcher ?
**R :** Oui, les artisans à proximité recevront automatiquement une notification quand une nouvelle mission est créée dans leur zone.

## 🆘 Besoin d'Aide ?

Si vous voyez toujours l'erreur après avoir exécuté le script :

1. Vérifiez que le script s'est exécuté sans erreur dans Supabase
2. Essayez de créer une mission à nouveau
3. Vérifiez les logs de Supabase (Database → Logs)

---

**📁 Fichier SQL à exécuter :** `database/FIX_ROUND_FUNCTION_FINAL.sql`

**⏱️ Temps estimé :** 30 secondes

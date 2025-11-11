# 🔧 CORRECTION : Impossible de créer une demande d'intervention

## 🎯 PROBLÈME IDENTIFIÉ

L'erreur `function round(double precision, integer) does not exist` empêche la création de nouvelles missions.

**Cause :** Le trigger `notify_nearby_artisans_on_mission_create` utilise la fonction `ROUND()` de PostgreSQL avec des types incompatibles.

## 📋 SOLUTION

### Étape 1️⃣ : Copier le script SQL

Ouvrez le fichier : **`database/FIX_ROUND_FUNCTION_ERROR.sql`**

### Étape 2️⃣ : Aller sur Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** (icône de code à gauche)
3. Cliquez sur **"+ New query"**

### Étape 3️⃣ : Coller et exécuter

1. **Copiez tout le contenu** du fichier `database/FIX_ROUND_FUNCTION_ERROR.sql`
2. **Collez-le** dans l'éditeur SQL de Supabase
3. Cliquez sur **"Run"** (ou Ctrl+Entrée)

### Étape 4️⃣ : Vérifier le résultat

Vous devriez voir :
```
✅ Trigger corrigé avec succès!
✅ Trigger existe: true
```

## 🧪 TEST

Après avoir exécuté le script :

1. Rafraîchissez votre application
2. Essayez de créer une nouvelle demande d'intervention
3. Ça devrait fonctionner ! ✅

## 🔍 CE QUI A ÉTÉ CORRIGÉ

Le problème était dans le trigger qui s'exécute automatiquement quand vous créez une mission.

**Avant :**
```sql
ROUND(v_artisan.distance_km, 1)  -- ❌ Ne fonctionne pas
```

**Après :**
```sql
CAST(v_artisan.distance_km AS INTEGER)  -- ✅ Fonctionne
```

## 📝 NOTES

- Cette correction est **permanente**
- Elle n'affecte **pas les missions existantes**
- Les notifications aux artisans proches fonctionneront à nouveau
- La distance affichée sera **arrondie** automatiquement

---

**Temps estimé :** 30 secondes ⏱️

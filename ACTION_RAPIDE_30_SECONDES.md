# ⚡ ACTION RAPIDE (30 SECONDES)

## 🎯 Rendre les Plombiers Visibles - Version Express

### Étape 1 : Ouvrir Supabase SQL Editor
👉 **Supabase Dashboard → SQL Editor**

### Étape 2 : Coller et Exécuter ce Script

```sql
-- 1. ACTIVER DISPONIBILITÉ
UPDATE artisans
SET is_available = true, is_suspended = false, updated_at = NOW()
WHERE category = 'plumber';

-- 2. AJOUTER COORDONNÉES GPS (exemple Paris - À ADAPTER !)
UPDATE artisans
SET 
  latitude = 48.8566,
  longitude = 2.3522,
  intervention_radius = 20,
  updated_at = NOW()
WHERE category = 'plumber' AND (latitude IS NULL OR longitude IS NULL);

-- 3. CORRIGER USER_TYPE
UPDATE users
SET user_type = 'artisan', updated_at = NOW()
WHERE id IN (SELECT id FROM artisans WHERE category = 'plumber')
  AND user_type != 'artisan';

-- 4. VÉRIFICATION
SELECT 
  u.name,
  a.category,
  a.is_available,
  a.latitude,
  a.longitude,
  CASE 
    WHEN a.is_available AND NOT a.is_suspended AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL 
    THEN '✅ VISIBLE'
    ELSE '❌ INVISIBLE'
  END as statut
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber';
```

### Étape 3 : Vérifier le Résultat

Tous les plombiers doivent afficher **"✅ VISIBLE"**.

### Étape 4 : Rafraîchir l'App

- **Web** : `Ctrl+R` ou `Cmd+R`
- **Mobile** : Fermer et rouvrir l'app

---

## ✅ C'est Tout !

Les artisans Plombiers sont maintenant visibles :
- 📍 Sur la carte (marqueurs)
- 📋 Dans la liste des artisans disponibles

---

## ⚠️ IMPORTANT : Coordonnées GPS

Les coordonnées GPS dans le script ci-dessus sont **des exemples pour Paris**.

**Pour une vraie localisation** :
1. Allez sur [Google Maps](https://www.google.com/maps)
2. Cherchez l'adresse de l'artisan
3. Clic droit sur le point → "What's here?"
4. Notez les coordonnées (latitude, longitude)
5. Remplacez dans le script :
   ```sql
   UPDATE artisans
   SET latitude = VOTRE_LATITUDE, longitude = VOTRE_LONGITUDE
   WHERE id = 'ID_ARTISAN';
   ```

---

## 🆘 Si Ça Ne Marche Pas

Lisez : **LIRE_EN_PREMIER_PLOMBIERS.md**

Pour diagnostic complet : **ACTION_IMMEDIATE_PLOMBIERS.md**

# 🚨 ACTIONS À FAIRE MAINTENANT

## ⚡ Action 1: Copier ce script dans Supabase

1. **Ouvrez:** https://supabase.com/dashboard
2. **Cliquez sur:** SQL Editor (dans le menu de gauche)
3. **Créez une nouvelle query**
4. **Copiez-collez ce code:**

```sql
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  earth_radius CONSTANT NUMERIC := 6371;
  d_lat NUMERIC;
  d_lon NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
BEGIN
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);

  a := sin(d_lat / 2) * sin(d_lat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(d_lon / 2) * sin(d_lon / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  distance := earth_radius * c;
  
  RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
```

5. **Cliquez sur RUN** (bouton vert en bas à droite)
6. **Attendez le message:** "Success. No rows returned"

---

## ✅ Action 2: Vérifier que ça fonctionne

Dans le même SQL Editor, collez et exécutez:

```sql
SELECT calculate_distance(48.8566, 2.3522, 45.7640, 4.8357) as distance_km;
```

**Résultat attendu:** environ 392 km (distance Paris-Lyon)

---

## 🎯 Résumé des corrections appliquées

### ✅ Problème 1: Fonction calculate_distance manquante
**Solution:** Script SQL ci-dessus à exécuter dans Supabase

### ✅ Problème 2: Carte disparue
**Solution:** J'ai restauré la vraie carte MapView dans `app/tracking.tsx`

**Fichiers modifiés:**
- ✅ `app/tracking.tsx` - Carte avec marqueurs restaurée
- ✅ `database/fix-calculate-distance.sql` - Script SQL complet
- ✅ `FIX_ERRORS_GUIDE.md` - Guide détaillé

---

## 🧪 Test rapide

1. **Relancez l'app** (si elle tourne déjà)
2. **Créez une mission** en tant que client
3. **Vérifiez:** pas d'erreur dans la console
4. **Si vous avez une mission active:** vérifiez que la carte s'affiche

---

## 📞 Si ça ne marche pas

**Erreur persiste?**
1. Vérifiez que le script SQL a bien été exécuté
2. Regardez les logs Supabase: Dashboard → Logs
3. Vérifiez vos variables `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=votre-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé
   ```

**Carte ne s'affiche pas?**
1. Accordez les permissions de localisation
2. Vérifiez qu'une mission est bien active
3. Regardez la console pour les erreurs

---

## ⚡ EN RÉSUMÉ: Une seule action requise

**→ COPIEZ LE SCRIPT SQL DANS SUPABASE ET CLIQUEZ SUR RUN**

C'est tout ! La carte est déjà restaurée dans le code.

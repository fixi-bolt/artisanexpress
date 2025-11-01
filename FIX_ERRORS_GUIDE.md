# 🔧 Guide de correction des erreurs

## ❌ Problèmes identifiés

### 1. Erreur: fonction calculate_distance n'existe pas
**Erreur complète:**
```
Error: function calculate_distance(numeric, numeric, numeric, numeric) does not exist
```

### 2. La carte a disparu de l'écran de tracking

---

## ✅ Solutions

### Solution 1: Créer la fonction calculate_distance dans Supabase

1. **Ouvrez votre dashboard Supabase** (https://supabase.com/dashboard)

2. **Allez dans l'éditeur SQL** (icône "SQL Editor" dans le menu de gauche)

3. **Copiez et collez le script suivant:**

```sql
-- Fonction pour calculer la distance entre deux points GPS
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

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS';

GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
```

4. **Cliquez sur "RUN"** pour exécuter le script

5. **Vérifiez que ça fonctionne** en testant:
```sql
SELECT calculate_distance(48.8566, 2.3522, 45.7640, 4.8357) as distance_paris_lyon;
-- Devrait retourner environ 392 km
```

---

### Solution 2: Restaurer la carte dans l'écran de tracking

La carte a été remplacée par un placeholder. J'ai créé une version mise à jour avec une vraie carte MapView.

**Fichiers modifiés:**
- ✅ `app/tracking.tsx` - Ajout de la vraie carte avec position de l'artisan

---

## 🧪 Tester les corrections

### Test 1: Créer une mission
1. Ouvrez l'app en tant que **client**
2. Cliquez sur une catégorie d'artisan (ex: Plombier)
3. Remplissez le formulaire de demande
4. Cliquez sur "Envoyer la demande"
5. **Attendu:** La mission est créée sans erreur

### Test 2: Vérifier la carte
1. Avec une mission active, ouvrez l'écran de tracking
2. **Attendu:** Vous devriez voir une carte avec la position de l'artisan

---

## 📋 Checklist

- [ ] Script SQL exécuté dans Supabase
- [ ] Fonction `calculate_distance` créée avec succès
- [ ] Test de création de mission fonctionne
- [ ] Carte visible sur l'écran de tracking
- [ ] Aucune erreur dans la console

---

## 🆘 Si les erreurs persistent

### Erreur Supabase persistante
1. Vérifiez vos variables d'environnement dans `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=votre-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé
   ```

2. Relancez l'application:
   ```bash
   bun run ios
   # ou
   bun run android
   ```

3. Vérifiez les logs de Supabase dans le dashboard → "Logs"

### Carte ne s'affiche pas
1. Vérifiez que vous avez accordé les permissions de localisation
2. Sur iOS: Settings → Privacy → Location Services → Expo Go → "While Using"
3. Sur Android: Settings → Apps → Expo Go → Permissions → Location → Allow

---

## 📞 Besoin d'aide supplémentaire?

Si les problèmes persistent après avoir suivi ce guide:
1. Vérifiez la console pour les logs d'erreur
2. Vérifiez les logs Supabase
3. Assurez-vous que toutes les tables existent dans Supabase

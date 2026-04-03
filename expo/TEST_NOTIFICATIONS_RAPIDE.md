# 🚀 Test Rapide des Notifications - Copier-Coller

## Étape 1: Exécuter le Script de Fix

**Aller dans:** Supabase Dashboard → SQL Editor → New Query

**Copier-coller:** Le contenu du fichier `database/FIX_NOTIFICATIONS_ARTISANS_FINAL.sql`

**Cliquer:** Run

**Attendu:** Messages de confirmation dans les logs, notamment:
```
✅ SYSTÈME DE NOTIFICATIONS CONFIGURÉ
📊 STATISTIQUES: ...
✅ COMPOSANTS ACTIVÉS: ...
```

---

## Étape 2: Vérifier les Artisans Disponibles

```sql
-- Voir les artisans prêts à recevoir des notifications
SELECT 
  u.id,
  u.name,
  u.email,
  a.category,
  a.is_available,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  CASE 
    WHEN a.latitude IS NULL OR a.longitude IS NULL THEN '❌ Pas de GPS'
    WHEN a.is_available = false THEN '❌ Indisponible'
    WHEN a.is_suspended = true THEN '❌ Suspendu'
    ELSE '✅ Prêt'
  END as statut
FROM users u
JOIN artisans a ON a.id = u.id
WHERE u.user_type = 'artisan'
ORDER BY u.created_at DESC;
```

**Si "Pas de GPS" ou "Indisponible":**

```sql
-- Activer un artisan et lui donner des coordonnées (Paris exemple)
UPDATE artisans 
SET 
  is_available = true,
  is_suspended = false,
  is_verified = true,
  latitude = 48.8566,
  longitude = 2.3522,
  intervention_radius = 20
WHERE id = '<ARTISAN_ID>'; -- Remplacer par l'ID d'un artisan
```

---

## Étape 3: Créer une Mission de Test

```sql
-- 1. Récupérer l'ID d'un client existant
SELECT id, name FROM users WHERE user_type = 'client' LIMIT 1;

-- 2. Créer une mission test (adapter les coordonnées selon votre artisan)
INSERT INTO missions (
  client_id,
  category,
  title,
  description,
  latitude,
  longitude,
  address,
  status,
  estimated_price,
  commission
)
VALUES (
  '<CLIENT_ID>',      -- ⚠️ Remplacer par l'ID du client
  'plumber',          -- ⚠️ Adapter à la catégorie de votre artisan
  'Test notification système',
  'Mission créée pour tester le système de notifications automatiques',
  48.8566,            -- ⚠️ Coordonnées proches de votre artisan
  2.3522,
  '15 Rue de Rivoli, 75001 Paris',
  'pending',
  100.00,
  0.10
)
RETURNING id, title, created_at;
```

**Note:** La création de cette mission devrait déclencher automatiquement le trigger et créer les notifications.

---

## Étape 4: Vérifier que les Notifications Ont Été Créées

```sql
-- Voir les dernières notifications créées
SELECT 
  n.id,
  n.created_at,
  u.name as artisan_name,
  u.email,
  n.title,
  n.message,
  n.read,
  m.title as mission_title,
  m.category
FROM notifications n
JOIN users u ON u.id = n.user_id
LEFT JOIN missions m ON m.id = n.mission_id
WHERE n.type = 'mission_request'
  AND n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;
```

**Résultat attendu:**
- Au moins 1 ligne retournée
- `artisan_name` correspond à un artisan disponible
- `message` contient la distance (ex: "à 2.3 km de vous")
- `read = false`
- `mission_title` correspond à votre mission test

**Si aucune ligne:**
→ Aller à "Étape 5: Debugging"

**Si des lignes apparaissent:**
→ ✅ Le système fonctionne ! Passer à "Étape 6: Test Frontend"

---

## Étape 5: Debugging (si aucune notification créée)

### 5.1 Vérifier les Logs Postgres

**Aller dans:** Supabase Dashboard → Logs → Postgres Logs

**Filtrer par:** Les 5 dernières minutes

**Chercher:**
- `[NOTIFICATIONS]`
- `notify_nearby_artisans`

**Logs attendus:**
```
🔔 [NOTIFICATIONS] Nouvelle mission créée: <id> (catégorie: plumber, ...)
✅ [NOTIFICATIONS] Notification envoyée à artisan ...
📊 [NOTIFICATIONS] Total artisans notifiés: X
```

**Si log "Aucun artisan notifié":**
→ Continuer au point 5.2

### 5.2 Vérifier la Distance

```sql
-- Calculer la distance entre mission et artisan
WITH derniere_mission AS (
  SELECT id, latitude, longitude, category
  FROM missions
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  u.name as artisan_name,
  a.category,
  dm.latitude as mission_lat,
  dm.longitude as mission_lon,
  a.latitude as artisan_lat,
  a.longitude as artisan_lon,
  calculate_distance_km(
    dm.latitude, dm.longitude,
    a.latitude, a.longitude
  ) as distance_km,
  a.intervention_radius,
  CASE 
    WHEN calculate_distance_km(dm.latitude, dm.longitude, a.latitude, a.longitude) <= a.intervention_radius
    THEN '✅ DANS LE RAYON'
    ELSE '❌ HORS RAYON'
  END as resultat
FROM artisans a
JOIN users u ON u.id = a.id
CROSS JOIN derniere_mission dm
WHERE a.is_available = true
  AND a.is_suspended = false
  AND a.latitude IS NOT NULL
  AND a.longitude IS NOT NULL
  AND a.category = dm.category
ORDER BY distance_km ASC;
```

**Solutions selon résultat:**
- **"HORS RAYON"** → Augmenter `intervention_radius` ou rapprocher les coordonnées
- **Aucune ligne** → Vérifier que l'artisan a la même catégorie que la mission
- **"DANS LE RAYON"** mais pas de notification → Vérifier le trigger

### 5.3 Vérifier le Trigger

```sql
-- Le trigger existe-t-il ?
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'missions'
  AND trigger_name = 'on_new_mission_notify';
```

**Attendu:** 1 ligne avec `trigger_name = 'on_new_mission_notify'`

**Si aucune ligne:**

```sql
-- Recréer le trigger manuellement
DROP TRIGGER IF EXISTS on_new_mission_notify ON missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION notify_nearby_artisans();
```

### 5.4 Tester la Fonction Manuellement

```sql
-- Appeler la fonction directement sur la dernière mission
DO $$
DECLARE
  mission_record RECORD;
BEGIN
  SELECT * INTO mission_record FROM missions ORDER BY created_at DESC LIMIT 1;
  PERFORM notify_nearby_artisans();
  RAISE NOTICE 'Fonction appelée pour mission: %', mission_record.id;
END $$;
```

---

## Étape 6: Test Frontend (Application)

### 6.1 Vérifier la Subscription Realtime

**Fichier:** `contexts/MissionContext.tsx`

**Chercher:**
```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications',
  filter: `user_id=eq.${user.id}`,
}, ...)
```

**Si absent ou incorrect:**
→ Vérifier que le contexte souscrit bien aux notifications

### 6.2 Test Manuel dans l'App

1. **Se connecter en tant qu'artisan** (celui qui a été notifié)
2. **Aller sur le dashboard artisan**
3. **Vérifier:**
   - Badge de notifications (doit afficher un nombre > 0)
   - Liste des missions disponibles (doit contenir la mission test)
   - Cliquer sur la notification pour la marquer comme lue

### 6.3 Test de Bout en Bout

1. **Ouvrir 2 navigateurs:**
   - Navigateur 1: Client
   - Navigateur 2: Artisan

2. **Client (nav 1):**
   - Créer une nouvelle demande d'intervention
   - Choisir catégorie de l'artisan
   - Valider

3. **Artisan (nav 2):**
   - Observer le badge de notification (devrait s'incrémenter)
   - Rafraîchir si nécessaire
   - Voir la nouvelle mission apparaître

---

## Étape 7: Cleanup (Optionnel)

### Supprimer les missions de test

```sql
-- Voir les missions de test
SELECT id, title, created_at 
FROM missions 
WHERE title LIKE '%Test%' 
ORDER BY created_at DESC;

-- Supprimer (attention: supprime aussi les notifications liées)
DELETE FROM missions 
WHERE title LIKE '%Test notification%'
  AND created_at > NOW() - INTERVAL '1 hour';
```

### Supprimer les notifications de test

```sql
-- Supprimer les notifications liées aux tests
DELETE FROM notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND message LIKE '%Test%';
```

---

## ✅ Résumé des Résultats Attendus

| Étape | Action | Résultat Attendu |
|-------|--------|------------------|
| 1 | Exécuter script SQL | ✅ Messages de confirmation |
| 2 | Vérifier artisans | ✅ Au moins 1 artisan "Prêt" |
| 3 | Créer mission test | ✅ Mission créée avec ID |
| 4 | Vérifier notifications | ✅ Au moins 1 notification créée |
| 5 | Debugging (si besoin) | ✅ Identifier et corriger le blocage |
| 6 | Test frontend | ✅ Notification visible dans l'app |

---

## 🆘 Commandes d'Urgence

### Réinitialiser complètement le système de notifications

```sql
-- ⚠️ ATTENTION: Supprime toutes les notifications existantes
BEGIN;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS on_new_mission_notify ON missions;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS notify_nearby_artisans CASCADE;
DROP FUNCTION IF EXISTS calculate_distance_km CASCADE;

-- Supprimer toutes les notifications
DELETE FROM notifications;

-- Ré-exécuter le script de fix
-- (copier-coller database/FIX_NOTIFICATIONS_ARTISANS_FINAL.sql)

COMMIT;
```

### Activer TOUS les artisans pour test

```sql
-- Activer tous les artisans et leur donner des coordonnées Paris
UPDATE artisans
SET 
  is_available = true,
  is_suspended = false,
  is_verified = true,
  latitude = 48.8566 + (random() * 0.1 - 0.05), -- Variance aléatoire
  longitude = 2.3522 + (random() * 0.1 - 0.05),
  intervention_radius = 20;
```

### Voir le statut complet du système

```sql
SELECT 
  'Artisans totaux' as metric,
  COUNT(*)::TEXT as value
FROM artisans
UNION ALL
SELECT 
  'Artisans disponibles',
  COUNT(*)::TEXT
FROM artisans 
WHERE is_available = true AND is_suspended = false
UNION ALL
SELECT 
  'Artisans avec GPS',
  COUNT(*)::TEXT
FROM artisans 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
UNION ALL
SELECT 
  'Missions pending',
  COUNT(*)::TEXT
FROM missions 
WHERE status = 'pending'
UNION ALL
SELECT 
  'Notifications 24h',
  COUNT(*)::TEXT
FROM notifications 
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'Trigger actif',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_new_mission_notify'
  ) THEN '✅ Oui' ELSE '❌ Non' END;
```

---

## 📞 Contact

Si après tous ces tests le problème persiste, fournir:

1. **Résultat de la commande "Voir le statut complet"**
2. **Logs Postgres des 5 dernières minutes**
3. **Résultat de "Vérifier la Distance"**
4. **Screenshot du dashboard artisan**

Cela permettra un diagnostic plus précis.

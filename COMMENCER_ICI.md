# 🚀 COMMENCER ICI - Fix Notifications Artisans

> **Problème:** Les artisans ne reçoivent pas de notifications quand un client crée une demande dans leur secteur.  
> **Solution:** Script SQL complet + guide de test en 3 étapes.

---

## ⏱️ Temps estimé: 5 minutes

---

## 📋 Étape 1: Exécuter le Script SQL (2 minutes)

### 1.1 Ouvrir Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter à votre projet
3. Cliquer sur **"SQL Editor"** dans le menu gauche
4. Cliquer sur **"New Query"**

### 1.2 Copier-Coller le Script

**Ouvrir le fichier:** `COPIER_COLLER_SUPABASE.sql`

**Tout sélectionner** (Ctrl+A ou Cmd+A) et **copier** (Ctrl+C ou Cmd+C)

**Coller** dans l'éditeur SQL de Supabase

### 1.3 Exécuter

**Cliquer sur le bouton "Run"** (ou Ctrl+Enter)

### 1.4 Vérifier le Succès

Dans les messages en bas de l'écran, vous devriez voir:

```
✅ SYSTÈME DE NOTIFICATIONS CONFIGURÉ
📊 STATISTIQUES:
  • Total artisans: X
  • Artisans disponibles: Y
  • Artisans avec GPS: Z
  ...
```

✅ **Si vous voyez ces messages → Passez à l'étape 2**

❌ **Si erreur → Voir section Dépannage en bas de page**

---

## 🧪 Étape 2: Tester le Système (2 minutes)

### 2.1 Vérifier qu'un Artisan est Prêt

Exécuter cette requête dans SQL Editor:

```sql
SELECT 
  u.id,
  u.name,
  a.category,
  a.is_available,
  a.latitude,
  a.longitude,
  CASE 
    WHEN a.latitude IS NULL THEN '❌ Pas de GPS'
    WHEN NOT a.is_available THEN '❌ Indisponible'
    ELSE '✅ PRÊT'
  END as statut
FROM users u
JOIN artisans a ON a.id = u.id
WHERE u.user_type = 'artisan'
ORDER BY u.created_at DESC
LIMIT 5;
```

**Résultat attendu:**
Au moins 1 ligne avec `statut = '✅ PRÊT'`

**Si aucun artisan prêt:**

```sql
-- Activer un artisan (remplacer <ID> par un ID réel)
UPDATE artisans 
SET 
  is_available = true,
  is_suspended = false,
  latitude = 48.8566,  -- Paris (adapter à votre localisation)
  longitude = 2.3522,
  intervention_radius = 20
WHERE id = '<ID>';
```

### 2.2 Créer une Mission Test

**Option A: Via l'application** (recommandé)
1. Se connecter en tant que client
2. Créer une nouvelle demande d'intervention
3. Choisir la catégorie d'un artisan disponible
4. Valider

**Option B: Via SQL** (pour test rapide)

```sql
-- 1. Récupérer l'ID d'un client
SELECT id FROM users WHERE user_type = 'client' LIMIT 1;

-- 2. Créer la mission (adapter les valeurs)
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
  '<CLIENT_ID>',  -- ⚠️ Remplacer
  'plumber',      -- ⚠️ Adapter à la catégorie de votre artisan
  'Test notification',
  'Mission de test',
  48.8566,        -- ⚠️ Coordonnées proches de l'artisan
  2.3522,
  'Paris',
  'pending',
  100.00,
  0.10
)
RETURNING id;
```

### 2.3 Vérifier la Notification

```sql
-- Voir les notifications créées dans les dernières minutes
SELECT 
  n.created_at,
  u.name as artisan_name,
  n.title,
  n.message,
  n.read
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.type = 'mission_request'
  AND n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC;
```

**Résultat attendu:**
- Au moins 1 ligne
- `message` contient "à X.X km de vous"
- `read = false`

✅ **Si vous voyez des notifications → Succès ! Passez à l'étape 3**

❌ **Si aucune notification → Voir Dépannage**

---

## 📱 Étape 3: Vérifier le Frontend (1 minute)

### 3.1 Se Connecter en tant qu'Artisan

1. Ouvrir l'application
2. Se connecter avec un compte artisan (celui qui a reçu la notification)
3. Aller sur le dashboard artisan

### 3.2 Vérifier

- [ ] Badge de notification (nombre > 0)
- [ ] Liste des missions affiche la nouvelle mission
- [ ] Cliquer sur la mission fonctionne
- [ ] Cliquer "Accepter" fonctionne

✅ **Si tout fonctionne → Problème résolu !**

---

## 🎉 Succès !

Votre système de notifications fonctionne maintenant correctement.

### Ce qui a été corrigé:

✅ Colonne `read` normalisée (au lieu de `is_read`)  
✅ Fonction de calcul de distance GPS précise  
✅ Trigger automatique sur création de mission  
✅ Logs détaillés pour debugging  
✅ Filtre artisans par disponibilité + GPS + catégorie  
✅ Fonction RPC pour marquer comme lu  

---

## 🐛 Dépannage

### Problème 1: Script SQL échoue

**Erreur: "column is_read does not exist"**
→ Normal, le script gère ce cas. Vérifier les messages de succès.

**Erreur: "permission denied"**
→ Vérifier que vous êtes bien admin du projet Supabase.

**Autre erreur:**
→ Copier l'erreur complète et consulter `FIX_NOTIFICATIONS_GUIDE.md` section Debugging

### Problème 2: Aucune notification créée

**Diagnostic:**

```sql
-- Vérifier la distance entre mission et artisan
WITH derniere_mission AS (
  SELECT id, latitude, longitude, category
  FROM missions
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT 
  u.name,
  calculate_distance_km(
    dm.latitude, dm.longitude,
    a.latitude, a.longitude
  ) as distance_km,
  a.intervention_radius,
  CASE 
    WHEN calculate_distance_km(dm.latitude, dm.longitude, a.latitude, a.longitude) <= a.intervention_radius
    THEN '✅ Dans le rayon'
    ELSE '❌ Hors rayon'
  END as resultat
FROM artisans a
JOIN users u ON u.id = a.id
CROSS JOIN derniere_mission dm
WHERE a.category = dm.category
  AND a.is_available = true;
```

**Solutions:**
- Si "Hors rayon" → Augmenter `intervention_radius` ou rapprocher les coordonnées
- Si aucune ligne → Vérifier que artisan et mission ont la même `category`
- Si "Dans le rayon" → Vérifier les logs Postgres (voir ci-dessous)

### Problème 3: Consulter les Logs

**Dans Supabase:**
1. Aller dans **"Logs"**
2. Sélectionner **"Postgres Logs"**
3. Filtrer par les 10 dernières minutes
4. Chercher `[NOTIFICATIONS]`

**Logs attendus:**
```
🔔 [NOTIFICATIONS] Nouvelle mission créée: ...
✅ [NOTIFICATIONS] Notification envoyée à artisan ...
📊 [NOTIFICATIONS] Total artisans notifiés: X
```

**Si log "Aucun artisan notifié":**
→ Retourner au Problème 2 ci-dessus

### Problème 4: Notifications créées mais pas dans l'app

**Vérifier la subscription Realtime:**

Ouvrir `contexts/MissionContext.tsx` et vérifier:

```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications',
  filter: `user_id=eq.${user.id}`,
}, (payload) => {
  console.log('New notification:', payload);
  loadNotifications();
})
```

**Si absent ou différent:**
→ Ajouter/corriger la subscription

---

## 📚 Documentation Complète

Pour plus de détails, consulter:

| Fichier | Description | Quand utiliser |
|---------|-------------|----------------|
| `COPIER_COLLER_SUPABASE.sql` | Script SQL final | Étape 1 uniquement |
| `TEST_NOTIFICATIONS_RAPIDE.md` | Tests détaillés pas-à-pas | Si problème après étape 2 |
| `FIX_NOTIFICATIONS_GUIDE.md` | Guide complet 16 pages | Pour comprendre en profondeur |
| `RECAPITULATIF_NOTIFICATION_FIX.md` | Vue d'ensemble | Pour overview technique |

---

## 🔄 Prochaines Étapes (Optionnel)

Une fois le système fonctionnel:

1. **Monitoring** (recommandé):
   ```sql
   -- Voir les stats des derniers jours
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as total_notifications,
     COUNT(CASE WHEN read THEN 1 END) as lues
   FROM notifications
   WHERE type = 'mission_request'
     AND created_at > NOW() - INTERVAL '7 days'
   GROUP BY DATE(created_at)
   ORDER BY date DESC;
   ```

2. **Ajuster le rayon** si trop/pas assez de notifications:
   ```sql
   -- Augmenter le rayon pour tous les artisans
   UPDATE artisans 
   SET intervention_radius = 30 
   WHERE intervention_radius < 30;
   ```

3. **Notifications push natives** (future enhancement):
   - Intégrer expo-notifications
   - Enregistrer les push tokens
   - Envoyer via FCM/APNs

---

## 📞 Besoin d'Aide ?

Si le problème persiste après avoir suivi ce guide:

1. **Exporter ces informations:**
   ```sql
   SELECT 
     'Trigger' as type, 
     COUNT(*)::text as valeur
   FROM information_schema.triggers 
   WHERE trigger_name = 'on_new_mission_notify'
   UNION ALL
   SELECT 'Artisans avec GPS', COUNT(*)::text 
   FROM artisans 
   WHERE latitude IS NOT NULL
   UNION ALL
   SELECT 'Notifications 1h', COUNT(*)::text 
   FROM notifications 
   WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

2. **Copier les logs Postgres** (dernières 5 minutes)

3. **Fournir:**
   - ID d'un artisan test
   - ID d'une mission test
   - Résultat du diagnostic ci-dessus

---

## ✅ Checklist Rapide

- [ ] Script SQL exécuté sans erreur
- [ ] Message "✅ SYSTÈME DE NOTIFICATIONS CONFIGURÉ" affiché
- [ ] Au moins 1 artisan avec statut "✅ PRÊT"
- [ ] Mission test créée
- [ ] Notification visible dans table `notifications`
- [ ] Logs Postgres montrent `[NOTIFICATIONS]`
- [ ] Badge notification visible dans l'app artisan
- [ ] Mission visible dans liste artisan

**Si toutes les cases cochées → 🎉 Problème résolu !**

---

**Date:** 2025-10-31  
**Temps estimé:** 5 minutes  
**Difficulté:** ⭐⭐☆☆☆ (Facile)

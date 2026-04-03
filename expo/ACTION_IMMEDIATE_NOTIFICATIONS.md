# 🚀 Action Immédiate - Corriger les notifications d'acceptation

## ⏱️ Temps estimé : 5 minutes

## 📋 Étapes à suivre

### Étape 1 : Ouvrir Supabase SQL Editor
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet ArtisanNow
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New query**

### Étape 2 : Copier-coller le script
1. Ouvrez le fichier `database/FIX_NOTIFICATION_MISSION_ACCEPTED.sql`
2. **Copiez TOUT le contenu** (Ctrl+A puis Ctrl+C)
3. **Collez** dans Supabase SQL Editor (Ctrl+V)

### Étape 3 : Exécuter
1. Cliquez sur le bouton **Run** (ou Ctrl+Enter)
2. Attendez 2-3 secondes
3. Vérifiez le message de succès en bas :
   ```
   ✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS
   🔔 Le trigger de notification est maintenant actif
   ```

### Étape 4 : Vérifier que ça marche
1. Dans l'app, connectez-vous en tant qu'**artisan**
2. Acceptez une mission pending
3. Dans Supabase, exécutez cette requête :
   ```sql
   SELECT * FROM notifications 
   WHERE type = 'mission_accepted' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
4. ✅ Vous devez voir la notification créée automatiquement

### Étape 5 : Vérifier côté client
1. Connectez-vous en tant que **client** (le propriétaire de la mission)
2. Ouvrez la page des notifications
3. ✅ Vous devez voir : "Mission acceptée ! Un artisan arrive bientôt"

---

## 🎯 Que fait ce script ?

### Avant (code actuel)
```
Artisan clique "Accepter"
    ↓
1. Update mission.status = 'accepted' ✅
    ↓
2. Recherche mission dans state React ❌ (peut échouer)
    ↓
3. Insert notification ❌ (peut échouer silencieusement)
    ↓
Client notifié ❓ (pas garanti)
```

### Après (avec trigger SQL)
```
Artisan clique "Accepter"
    ↓
1. Update mission.status = 'accepted' ✅
    ↓
2. TRIGGER SQL automatique 🔥
    ↓
3. Insert notification GARANTI ✅
    ↓
Client notifié ✅ (100% du temps)
```

---

## 🔍 Requêtes de diagnostic

### Voir toutes les notifications d'acceptation
```sql
SELECT 
  n.created_at,
  n.title,
  n.message,
  u.name as client,
  m.title as mission
FROM notifications n
JOIN users u ON n.user_id = u.id
JOIN missions m ON n.mission_id = m.id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC;
```

### Trouver les missions acceptées SANS notification (bug)
```sql
SELECT 
  m.id,
  m.title,
  m.accepted_at,
  COUNT(n.id) as nb_notifications
FROM missions m
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted'
  AND m.accepted_at > NOW() - INTERVAL '7 days'
GROUP BY m.id, m.title, m.accepted_at
HAVING COUNT(n.id) = 0;
```
⚠️ Cette requête doit retourner **0 lignes** après le fix

### Vérifier que le trigger est actif
```sql
SELECT 
  tgname,
  tgrelid::regclass as table,
  CASE WHEN tgenabled = 'O' THEN '✅ Actif' ELSE '❌ Inactif' END as status
FROM pg_trigger
WHERE tgname = 'notify_client_on_mission_accepted';
```

---

## 🐛 En cas de problème

### Le trigger n'apparaît pas
```sql
-- Réexécuter juste la création du trigger
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;

CREATE TRIGGER notify_client_on_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();
```

### Erreur "function does not exist"
```sql
-- Réexécuter juste la fonction
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_mission_title TEXT;
  v_artisan_name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    SELECT 
      m.client_id,
      m.title,
      a_user.name
    INTO 
      v_client_id,
      v_mission_title,
      v_artisan_name
    FROM missions m
    LEFT JOIN users a_user ON m.artisan_id = a_user.id
    WHERE m.id = NEW.id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      mission_id
    ) VALUES (
      v_client_id,
      'mission_accepted',
      'Mission acceptée !',
      COALESCE(v_artisan_name || ' arrive bientôt pour "' || v_mission_title || '"', 
               'Un artisan arrive bientôt'),
      NEW.id
    );

    RAISE NOTICE 'Notification créée pour client %', v_client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### La notification n'apparaît pas dans l'app
1. Vérifiez qu'elle existe en DB (requête de diagnostic ci-dessus)
2. Si elle existe en DB mais pas dans l'app :
   - Vérifiez que le realtime est actif (voir `MissionContext.tsx` ligne 127-163)
   - Forcez un refresh : tirez la liste vers le bas
   - Redémarrez l'app

---

## ✅ Checklist finale

- [ ] Script SQL exécuté sans erreur
- [ ] Message de succès affiché dans Supabase
- [ ] Trigger visible dans la requête de vérification
- [ ] Test : Accepter une mission ➜ Notification créée en DB
- [ ] Test : Client reçoit la notification dans l'app
- [ ] (Optionnel) Notifications en double supprimées
- [ ] (Optionnel) Code React simplifié (voir FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md)

---

## 📚 Fichiers de référence

1. **Script SQL principal** : `database/FIX_NOTIFICATION_MISSION_ACCEPTED.sql`
2. **Diagnostic complet** : `FIX_NOTIFICATIONS_ACCEPTATION_MISSION.md`
3. **Requêtes de monitoring** : `VERIFICATION_NOTIFICATIONS.sql`

---

## 🎉 Résultat attendu

Après cette correction, **100% des missions acceptées** génèreront automatiquement une notification pour le client, de manière **fiable** et **garantie** par le database.

Plus besoin de se soucier des erreurs réseau, plantages app, ou race conditions ! 🚀

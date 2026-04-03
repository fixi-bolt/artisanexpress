# ⚡ Correction en 30 Secondes

## 🎯 Problème
Les clients ne reçoivent pas de notification quand un artisan accepte leur mission.

## ✅ Solution (30 secondes)

### Étape 1 (10 sec)
Ouvrir [Supabase SQL Editor](https://supabase.com) → Votre projet → SQL Editor → New query

### Étape 2 (10 sec)
Copier-coller ce code :

```sql
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE v_client_id UUID; v_artisan_name TEXT; v_title TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT m.client_id, m.title, a.name INTO v_client_id, v_title, v_artisan_name
    FROM missions m LEFT JOIN users a ON m.artisan_id = a.id WHERE m.id = NEW.id;
    
    INSERT INTO notifications (user_id, type, title, message, mission_id)
    VALUES (v_client_id, 'mission_accepted', 'Mission acceptée !', 
            COALESCE(v_artisan_name || ' arrive bientôt', 'Un artisan arrive bientôt'), NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;
CREATE TRIGGER notify_client_on_mission_accepted
  AFTER UPDATE ON missions FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();
```

### Étape 3 (10 sec)
Cliquer **Run** → Voir `✅ Success`

## ✅ C'est fait !
Les clients recevront maintenant automatiquement une notification à chaque acceptation.

---

## 🔍 Vérification rapide
```sql
-- Doit retourner 1 ligne
SELECT * FROM pg_trigger WHERE tgname = 'notify_client_on_mission_accepted';
```

## 📚 Documentation complète
Voir `LIRE_MOI_EN_PREMIER_NOTIFICATIONS.txt`

# ⚡ ACTION IMMÉDIATE - COPIER-COLLER CE CODE

## 🎯 Instructions (30 secondes)

### 1️⃣ Ouvrez Supabase
Allez sur : https://app.supabase.com  
→ Sélectionnez votre projet  
→ Cliquez sur **"SQL Editor"** dans le menu

### 2️⃣ Copiez le code ci-dessous

### 3️⃣ Collez dans l'éditeur SQL de Supabase

### 4️⃣ Cliquez sur "Run" (ou Ctrl+Enter)

---

## 📋 CODE À COPIER-COLLER

```sql
-- ═══════════════════════════════════════════════════════════════
-- CORRECTION ACCEPTATION MISSION - Script Complet
-- ═══════════════════════════════════════════════════════════════

-- 1. Nettoyage
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;

-- 2. Correction colonne is_read
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
    END IF;
END $$;

-- 3. Création de la fonction
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
BEGIN
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        SELECT u.name INTO v_artisan_name
        FROM users u
        WHERE u.id = NEW.artisan_id;
        
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            mission_id,
            is_read,
            created_at
        ) VALUES (
            NEW.client_id,
            'mission_accepted',
            'Mission acceptée !',
            COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || NEW.title || '"',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour client %', NEW.client_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Création du trigger
CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 5. Activation Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- 6. Vérification
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ INSTALLATION TERMINÉE !';
    RAISE NOTICE '';
    RAISE NOTICE 'Test: Acceptez une mission depuis le dashboard artisan';
    RAISE NOTICE 'Le client devrait recevoir la notification';
    RAISE NOTICE '';
END $$;
```

---

## ✅ Vous devriez voir ce message

Après avoir exécuté le script, vous verrez dans les logs :

```
✅ INSTALLATION TERMINÉE !

Test: Acceptez une mission depuis le dashboard artisan
Le client devrait recevoir la notification
```

---

## 🧪 Test Rapide

1. **Connectez-vous en tant qu'ARTISAN**
2. **Acceptez une mission**
3. **Connectez-vous en tant que CLIENT**
4. **Vérifiez la notification** (icône cloche 🔔)

---

## ⚠️ Si ça ne marche toujours pas

Exécutez cette requête pour diagnostiquer :

```sql
-- Vérifier que le trigger existe
SELECT COUNT(*) as trigger_count 
FROM pg_trigger 
WHERE tgname = 'trg_notify_mission_accepted';

-- Vérifier Realtime
SELECT COUNT(*) as realtime_count
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('notifications', 'missions');
```

**Résultat attendu** :
- `trigger_count = 1`
- `realtime_count = 2`

---

## 📞 Besoin d'aide ?

Si le problème persiste, fournissez :
1. La sortie du script SQL
2. Les logs de la console (F12)
3. Les résultats des requêtes de diagnostic

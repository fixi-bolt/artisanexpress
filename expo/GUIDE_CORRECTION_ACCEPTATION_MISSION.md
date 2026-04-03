# ✅ CORRECTION ACCEPTATION MISSION - GUIDE

## 📋 Problèmes Identifiés

### 1. **Dashboard Artisan** (`app/(artisan)/dashboard.tsx`)
- ❌ L'appel à `acceptMission` n'était pas `await`
- ❌ L'alerte de succès s'affichait immédiatement sans attendre
- ❌ Pas de gestion d'erreur

### 2. **MissionContext** (`contexts/MissionContext.tsx`)
- ❌ **DOUBLON** : La notification était créée 2 fois
  - Une fois manuellement via `supabase.from('notifications').insert()`
  - Une autre fois via `sendNotification()`

### 3. **Trigger SQL**
- ❌ Créait une **3ème notification** en plus des deux autres

### 4. **Résultat**
- Le client ne recevait pas de notification (erreurs RLS)
- Ou recevait 3 notifications en cas de succès
- La demande restait en attente car l'erreur n'était pas visible

---

## ✅ Corrections Appliquées

### 1. **Dashboard Artisan** - Corrigé ✅
```typescript
// AVANT (ligne 84-86)
onPress: () => {
  acceptMission(missionId, user?.id || '');
  Alert.alert('Mission acceptée !', 'Le client a été notifié.');
},

// APRÈS (ligne 83-93)
onPress: async () => {
  try {
    console.log('🎯 Starting mission acceptance:', missionId);
    await acceptMission(missionId, user?.id || '');
    console.log('✅ Mission accepted successfully:', missionId);
    Alert.alert('Mission acceptée !', 'Le client a été notifié. Rendez-vous chez lui.');
  } catch (error) {
    console.error('❌ Error accepting mission:', error);
    Alert.alert('Erreur', 'Impossible d\'accepter la mission. Réessayez.');
  }
},
```

**Changements:**
- ✅ Ajout de `async/await`
- ✅ Attend la fin de l'opération avant d'afficher l'alerte
- ✅ Gestion d'erreur avec try/catch
- ✅ Logs détaillés pour le débogage

---

### 2. **MissionContext** - Corrigé ✅
```typescript
// AVANT (lignes 284-318) - DOUBLON !
const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
  // ... update mission ...
  
  // 1️⃣ Première notification (manuelle)
  const { data: notifData, error: notifError } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();
  
  // 2️⃣ Deuxième notification (via sendNotification)
  sendNotification({
    userId: mission.clientId,
    title: 'Mission acceptée',
    message: `Votre mission "${mission.title}" a été acceptée`,
    type: 'mission_accepted',
    missionId,
  });
}, [missions, sendNotification]);

// APRÈS (lignes 261-289) - UNE SEULE SOURCE
const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
  try {
    console.log('🎯 Accepting mission:', missionId, 'by artisan:', artisanId);
    
    const { error: updateError } = await supabase
      .from('missions')
      .update({
        status: 'accepted',
        artisan_id: artisanId,
        accepted_at: new Date().toISOString(),
        eta: 15,
      })
      .eq('id', missionId);

    if (updateError) {
      console.error('❌ Error updating mission:', updateError);
      throw updateError;
    }

    console.log('✅ Mission accepted:', missionId);
    console.log('✅ Trigger SQL will automatically create notification for client');
    console.log('✅ Push notification will be sent by backend');
    
    await loadMissions();
  } catch (error) {
    console.error('❌ Error accepting mission:', error);
    throw error;
  }
}, [loadMissions]);
```

**Changements:**
- ✅ Suppression du doublon de notification manuelle
- ✅ Suppression de l'appel à `sendNotification()`
- ✅ Le trigger SQL s'occupe de créer UNE SEULE notification
- ✅ Simplification du code (moins de bugs potentiels)

---

### 3. **Trigger SQL** - Corrigé ✅
**Fichier:** `database/FIX_ACCEPTATION_MISSION_FINAL.sql`

```sql
-- Supprime tous les anciens triggers (évite les doublons)
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;

-- Crée UNE SEULE fonction propre
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
BEGIN
    -- Vérifie que le statut passe à 'accepted'
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupère le nom de l'artisan
        SELECT u.name INTO v_artisan_name
        FROM users u
        WHERE u.id = NEW.artisan_id;
        
        -- Crée UNE SEULE notification
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

-- Crée UN SEUL trigger
CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();
```

**Changements:**
- ✅ Suppression de tous les anciens triggers/fonctions
- ✅ Création d'UN SEUL trigger propre
- ✅ `SECURITY DEFINER` : permet d'insérer dans notifications malgré RLS
- ✅ Vérification que le statut change vraiment (évite les doublons)
- ✅ Logs avec `RAISE NOTICE` pour le débogage

---

## 📝 Instructions d'Installation

### Étape 1: Copier le script SQL
1. Ouvrir Supabase Dashboard
2. Aller dans **SQL Editor**
3. Copier le contenu de `database/FIX_ACCEPTATION_MISSION_FINAL.sql`
4. Coller et exécuter

### Étape 2: Vérifier l'installation
Le script affiche automatiquement :
```
════════════════════════════════════════
✅ VÉRIFICATION DE L'INSTALLATION
════════════════════════════════════════

✓ Trigger "trg_notify_mission_accepted" existe
✓ Fonction "notify_client_on_mission_accepted" existe
✓ Realtime activé pour "notifications"
✓ Realtime activé pour "missions"

════════════════════════════════════════
✅ INSTALLATION RÉUSSIE !

📋 Résumé des corrections:
  1. Dashboard: attend la fin de acceptMission
  2. MissionContext: suppression du doublon de notification
  3. Trigger SQL: crée UNE SEULE notification
  4. Realtime: activé pour notifications et missions

🧪 Test: Acceptez une mission depuis le dashboard artisan
   → Le client devrait recevoir UNE notification
════════════════════════════════════════
```

### Étape 3: Tester
1. Connectez-vous en tant qu'**Artisan**
2. Allez sur le **Dashboard Artisan**
3. Acceptez une mission
4. Vérifiez les logs console :
   ```
   🎯 Starting mission acceptance: [missionId]
   🎯 Accepting mission: [missionId] by artisan: [artisanId]
   ✅ Mission accepted: [missionId]
   ✅ Trigger SQL will automatically create notification for client
   ✅ Mission accepted successfully: [missionId]
   ```
5. Connectez-vous en tant que **Client** (compte qui a créé la mission)
6. Vérifiez que **UNE notification** apparaît
7. Vérifiez les logs console côté client :
   ```
   🔔 Realtime: New notification received!
   🔔 Notification data: {type: 'mission_accepted', ...}
   ```

---

## 🔍 Diagnostic des Problèmes

### Si le client ne reçoit toujours pas de notification :

#### 1. Vérifier que le trigger existe
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted';
```

#### 2. Vérifier les notifications créées
```sql
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

#### 3. Vérifier Realtime
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('notifications', 'missions');
```

#### 4. Vérifier les logs Postgres
Dans Supabase Dashboard → **Database** → **Logs**
Chercher : `Notification créée pour client`

---

## 🎯 Flux Corrigé

```
1. Artisan clique sur "Accepter"
   └─> handleAcceptMission() appelé
       └─> Alert.alert() avec confirmation
           └─> onPress: async () => await acceptMission()

2. acceptMission() dans MissionContext
   └─> supabase.update() missions SET status='accepted'
       └─> Trigger SQL détecté (AFTER UPDATE)
           └─> notify_client_on_mission_accepted() exécuté
               └─> INSERT INTO notifications (1 seule fois)
                   └─> Realtime broadcast vers le client

3. Client reçoit la notification
   └─> Realtime listener détecte l'INSERT
       └─> loadNotifications() appelé
           └─> UI mise à jour avec la nouvelle notification
```

---

## ✅ Résultat Final

- ✅ Le client reçoit **UNE SEULE** notification
- ✅ La notification est créée automatiquement par le trigger SQL
- ✅ Le Dashboard attend la fin de l'opération
- ✅ Gestion d'erreur appropriée
- ✅ Logs détaillés pour le débogage
- ✅ Code simplifié (moins de doublons)

---

## 📚 Fichiers Modifiés

1. ✅ `app/(artisan)/dashboard.tsx` - Ajout async/await + error handling
2. ✅ `contexts/MissionContext.tsx` - Suppression doublon notification
3. ✅ `database/FIX_ACCEPTATION_MISSION_FINAL.sql` - Trigger SQL corrigé

---

## 🚀 Prochaines Étapes

Une fois les corrections testées et validées :
1. Supprimer les anciens fichiers SQL obsolètes
2. Documenter le flux dans la documentation technique
3. Créer des tests automatisés pour ce flux

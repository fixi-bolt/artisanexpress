# 🔔 Diagnostic & Correction - Notifications d'acceptation de mission

## 📊 Diagnostic

### Problème identifié
Quand un artisan accepte une mission, **le client ne reçoit pas de notification** bien que l'interface indique "Le client a été notifié".

### Cause racine
1. **Pas de trigger SQL automatique** : La création de la notification repose uniquement sur le code applicatif React (`MissionContext.tsx` ligne 277-283)
2. **Point de défaillance unique** : Si le code client plante, rate la requête, ou si la session se termine, la notification n'est jamais créée
3. **Aucune garantie transactionnelle** : L'update de la mission et l'insert de notification ne sont pas atomiques

### Code actuel (MissionContext.tsx ligne 261-300)
```typescript
const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
  try {
    // 1. Update mission status
    const { error: updateError } = await supabase
      .from('missions')
      .update({
        status: 'accepted',
        artisan_id: artisanId,
        accepted_at: new Date().toISOString(),
        eta: 15,
      })
      .eq('id', missionId);

    if (updateError) throw updateError;

    // 2. Try to insert notification (peut échouer silencieusement)
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      await supabase.from('notifications').insert({
        user_id: mission.clientId,
        type: 'mission_accepted',
        title: 'Mission acceptée !',
        message: 'Un artisan arrive bientôt',
        mission_id: missionId,
      });
      // ⚠️ Pas de gestion d'erreur ici
    }
    ...
  }
}, [missions, sendNotification]);
```

### Pourquoi ça échoue
- ❌ Notification créée APRÈS l'update (2 requêtes séparées)
- ❌ Si `missions.find()` échoue, pas de notification
- ❌ Si l'insert notification échoue, erreur silencieuse
- ❌ Pas de retry automatique
- ❌ Race conditions possibles avec realtime

## ✅ Solution recommandée

### Approche : Trigger SQL automatique
Créer un **trigger PostgreSQL** qui insère automatiquement une notification quand une mission passe au statut `accepted`.

### Avantages
✅ **Atomique** : Garantie transactionnelle
✅ **Automatique** : Fonctionne même si le code client plante
✅ **Fiable** : Pas de dépendance au code React
✅ **Centralisé** : Une seule source de vérité
✅ **Performances** : Exécution côté serveur

## 🛠️ Script SQL à exécuter

Voir le fichier `database/FIX_NOTIFICATION_MISSION_ACCEPTED.sql`

## 📋 Plan de tests

### 1. Test manuel (après exécution du script)
1. Se connecter en tant qu'artisan
2. Accepter une mission pending
3. Vérifier dans Supabase SQL Editor :
   ```sql
   SELECT * FROM notifications 
   WHERE mission_id = '<ID_DE_LA_MISSION>' 
   AND type = 'mission_accepted'
   ORDER BY created_at DESC;
   ```
4. Vérifier que le client reçoit bien la notification dans l'app

### 2. Test de robustesse
- Couper le réseau juste après l'acceptation ➜ La notification doit quand même être créée (trigger SQL)
- Tuer l'app juste après le clic ➜ La notification doit être présente en DB

### 3. Test de non-régression
- Créer une mission ➜ OK
- Compléter une mission ➜ OK (trigger existant ligne 334 MissionContext)
- Vérifier qu'aucune notification en double n'est créée

## 🔍 Vérifications post-correction

### Requête de diagnostic
```sql
-- Vérifier que le trigger existe
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'notify_client_on_mission_accepted';

-- Vérifier les notifications récentes
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.user_id,
  u.name as client_name,
  m.title as mission_title,
  m.status,
  n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
LEFT JOIN missions m ON n.mission_id = m.id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC
LIMIT 10;
```

### Logs à surveiller
- Console React : `✅ Mission accepted: <ID>`
- Console React : `✅ New notification` (realtime)
- Supabase Logs : `TRIGGER notify_client_on_mission_accepted executed`

## 📝 Modifications du code React (optionnel)

Le trigger SQL rend le code applicatif plus simple. Vous pouvez **simplifier** `MissionContext.tsx` :

```typescript
const acceptMission = useCallback(async (missionId: string, artisanId: string) => {
  try {
    // L'insert de notification est maintenant géré par le trigger SQL
    const { error: updateError } = await supabase
      .from('missions')
      .update({
        status: 'accepted',
        artisan_id: artisanId,
        accepted_at: new Date().toISOString(),
        eta: 15,
      })
      .eq('id', missionId);

    if (updateError) throw updateError;

    // Notification créée automatiquement par trigger SQL
    console.log('✅ Mission accepted, notification sent via trigger');

    await loadMissions();
  } catch (error) {
    console.error('❌ Error accepting mission:', error);
    throw error;
  }
}, []);
```

## 🎯 Résumé des actions

1. ✅ Copier le contenu de `database/FIX_NOTIFICATION_MISSION_ACCEPTED.sql`
2. ✅ Le coller dans Supabase SQL Editor
3. ✅ Exécuter le script
4. ✅ Tester l'acceptation d'une mission
5. ✅ Vérifier la présence de la notification en DB
6. ✅ (Optionnel) Simplifier le code React

## 🚨 Note importante

Ce trigger gère **uniquement** les notifications d'acceptation (`mission_accepted`).

Les autres types de notifications sont déjà gérés :
- `mission_request` : Lors de la création (code React ligne 225-232)
- `mission_completed` : Lors de la complétion (code React ligne 334-348)
- `payment` : Via backend tRPC

Si vous souhaitez automatiser TOUTES les notifications via triggers, créez un ticket séparé.

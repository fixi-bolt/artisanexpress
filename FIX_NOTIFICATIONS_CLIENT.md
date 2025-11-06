# 🔔 CORRECTION : Le client ne voit pas quand un artisan accepte la mission

## Problème
Le client n'est pas notifié et ne voit pas quand un artisan accepte sa mission.

## Cause
1. Le trigger SQL n'est peut-être pas activé dans la base de données
2. Le realtime n'est peut-être pas configuré correctement
3. Les politiques RLS peuvent bloquer les notifications

## Solution

### ÉTAPE 1 : Exécuter le script SQL

1. **Allez sur Supabase** : https://supabase.com/dashboard
2. **Ouvrez votre projet**
3. **Allez dans SQL Editor** (dans le menu de gauche)
4. **Créez une nouvelle requête**
5. **Copiez-collez le contenu du fichier** `database/FIX_CLIENT_NOTIFICATIONS.sql`
6. **Exécutez le script** (bouton "Run" ou Ctrl+Enter)

Le script va :
- ✅ Créer/vérifier la table notifications
- ✅ Créer un trigger automatique qui insère une notification quand une mission est acceptée
- ✅ Activer le realtime sur la table notifications
- ✅ Tester le trigger automatiquement
- ✅ Afficher les vérifications

### ÉTAPE 2 : Vérifier que ça fonctionne

Après avoir exécuté le script, vous devriez voir dans les logs :

```
✅ TEST RÉUSSI : Notification créée automatiquement
✅ Trigger actif
✅ Fonction créée
✅ Realtime activé
```

### ÉTAPE 3 : Test dans l'application

1. **Connectez-vous comme CLIENT**
   - Créez une mission
   
2. **Connectez-vous comme ARTISAN** (autre appareil/navigateur)
   - Acceptez la mission
   
3. **Retournez sur le CLIENT**
   - Vous devriez voir la notification apparaître automatiquement
   - La mission devrait changer de statut

## Comment ça marche ?

### 1. Trigger SQL automatique
Quand un artisan accepte une mission (UPDATE status = 'accepted'), le trigger SQL s'exécute automatiquement et :
- Insère une notification dans la table `notifications`
- Avec le `user_id` du client
- Le message "Mission acceptée ! [Artisan] arrive bientôt"

### 2. Realtime Supabase
Le système realtime de Supabase envoie automatiquement les nouvelles notifications au client en temps réel.

### 3. Frontend (déjà en place)
Le code dans `MissionContext.tsx` écoute déjà les nouvelles notifications :
```typescript
.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'notifications',
  filter: `user_id=eq.${user.id}`,
}, () => {
  loadNotifications();
})
```

## Vérification manuelle

Si vous voulez vérifier manuellement dans Supabase :

1. **Après avoir accepté une mission**, allez dans l'éditeur SQL
2. **Exécutez cette requête** :
```sql
SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.created_at,
  u.name as client_name,
  m.title as mission_title
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN missions m ON n.mission_id = m.id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC
LIMIT 10;
```

Vous devriez voir les notifications de type `mission_accepted`.

## Si ça ne marche toujours pas

### Vérification 1 : Le trigger est-il actif ?
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_notify_client_mission_accepted';
```

Si aucun résultat, le trigger n'est pas créé. Réexécutez le script.

### Vérification 2 : Le realtime est-il activé ?
```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Vous devriez voir `notifications` et `missions` dans la liste.

### Vérification 3 : Les politiques RLS
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

Vous devriez voir des politiques permettant :
- SELECT pour l'utilisateur propriétaire
- INSERT pour tout le monde (le trigger a besoin de ça)

## Support

Si le problème persiste après avoir suivi ces étapes, vérifiez :
1. Les logs de la console dans l'application
2. Les logs SQL dans Supabase (onglet Logs)
3. Que le trigger s'exécute bien (vous verrez les NOTICE dans les logs SQL)

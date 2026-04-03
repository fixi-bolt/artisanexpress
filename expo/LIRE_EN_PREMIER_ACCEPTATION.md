# 🚨 FIX URGENT : Notifications d'acceptation de mission

## 📋 Problème
Quand un artisan accepte une mission :
- ❌ Le statut reste "pending" au lieu de passer à "accepted"
- ❌ Le client ne reçoit pas de notification
- ❌ Le realtime ne se déclenche pas

## ✅ Solution en 30 secondes

### 1. Ouvrez Supabase
Allez sur : https://supabase.com/dashboard/project/[VOTRE_PROJECT_ID]/sql/new

### 2. Copiez-collez le script
Ouvrez le fichier `FIX_ACCEPTATION_MISSION_MAINTENANT.sql` et copiez tout son contenu.

### 3. Exécutez
Cliquez sur "Run" dans Supabase.

### 4. Vérifiez les résultats
Vous devriez voir :
- ✅ Fonction créée
- ✅ Trigger créé
- ✅ Permissions configurées
- ✅ TEST RÉUSSI !

## 🧪 Test manuel

Une fois le script exécuté :

1. **Connectez-vous en tant qu'artisan**
   - Ouvrez l'app
   - Allez sur le dashboard artisan

2. **Acceptez une mission**
   - Cliquez sur "Accepter" sur une mission pending
   - Vous devriez voir "Mission acceptée !"

3. **Vérifiez côté client**
   - Connectez-vous avec le compte client
   - Vous devriez voir une notification : "✅ Mission acceptée !"
   - Le statut de la mission devrait être "accepted"

## 🔍 Diagnostic

Si ça ne marche toujours pas après le script, vérifiez :

### Backend (Supabase)
```sql
-- Vérifier que le trigger existe et est actif
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trg_notify_mission_accepted';

-- Devrait retourner : trg_notify_mission_accepted | O (O = actif)
```

### Frontend (Console du navigateur)
```javascript
// Côté artisan - après avoir cliqué sur "Accepter"
// Vous devriez voir dans la console :
"🎯 Accepting mission: [id] by artisan: [artisan_id]"
"✅ Mission accepted: [id]"

// Côté client - dans la console
// Vous devriez voir :
"🔔 Realtime: New notification"
```

## 🐛 Problèmes courants

### Problème 1 : "Column is_read does not exist"
**Solution :** La colonne existe mais s'appelle peut-être "read" au lieu de "is_read"
```sql
-- Renommer la colonne
ALTER TABLE public.notifications 
RENAME COLUMN read TO is_read;
```

### Problème 2 : Le trigger ne se déclenche pas
**Cause possible :** Le statut ne change pas vraiment (déjà à "accepted")
**Solution :** Vérifier que le statut de la mission est bien "pending" avant l'acceptation

### Problème 3 : Notification créée mais client ne la voit pas
**Cause possible :** Problème de realtime ou de souscription
**Solution :**
1. Vérifier que le client a bien un channel actif
2. Vérifier les logs dans `MissionContext.tsx` ligne 132
3. Forcer un refresh : appeler `refreshNotifications()`

## 📝 Ce qui a été corrigé

### Dans le SQL
1. ✅ Créé la fonction `notify_client_on_mission_accepted()`
2. ✅ Créé le trigger `trg_notify_mission_accepted`
3. ✅ Configuré les permissions RLS correctement
4. ✅ Ajouté la table notifications à la publication realtime
5. ✅ Ajouté un test automatique

### Ce qui fonctionne maintenant
- ✅ Quand l'artisan accepte (UPDATE status = 'accepted')
- ✅ Le trigger se déclenche automatiquement
- ✅ Une notification est insérée dans la table notifications
- ✅ Le realtime notifie le client
- ✅ Le client reçoit la notification en temps réel

## 🎯 Prochaines étapes

Si tout fonctionne, vous pouvez :
1. Tester avec plusieurs clients et artisans
2. Vérifier que les notifications apparaissent bien dans l'UI
3. Vérifier que le compteur de notifications non lues fonctionne
4. Nettoyer les données de test si nécessaire

## 💡 Conseil

Pour éviter ce genre de problème à l'avenir :
- Toujours créer les triggers en même temps que les tables
- Tester immédiatement après la création
- Utiliser des scripts de test automatiques
- Vérifier les logs côté frontend ET backend

## 📞 Besoin d'aide ?

Si ça ne marche toujours pas :
1. Exécutez le script de diagnostic : `DIAGNOSTIC_ACCEPTATION_MISSION.sql`
2. Regardez les logs dans la console (frontend)
3. Vérifiez les NOTICE dans Supabase (backend)
4. Partagez les erreurs exactes que vous voyez

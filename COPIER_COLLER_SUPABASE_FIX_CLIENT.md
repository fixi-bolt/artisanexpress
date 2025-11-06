# 🚨 FIX URGENT : Client ne voit pas quand artisan accepte mission

## ⚡ ACTION RAPIDE (30 secondes)

### Étape 1 : Copier le script SQL
Ouvrez le fichier : `database/FIX_MISSION_STATUS_CLIENT.sql`

### Étape 2 : Coller dans Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" (à gauche)
4. Cliquez sur "+ New Query"
5. **COLLEZ tout le contenu du fichier `FIX_MISSION_STATUS_CLIENT.sql`**
6. Cliquez sur **"RUN"** (bouton vert en bas à droite)

### Étape 3 : Vérifier que ça marche
Vous devriez voir dans les logs (en bas) :
```
✅ Script exécuté avec succès !
```

## 🔍 Ce qui a été corrigé

### Problème 1 : Colonne "read" vs "is_read"
- ❌ Avant : Le trigger utilisait la colonne "read" qui n'existe plus
- ✅ Après : Le trigger utilise maintenant "is_read"

### Problème 2 : Realtime subscription trop restrictive
- ❌ Avant : Le client écoutait seulement SES missions (filter: client_id=eq.xxx)
- ✅ Après : Le client écoute TOUTES les missions pour voir les changements de statut

### Problème 3 : Notification pas créée
- ❌ Avant : Le trigger échouait silencieusement
- ✅ Après : Le trigger crée correctement la notification avec is_read

## 🧪 Comment tester

### Test complet :
1. **Compte client** : Créer une demande d'intervention
2. **Compte artisan** : Accepter la mission
3. **Retour au compte client** : 
   - ✅ Le statut doit passer à "Acceptée"
   - ✅ Une notification doit apparaître
   - ✅ L'app doit automatiquement naviguer vers l'écran de suivi

### Vérifier dans Supabase :
```sql
-- Vérifier les notifications récentes
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

## 🆘 Si ça ne marche toujours pas

### Vérifier que le trigger existe :
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted';
```

### Vérifier que la colonne is_read existe :
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name IN ('is_read', 'read');
```

### Nettoyer le cache de l'app :
1. Fermez complètement l'app
2. Rouvrez-la
3. Reconnectez-vous

## ✅ Résultat attendu

Quand un artisan accepte une mission :

1. **Client voit immédiatement :**
   - Statut "En attente" → "Acceptée"
   - Badge notification (+1)
   - Redirection auto vers écran de suivi

2. **Base de données :**
   - mission.status = 'accepted'
   - mission.artisan_id = [id de l'artisan]
   - mission.accepted_at = [timestamp]
   - notification créée avec type='mission_accepted'

3. **Logs console (client) :**
   ```
   ✅ Mission updated in realtime
   ✅ New notification
   ✅ Missions loaded: X
   ```

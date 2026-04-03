# 🚨 CORRECTION URGENTE - ACCEPTATION MISSION

## ❌ Problème Actuel

Quand un artisan accepte une mission, **le client ne reçoit pas la notification** et la mission reste en attente.

---

## ✅ Solution Rapide (2 minutes)

### Étape 1: Exécuter le script SQL 📊

1. **Ouvrez Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)
2. **Sélectionnez votre projet**
3. **Allez dans "SQL Editor"** (dans le menu de gauche)
4. **Copiez le contenu du fichier** `database/FIX_MISSION_ACCEPTANCE_COMPLETE.sql`
5. **Collez-le dans l'éditeur SQL**
6. **Cliquez sur "Run"** (ou appuyez sur Ctrl+Enter)

### Étape 2: Vérifier l'installation ✅

Le script affichera automatiquement le résultat :

```
════════════════════════════════════════
✅ INSTALLATION RÉUSSIE !

📋 Configuration complète:
   1. ✅ Trigger SQL actif
   2. ✅ Fonction de notification opérationnelle
   3. ✅ Colonne is_read correcte
   4. ✅ Realtime activé pour notifications
   5. ✅ Realtime activé pour missions

🧪 TEST:
   1. Créez une mission en tant que CLIENT
   2. Acceptez-la en tant qu'ARTISAN
   3. Vérifiez que le CLIENT reçoit la notification
════════════════════════════════════════
```

Si vous voyez ce message ✅, la correction est appliquée !

### Étape 3: Tester 🧪

1. **Connectez-vous en tant qu'ARTISAN**
2. **Allez sur le Dashboard Artisan**
3. **Acceptez une mission**
4. **Vérifiez les logs dans la console** (F12) :
   ```
   🎯 Starting mission acceptance: [missionId]
   ✅ Mission accepted successfully: [missionId]
   ```

5. **Connectez-vous en tant que CLIENT** (le compte qui a créé la mission)
6. **Vérifiez que la notification apparaît** (icône cloche en haut à droite)
7. **Vérifiez les logs console côté CLIENT** :
   ```
   🔔 Realtime: New notification received!
   ```

---

## 🔍 Diagnostic (si ça ne marche toujours pas)

### Vérifier que le trigger existe

Dans l'éditeur SQL de Supabase, exécutez :

```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trg_notify_mission_accepted';
```

**Résultat attendu** : 1 ligne avec `trigger_name = trg_notify_mission_accepted`

### Vérifier que les notifications sont créées

```sql
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  created_at
FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Si aucune ligne** : Le trigger ne s'exécute pas correctement

**Si des lignes existent** : Le problème vient du Realtime

### Vérifier le Realtime

```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('notifications', 'missions');
```

**Résultat attendu** : 2 lignes (une pour `notifications`, une pour `missions`)

---

## 🛠️ Que fait le script ?

### 1. Nettoyage 🧹
- Supprime tous les anciens triggers/fonctions qui créaient des doublons
- Évite les conflits entre plusieurs triggers

### 2. Création du Trigger SQL ⚙️
- Crée **UN SEUL** trigger qui écoute les `UPDATE` sur la table `missions`
- Quand `status` passe à `'accepted'`, le trigger :
  - Récupère le nom de l'artisan
  - Crée une notification dans la table `notifications`
  - Le tout avec `SECURITY DEFINER` pour contourner les RLS

### 3. Activation Realtime 📡
- Active Realtime pour la table `notifications`
- Active Realtime pour la table `missions`
- Permet au client de recevoir les mises à jour en temps réel

### 4. Logs détaillés 📝
- Affiche des messages clairs dans les logs Postgres
- Aide au diagnostic en cas de problème

---

## 📋 Flux Corrigé

```
┌─────────────────┐
│ ARTISAN clique  │
│ sur "Accepter"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ acceptMission(missionId, artisanId) │
│ (dans MissionContext.tsx)           │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ supabase.update('missions')          │
│ SET status = 'accepted'              │
│     artisan_id = [artisanId]         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 🔔 TRIGGER SQL activé automatiquement    │
│ notify_client_on_mission_accepted()      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ INSERT INTO notifications                │
│ - user_id = client_id                    │
│ - type = 'mission_accepted'              │
│ - message = "Artisan a accepté..."       │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 📡 Realtime broadcast                    │
│ → CLIENT reçoit la notification          │
└──────────────────────────────────────────┘
```

---

## ✅ Avantages de cette solution

1. **Une seule source de vérité** : Le trigger SQL gère tout
2. **Pas de doublons** : Une seule notification est créée
3. **Contourne les RLS** : `SECURITY DEFINER` permet d'insérer dans notifications
4. **Temps réel** : Realtime activé pour les mises à jour instantanées
5. **Logs détaillés** : Facilite le diagnostic

---

## 🆘 Besoin d'aide ?

Si le problème persiste après avoir suivi ces étapes :

1. **Vérifiez les logs Supabase** :
   - Dashboard Supabase → **Logs** → **Postgres Logs**
   - Cherchez : `Trigger activé: Mission`

2. **Vérifiez les logs console** :
   - Ouvrez la console (F12)
   - Cherchez les messages `🎯`, `✅`, `🔔`

3. **Vérifiez les tables** :
   ```sql
   -- Vérifier les missions
   SELECT id, status, client_id, artisan_id, created_at 
   FROM missions 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- Vérifier les notifications
   SELECT id, user_id, type, title, created_at 
   FROM notifications 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## 📝 Fichiers Corrigés

1. ✅ `database/FIX_MISSION_ACCEPTANCE_COMPLETE.sql` - Script SQL de correction
2. ✅ `contexts/MissionContext.tsx` - Déjà corrigé (pas de doublon)
3. ✅ `app/(artisan)/dashboard.tsx` - Déjà corrigé (async/await)

---

## 🎯 Checklist de Test

- [ ] Le script SQL s'exécute sans erreur
- [ ] Le message "✅ INSTALLATION RÉUSSIE !" apparaît
- [ ] L'artisan peut accepter une mission
- [ ] Le client reçoit la notification (icône cloche)
- [ ] Le statut de la mission change de "pending" à "accepted"
- [ ] Aucun doublon de notification

---

## 🚀 Après la Correction

Une fois que tout fonctionne :

1. **Supprimez les anciens fichiers SQL** de correction (obsolètes)
2. **Testez plusieurs fois** pour confirmer la stabilité
3. **Vérifiez qu'il n'y a qu'UNE SEULE notification** par acceptation

---

**Temps estimé** : 2-3 minutes  
**Difficulté** : Facile (copier-coller)  
**Impact** : Critique (fonctionnalité principale)

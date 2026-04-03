# 🔍 DIAGNOSTIC - Les notifications ne fonctionnent pas

## 📋 Action immédiate

### 1️⃣ Exécutez le diagnostic sur Supabase

Allez dans **Supabase Dashboard** → **SQL Editor** et copiez-collez ce fichier :

```
database/DIAGNOSTIC_ACCEPTATION_MISSION.sql
```

Ce script va vérifier **TOUS** les points critiques :
- ✅ Tables existantes
- ✅ Colonne `is_read`
- ✅ Trigger actif
- ✅ Fonction trigger
- ✅ Policies RLS
- ✅ Configuration Realtime
- ✅ Test manuel d'insertion

### 2️⃣ Lisez les résultats

Le script affichera un résumé final comme :

```
📊 RÉSUMÉ DU DIAGNOSTIC
=================================================
Trigger existe: ✅
Fonction existe: ✅
Colonne is_read: ✅
Realtime config: ✅
=================================================
```

---

## 🔧 Problèmes possibles identifiés

### **Problème A : Le trigger SQL ne fonctionne pas**

**Symptômes :**
- Le statut change dans la table `missions`
- MAIS aucune ligne n'apparaît dans `notifications`

**Solution :**
Exécutez ce script si le trigger est manquant :
```sql
-- Dans database/FIX_NOTIFICATIONS_COMPLET_CORRIGE.sql
```

---

### **Problème B : Le Realtime ne propage pas les changements**

**Symptômes :**
- La notification est créée dans la base
- MAIS le client ne la voit pas en temps réel

**Solution :**
```sql
-- Vérifier la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Redémarrer le Realtime
SELECT pg_notify('realtime:reload', '');
```

---

### **Problème C : Le filtre Realtime côté client est mal configuré**

**Symptômes :**
- Le trigger fonctionne
- Le Realtime est configuré
- MAIS le code ne recharge pas les données

**Solution :**
Le code dans `MissionContext.tsx` ligne 112-116 écoute **TOUS** les changements de missions sans filtre :

```typescript
{
  event: '*',
  schema: 'public',
  table: 'missions',
  // PAS DE FILTRE = écoute TOUS les changements
}
```

**C'est correct ✅**

Mais vérifiez les logs dans la console :
```
🔔 Realtime: Mission changed
✅ Missions loaded: X
```

Si vous ne voyez PAS ces logs quand l'artisan accepte → problème Realtime

---

### **Problème D : Le MissionContext ne se rafraîchit pas**

**Symptômes :**
- Les logs Realtime apparaissent
- MAIS l'UI ne change pas

**Cause probable :**
Le `loadMissions()` fonctionne mais le composant ne réagit pas au changement de `missions`

**Solution :**
Vérifiez que votre composant client utilise bien `useMissions()` :

```typescript
const { missions, refreshMissions } = useMissions();

useEffect(() => {
  console.log('[ClientHome] Missions updated:', missions);
}, [missions]);
```

---

## 🎯 Plan d'action selon les résultats

### Si le diagnostic montre : ❌ Trigger manquant
➡️ Exécutez : `database/FIX_NOTIFICATIONS_COMPLET_CORRIGE.sql`

### Si le diagnostic montre : ❌ Realtime non configuré
➡️ Ajoutez les tables à la publication :
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
```

### Si le diagnostic montre : ✅ Tout est OK côté DB
➡️ Le problème est dans le code frontend

**Vérifiez :**
1. La console affiche bien `🔔 Realtime: Mission changed` ?
2. Le `client_id` de la mission correspond au user connecté ?
3. Le statut passe bien à `'accepted'` dans la base ?

---

## 🧪 Test manuel simple

### Dans Supabase SQL Editor :

```sql
-- 1. Trouver une mission pending
SELECT id, client_id, status FROM missions WHERE status = 'pending' LIMIT 1;

-- 2. Simuler l'acceptation
UPDATE missions 
SET status = 'accepted', 
    artisan_id = (SELECT id FROM users WHERE type = 'artisan' LIMIT 1),
    accepted_at = NOW()
WHERE id = 'COLLER_ID_ICI';

-- 3. Vérifier qu'une notification a été créée
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Si une notification apparaît** → le trigger fonctionne ✅

**Si aucune notification** → le trigger est cassé ❌

---

## 📞 Prochaine étape

Exécutez le diagnostic et envoyez-moi :
1. Le résumé final (✅ ou ❌ pour chaque point)
2. La dernière ligne de la section "7️⃣ NOTIFICATIONS"
3. Ce que vous voyez dans la console de l'app quand l'artisan accepte

Je pourrai alors identifier le problème exact ! 🎯

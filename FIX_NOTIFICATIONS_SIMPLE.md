# 🎯 Solution Simple : Corriger les Notifications (3 étapes)

## ❌ Problème actuel

Quand un artisan accepte une mission :
- ✅ Le statut change en base (missions.status = 'accepted')
- ❌ Le client ne reçoit PAS de notification
- ❌ Erreurs : "Backend désactivé", "push_tokens does not exist"

---

## ✅ Solution en 3 étapes (10 minutes)

### **Étape 1 : Récupérer la clé `service_role` de Supabase**

1. Va sur https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry/settings/api
2. Copie la clé **`service_role key`** (section "Project API keys")
3. Colle-la dans `.env` à la place de `AJOUTE_TA_CLE_SERVICE_ROLE_ICI`

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...COLLE_ICI
```

4. **Redémarre l'app** (Expo reload)

---

### **Étape 2 : Exécuter le script SQL**

1. Ouvre Supabase SQL Editor : https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry/sql/new
2. Copie-colle le contenu du fichier `database/FIX_NOTIFICATIONS_COMPLET.sql`
3. Clique sur **"Run"**
4. Vérifie qu'il n'y a pas d'erreur (tu devrais voir des ✅ dans les logs)

**Ce script :**
- ✅ Crée la table `push_tokens` (manquante)
- ✅ Ajoute la colonne `is_read` dans `notifications`
- ✅ Crée un **trigger SQL** qui insère automatiquement une notification quand `missions.status` devient `'accepted'`

---

### **Étape 3 : Tester**

1. **Artisan** : Accepte une mission depuis l'app
2. **Vérifier en SQL** : Exécute dans Supabase SQL Editor :

```sql
-- 1. Vérifier que la mission est acceptée
SELECT id, status, artisan_id, accepted_at 
FROM missions 
WHERE status = 'accepted' 
ORDER BY accepted_at DESC 
LIMIT 1;

-- 2. Vérifier qu'une notification a été créée
SELECT * 
FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 1;
```

3. **Client** : Ouvre l'app → la notification devrait apparaître ✅

---

## 🔍 Diagnostic rapide

### ✅ Le backend fonctionne ?

Dans les logs Expo, tu devrais voir :
```
[BACKEND] SUPABASE_SERVICE_ROLE_KEY: ✅ Set
```

Si tu vois `❌ Missing`, retourne à l'**Étape 1**.

---

### ✅ Le trigger fonctionne ?

Exécute ce SQL après qu'un artisan ait accepté :

```sql
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 1;
```

- **Si aucune ligne** → Le trigger n'a pas fonctionné
  - Vérifie que le script SQL de l'Étape 2 s'est bien exécuté
  - Vérifie les logs du trigger (RAISE NOTICE dans le SQL editor)

- **Si une ligne existe** → Le trigger fonctionne ! ✅
  - Le problème est peut-être côté envoi push ou côté client qui ne récupère pas les notifications

---

### ✅ Le client reçoit les notifications ?

Le contexte `MissionContext.tsx` écoute déjà les changements :

```typescript
// Ligne 147-159 : Realtime subscription
.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`,
  },
  () => {
    console.log('✅ New notification');
    loadNotifications();
  }
)
```

Si le client ne reçoit pas :
1. Vérifie que l'app client est bien ouverte
2. Vérifie les logs : tu devrais voir `"✅ New notification"`
3. Vérifie que `user.id` correspond bien au `client_id` de la mission

---

## 📊 Pourquoi cette solution est meilleure que le document proposé ?

| Critère | Document proposé | Cette solution |
|---------|------------------|----------------|
| **Complexité** | ❌ Route tRPC + Trigger SQL + Push manual | ✅ **Trigger SQL uniquement** |
| **Configuration requise** | ❌ Créer nouvelle route, modifier routing | ✅ **Juste 1 script SQL** |
| **Fiabilité** | ⚠️ Dépend du backend fonctionnel | ✅ **Fonctionne même si backend offline** |
| **Maintenance** | ❌ 3 fichiers à maintenir | ✅ **1 seul fichier SQL** |
| **Votre cas** | ❌ Backend pas configuré | ✅ **Compatible immédiatement** |

---

## 🚀 Après correction

Une fois que ça fonctionne :

### Option A : Garder le trigger SQL (Recommandé ✅)
- Simple, fiable, pas besoin de toucher au code
- Le frontend appelle juste `supabase.from('missions').update(...)` comme actuellement

### Option B : Ajouter route backend (si tu veux vraiment)
- Crée `backend/trpc/routes/missions/accept/route.ts`
- Mais **SEULEMENT après** que l'Étape 1 soit faite (SUPABASE_SERVICE_ROLE_KEY)

---

## 📞 Besoin d'aide ?

1. ❌ **"SUPABASE_SERVICE_ROLE_KEY: ❌ Missing"**
   → Tu n'as pas suivi l'Étape 1 ou tu n'as pas redémarré l'app

2. ❌ **"push_tokens does not exist"**
   → Tu n'as pas exécuté le script SQL de l'Étape 2

3. ❌ **Le trigger ne crée pas de notification**
   → Vérifie avec :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted';
   ```

4. ✅ **Tout fonctionne mais pas de push notification**
   → C'est normal ! Les push notifications nécessitent un service d'envoi (expo-notifications)
   → Pour l'instant, les notifications **en base et in-app** fonctionnent déjà ✅

---

## 🎯 Checklist de succès

- [ ] `SUPABASE_SERVICE_ROLE_KEY` ajoutée dans `.env`
- [ ] App redémarrée (voir `[BACKEND] SUPABASE_SERVICE_ROLE_KEY: ✅ Set`)
- [ ] Script SQL exécuté dans Supabase (voir les ✅ dans les logs)
- [ ] Table `push_tokens` créée (vérifie dans Supabase Table Editor)
- [ ] Trigger `trg_notify_mission_accepted` existe
- [ ] Test : artisan accepte → notification créée en base
- [ ] Client voit la notification dans l'app

---

**Commence par l'Étape 1 maintenant !** 🚀

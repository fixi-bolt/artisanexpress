# 🧪 TEST SIMPLE - NOTIFICATIONS CLIENT

## Après avoir exécuté le script SQL

### 📱 Test en 4 étapes

#### 1️⃣ Préparer 2 appareils (ou 2 onglets web)
- **Appareil A** : Client (celui qui crée la mission)
- **Appareil B** : Artisan (celui qui accepte)

#### 2️⃣ Sur l'appareil A (Client)
1. Ouvrez l'app et connectez-vous en tant que **client**
2. Créez une nouvelle mission (n'importe quelle catégorie)
3. **Restez sur l'app** - ne quittez pas l'écran
4. Ouvrez la console de votre navigateur (F12) si vous testez sur web

#### 3️⃣ Sur l'appareil B (Artisan)
1. Ouvrez l'app et connectez-vous en tant qu'**artisan** 
2. Allez sur le dashboard
3. Vous devriez voir la mission créée par le client
4. Cliquez sur **"Accepter"**
5. Confirmez l'acceptation

#### 4️⃣ Retour sur l'appareil A (Client)
**Ce que vous devriez voir instantanément** :
- 🔔 Badge de notification sur l'icône cloche dans le header
- Le statut de la mission change de "En attente" à "Acceptée"
- L'app redirige automatiquement vers l'écran de suivi

---

## 🔍 Vérifier dans la console (si test sur web)

Vous devriez voir ces logs :
```
🔔 Realtime: New notification
✅ Missions loaded: X
```

---

## ✅ Résultat attendu

### Sur l'écran client
```
┌─────────────────────────────┐
│  🔔 (1)                     │  ← Badge de notification
│  Bonjour, [Nom]             │
├─────────────────────────────┤
│  Mission acceptée !         │  ← Notification
│  Un artisan arrive dans     │
│  15 min                     │
└─────────────────────────────┘
```

---

## ❌ Si ça ne marche pas

### Vérifiez dans Supabase :

1. **SQL Editor** → Exécutez :
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

Vous devriez voir une notification avec :
- `type` = `'mission_accepted'`
- `title` = `'Mission acceptée !'`
- `is_read` = `false`

2. Si la notification existe dans la DB mais ne s'affiche pas dans l'app :
   - Le problème est avec Realtime
   - Exécutez aussi `database/FIX_REALTIME_FINAL_CORRECT.sql`
   - Redémarrez votre app

3. Si la notification n'existe PAS dans la DB :
   - Le trigger ne s'est pas déclenché
   - Vérifiez que le script `database/FIX_NOTIFICATIONS_CLIENT_FINAL.sql` a bien été exécuté
   - Regardez les résultats du script, il doit afficher "✅ Trigger trouvé"

---

## 🎯 Diagnostic rapide

Exécutez ce script dans Supabase pour tout vérifier :

```sql
-- Vérifier le trigger
SELECT 
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_client_on_acceptance';

-- Vérifier Realtime
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('notifications', 'missions');

-- Doit retourner 2 lignes (notifications et missions)
```

Si ces 2 requêtes retournent des résultats, la configuration est correcte ! 🎉

# 🚀 Action Immédiate - Fix Notifications Push

## ⚡ À faire MAINTENANT (3 étapes - 2 minutes)

### 1️⃣ Copier-coller dans Supabase (30 secondes)

1. Ouvrir Supabase : https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Ouvrir le fichier `COPIER_COLLER_SUPABASE_PUSH.sql`
5. Copier tout le contenu
6. Coller dans l'éditeur SQL
7. Cliquer sur **Run** (ou Ctrl+Enter)

✅ Vous devriez voir : "Success. No rows returned"

### 2️⃣ Redémarrer le backend (30 secondes)

Le backend a déjà été modifié avec les corrections. Il suffit de le redémarrer :

```bash
# Si votre backend est local
# Arrêter et relancer votre serveur de développement

# Si vous utilisez Rork hosting, le backend se redémarrera automatiquement
```

### 3️⃣ Tester (1 minute)

**Test rapide :**

1. **Client** : Ouvrir l'app, se connecter
   - Regarder les logs : `[Notifications] Expo push token: ExponentPushToken[...]`
   - Regarder les logs : `[Notifications] Token registered for user: ...`

2. **Artisan** : Se connecter, accepter une mission
   - Regarder les logs backend : `[Notifications] Push sent successfully: ...`

3. **Client** : Recevoir la notification push 🎉

## 🔍 Vérification rapide

### Dans Supabase SQL Editor :

```sql
-- Voir les tokens enregistrés
SELECT user_id, platform, created_at 
FROM public.push_tokens 
ORDER BY created_at DESC;
```

### Dans les logs de l'app :

Chercher ces messages :
```
✅ [Notifications] Expo push token: ExponentPushToken[xxx]
✅ [Notifications] Token registered for user: xxx
✅ [Notifications] Sending notification: ...
✅ [Notifications] Push sent successfully: ...
```

## ❌ Si ça ne marche pas

### Erreur : "table push_tokens does not exist"
→ Le script SQL n'a pas été exécuté. Retour à l'étape 1.

### Erreur : "No valid push token for user"
→ Le client n'a pas enregistré son token. Vérifier :
- Le client s'est bien connecté ?
- Les permissions de notification sont accordées ?
- Logs : `[Notifications] Expo push token: ...` ?

### Erreur : "Backend unavailable (Status 404)"
→ Le backend n'est pas accessible. Vérifier :
- `EXPO_PUBLIC_RORK_API_BASE_URL` dans `.env`
- Le backend est bien démarré
- L'URL est correcte (pas de localhost sur mobile physique)

### Le client ne reçoit rien
→ Vérifier dans l'ordre :
1. Token enregistré ? `SELECT * FROM push_tokens WHERE user_id = '<CLIENT_ID>';`
2. Notification créée ? `SELECT * FROM notifications WHERE mission_id = '<MISSION_ID>';`
3. Logs backend : `[Notifications] Push sent successfully: ...` ?
4. Permissions notification accordées sur l'appareil ?

## 📞 Besoin d'aide ?

Si après ces 3 étapes ça ne fonctionne toujours pas, fournir :

1. Les logs de l'app (côté client ET artisan)
2. Les logs du backend
3. Résultat de :
```sql
SELECT * FROM push_tokens;
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
SELECT * FROM missions WHERE status = 'accepted' ORDER BY accepted_at DESC LIMIT 5;
```

## ✅ Succès ?

Si tout fonctionne, vous verrez :
- 🟢 Token enregistré dans Supabase
- 🟢 Notification créée dans la table notifications
- 🟢 Logs backend : "Push sent successfully"
- 🟢 Client reçoit la notification push sur son appareil

🎉 **Félicitations ! Les notifications push fonctionnent maintenant.**

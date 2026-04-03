# 🔔 Fix des notifications push - Guide complet

## ✅ Problème identifié

Le client ne recevait pas de notifications push quand l'artisan acceptait une mission car :
1. Le backend ne faisait qu'un `console.log` sans envoyer de vraies notifications push
2. Les tokens push étaient stockés en mémoire (perdus au redémarrage)
3. Pas d'intégration avec Expo Push Notification Service

## 🔧 Corrections appliquées

### 1. Installation du SDK Expo Server
```bash
bun add expo-server-sdk
```
✅ **Déjà fait**

### 2. Création de la table `push_tokens` dans Supabase

**📋 Script à copier-coller dans l'éditeur SQL de Supabase :**

```sql
-- Table pour stocker les push tokens des utilisateurs
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- RLS policies
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Permettre aux utilisateurs de lire leurs propres tokens
CREATE POLICY "Users can view own push tokens" ON public.push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permettre aux utilisateurs d'insérer leurs propres tokens
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de mettre à jour leurs propres tokens
CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de supprimer leurs propres tokens
CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Permettre au service_role de lire tous les tokens (pour envoyer les notifications)
CREATE POLICY "Service role can read all tokens" ON public.push_tokens
  FOR SELECT
  TO service_role
  USING (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_tokens_updated_at();

COMMENT ON TABLE public.push_tokens IS 'Stocke les tokens de notifications push des utilisateurs pour Expo/FCM';
```

### 3. Modifications backend

#### ✅ `backend/trpc/routes/notifications/register-token/route.ts`
- Enregistrement des tokens dans Supabase au lieu de la mémoire
- Récupération des tokens depuis Supabase
- Support multi-plateforme (ios, android, web)

#### ✅ `backend/trpc/routes/notifications/send-notification/route.ts`
- Intégration d'Expo Server SDK
- Envoi réel de notifications push via Expo Push Notification Service
- Gestion des erreurs et logging détaillé

#### ✅ `contexts/NotificationContext.tsx`
- Enregistrement de la plateforme avec le token

## 📝 Comment ça marche maintenant

### Flux d'enregistrement du token (au login)
```
Client se connecte
  ↓
NotificationContext demande permission
  ↓
Récupère Expo Push Token
  ↓
Appelle registerPushToken(userId, token, platform)
  ↓
Token sauvegardé dans Supabase
```

### Flux d'envoi de notification (quand artisan accepte mission)
```
Artisan accepte mission
  ↓
MissionContext.acceptMission()
  ↓
1. Met à jour status dans Supabase
  ↓
2. Insère notification dans table notifications
  ↓
3. Appelle sendNotification(clientId, ...)
  ↓
4. Backend récupère le push token du client
  ↓
5. Backend envoie via Expo Push Service
  ↓
Client reçoit notification push
```

## 🧪 Test du système

### 1. Vérifier l'enregistrement du token

**En tant que client :**
```
1. Ouvrir l'app
2. Se connecter
3. Accepter les permissions de notification
4. Regarder les logs : "[Notifications] Token registered for user: xxx"
```

**Vérifier dans Supabase :**
```sql
SELECT * FROM public.push_tokens ORDER BY created_at DESC LIMIT 10;
```

Vous devriez voir les tokens enregistrés avec `user_id`, `token`, et `platform`.

### 2. Tester l'envoi de notification

**Scénario complet :**
```
1. Client crée une mission
2. Artisan voit la mission et l'accepte
3. Vérifier logs backend : 
   - "[Notifications] Sending notification: ..."
   - "[Notifications] Push sent successfully: ..."
4. Client reçoit notification push
5. Vérifier dans Supabase :
```

```sql
-- Voir les notifications créées
SELECT * FROM public.notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;

-- Voir les missions acceptées
SELECT id, status, client_id, artisan_id, accepted_at 
FROM public.missions 
WHERE status = 'accepted' 
ORDER BY accepted_at DESC 
LIMIT 5;
```

## 🐛 Debugging

### Si le client ne reçoit pas de notification :

**1. Vérifier que le token est enregistré :**
```sql
SELECT * FROM public.push_tokens WHERE user_id = '<CLIENT_ID>';
```

**2. Vérifier les logs backend :**
```
[Notifications] Sending notification: ...
[Notifications] Push sent successfully: ...
```

**3. Si "No valid push token for user" :**
- Le client n'a pas de token enregistré
- Vérifier que `registerPushToken()` est appelé au login
- Vérifier les permissions de notification sur l'appareil

**4. Si erreur Expo Push :**
```
[Notifications] Error sending push chunk: ...
```
- Vérifier que le token est valide (format `ExponentPushToken[...]`)
- Vérifier la configuration Expo
- Tester avec l'outil Expo Push Notification Tool

### Tester l'envoi manuel

**Via Supabase SQL Editor :**
```sql
-- Créer une notification test dans la BDD
INSERT INTO public.notifications (user_id, type, title, message, mission_id)
VALUES (
  '<CLIENT_ID>',
  'mission_accepted',
  'Test Notification',
  'Ceci est un test',
  '<MISSION_ID>'
);
```

Puis appeler manuellement via tRPC :
```typescript
await trpc.notifications.sendNotification.mutate({
  userId: '<CLIENT_ID>',
  title: 'Test',
  message: 'Test notification',
  type: 'mission_accepted'
});
```

## ✅ Checklist finale

- [ ] Script SQL exécuté dans Supabase
- [ ] Table `push_tokens` créée avec succès
- [ ] Package `expo-server-sdk` installé
- [ ] Backend redémarré
- [ ] Client se connecte et enregistre son token
- [ ] Token visible dans Supabase
- [ ] Test d'acceptation de mission
- [ ] Client reçoit notification push
- [ ] Notification visible dans table `notifications`

## 📚 Ressources

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Prochaines étapes (optionnelles)

1. **Gestion des erreurs push :**
   - Stocker les tickets de notification
   - Vérifier les receipts pour erreurs
   - Supprimer tokens invalides

2. **Notifications groupées :**
   - Éviter spam si plusieurs artisans acceptent
   - Notification silencieuse pour mises à jour

3. **Rich notifications :**
   - Images dans notifications
   - Actions rapides (Accepter/Refuser)
   - Deep linking vers mission

4. **Analytics :**
   - Taux d'ouverture des notifications
   - Taux de conversion (notification → action)

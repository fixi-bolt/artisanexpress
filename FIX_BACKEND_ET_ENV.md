# 🔧 CORRECTION BACKEND ET VARIABLES D'ENVIRONNEMENT

## ❌ Problèmes Identifiés

1. **`Backend désactivé - Mode Supabase uniquement`**
   - Le fichier `.env` ne contient pas `SUPABASE_SERVICE_ROLE_KEY`
   - Le backend tRPC ne peut pas fonctionner sans cette clé

2. **Routes 404 Not Found**
   - `notifications.sendNotification` → 404
   - `location.updateLocation` → 404
   - Ces routes sont définies mais le backend n'est pas configuré

3. **`push_tokens` table missing**
   - Table manquante dans Supabase (résolue par le script SQL)

---

## ✅ SOLUTION 1 : Ajouter SUPABASE_SERVICE_ROLE_KEY

### Étape 1 : Récupérer la clé Service Role

1. Va sur **Supabase Dashboard** : https://app.supabase.com
2. Sélectionne ton projet `nkxucjhavjfsogzpitry`
3. Va dans **Settings** (en bas à gauche) → **API**
4. Copie la clé **`service_role`** (⚠️ PAS la clé `anon` !)

### Étape 2 : Ajouter dans .env

Ouvre ton fichier `.env` et ajoute cette ligne :

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**TON .env DOIT RESSEMBLER À ÇA :**

```env
# Stripe
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51Rzz6bEEWX9P4nBgi8oFlVv3qAyq04gOlsDYLZ3Ldc9L0pZBMr78TgXbHIrCCtsA9EwF3xhRbXgvRgD9wG5evqG9002e5sMCVj
STRIPE_SECRET_KEY=sk_test_51Rzz6bEEWX9P4nBgiKLlgAR8oJF5kxdEjY1rKN9EzELdj8OhqP2hGVEj2u4NhCxdtTvp8iLzPvIGFgYlM1SdhQ7m00z6x2pGjR
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret

# Rork
EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-vkzouaiv8hu7jb9nja678.rorktest.dev
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://nkxucjhavjfsogzpitry.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...AJOUTE_LA_CLÉ_ICI

# Monetization
COMMISSION_PERCENTAGE=0.15
```

---

## ✅ SOLUTION 2 : Appliquer le script SQL Supabase

### Étape 1 : Copier le script

Ouvre le fichier **`SCRIPT_SUPABASE_COMPLET_FINAL.sql`** (que je viens de créer)

### Étape 2 : L'exécuter dans Supabase

1. Va sur https://app.supabase.com
2. Sélectionne ton projet
3. Va dans **SQL Editor** (dans le menu de gauche)
4. Clique sur **New Query**
5. Colle tout le contenu de `SCRIPT_SUPABASE_COMPLET_FINAL.sql`
6. Clique sur **RUN** (en bas à droite)

### Étape 3 : Vérifier que ça a marché

Tu devrais voir ces messages :

```
✅ Table push_tokens créée
✅ Trigger notify_client_on_mission_accepted créé
✅ Fonction notify_client_on_mission_accepted créée
✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS
```

---

## ✅ SOLUTION 3 : Redémarrer le serveur

Après avoir ajouté `SUPABASE_SERVICE_ROLE_KEY` dans `.env`, tu DOIS redémarrer :

```bash
# Stoppe le serveur (Ctrl+C)
# Puis redémarre
bun run start
```

---

## 🧪 TEST : Vérifier que tout fonctionne

### Test 1 : Le backend est actif

Ouvre ton navigateur et va sur :
```
https://dev-vkzouaiv8hu7jb9nja678.rorktest.dev/api/trpc
```

Tu devrais voir une réponse JSON (pas un 404).

### Test 2 : Push tokens table existe

Dans Supabase SQL Editor :

```sql
SELECT * FROM public.push_tokens LIMIT 10;
```

Si ça marche (même si vide), c'est bon ! ✅

### Test 3 : Le trigger fonctionne

1. Va dans l'app
2. Connecte-toi en tant qu'artisan
3. Accepte une mission
4. Vérifie dans Supabase :

```sql
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

Tu devrais voir une nouvelle notification ! ✅

---

## 📝 Checklist complète

- [ ] Récupérer `SUPABASE_SERVICE_ROLE_KEY` dans Supabase Dashboard
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
- [ ] Exécuter `SCRIPT_SUPABASE_COMPLET_FINAL.sql` dans Supabase SQL Editor
- [ ] Redémarrer le serveur (`Ctrl+C` puis `bun run start`)
- [ ] Tester : Accepter une mission
- [ ] Vérifier : `SELECT * FROM notifications WHERE type = 'mission_accepted';`

---

## ⚠️ SI ÇA NE MARCHE TOUJOURS PAS

### Erreur : "Backend désactivé"

→ Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est dans `.env` ET que tu as redémarré

### Erreur : "push_tokens does not exist"

→ Le script SQL n'a pas été exécuté. Retourne dans Supabase SQL Editor et exécute-le

### Erreur : "404 Not Found"

→ Le backend n'est pas déployé correctement. Vérifie que le fichier `backend/hono.ts` contient bien :

```typescript
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);
```

---

## 🎯 Résumé ultra-rapide

1. **Ajoute** `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
2. **Exécute** `SCRIPT_SUPABASE_COMPLET_FINAL.sql` dans Supabase
3. **Redémarre** le serveur
4. **Teste** en acceptant une mission

C'est tout ! 🚀

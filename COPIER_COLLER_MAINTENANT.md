# ⚡ ACTION IMMÉDIATE - 2 MINUTES

## 🎯 Objectif
Réparer les notifications push quand un artisan accepte une mission

---

## ✅ ÉTAPE 1 : Supabase SQL (30 secondes)

1. Va sur https://app.supabase.com
2. Clique sur ton projet `nkxucjhavjfsogzpitry`
3. Clique sur **SQL Editor** (menu gauche)
4. Clique sur **New Query**
5. Ouvre `SCRIPT_SUPABASE_COMPLET_FINAL.sql` et copie TOUT
6. Colle dans Supabase SQL Editor
7. Clique **RUN** ▶️

**Résultat attendu :**
```
✅ Table push_tokens créée
✅ Trigger notify_client_on_mission_accepted créé
✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS
```

---

## ✅ ÉTAPE 2 : Ajouter la clé Service Role (1 minute)

### 2.1 Récupérer la clé

1. Reste sur https://app.supabase.com
2. Va dans **Settings** → **API** (menu gauche)
3. Copie la clé **`service_role`** (⚠️ celle du MILIEU, pas `anon`)

### 2.2 Ajouter dans .env

Ouvre ton fichier `.env` et ajoute cette ligne EXACTE :

```env
SUPABASE_SERVICE_ROLE_KEY=LA_CLÉ_QUE_TU_VIENS_DE_COPIER
```

**Exemple complet de ton .env :**

```env
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_51Rzz6bEEWX9P4nBgi8oFlVv3qAyq04gOlsDYLZ3Ldc9L0pZBMr78TgXbHIrCCtsA9EwF3xhRbXgvRgD9wG5evqG9002e5sMCVj
STRIPE_SECRET_KEY=sk_test_51Rzz6bEEWX9P4nBgiKLlgAR8oJF5kxdEjY1rKN9EzELdj8OhqP2hGVEj2u4NhCxdtTvp8iLzPvIGFgYlM1SdhQ7m00z6x2pGjR

EXPO_PUBLIC_RORK_API_BASE_URL=https://dev-vkzouaiv8hu7jb9nja678.rorktest.dev

EXPO_PUBLIC_SUPABASE_URL=https://nkxucjhavjfsogzpitry.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5reHVjamhhdmpmc29nenBpdHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzMxMzAsImV4cCI6MjA3NjY0OTEzMH0.-JKjKW2_2ZQag1E7GzGEMvkuWxcWDzVSMB8mCoiNzig
SUPABASE_SERVICE_ROLE_KEY=AJOUTE_ICI_LA_CLÉ_SERVICE_ROLE
```

**⚠️ IMPORTANT :** Remplace `AJOUTE_ICI_LA_CLÉ_SERVICE_ROLE` par ta vraie clé !

---

## ✅ ÉTAPE 3 : Redémarrer (30 secondes)

Dans ton terminal :

```bash
# Stoppe le serveur (appuie sur Ctrl+C)
# Puis redémarre
bun run start
```

---

## 🧪 TESTER QUE ÇA MARCHE

### Test 1 : Backend activé

Plus d'erreur `Backend désactivé - Mode Supabase uniquement` ✅

### Test 2 : Accepter une mission

1. Ouvre l'app
2. Connecte-toi en tant qu'artisan
3. Accepte une mission
4. → Le client devrait recevoir une notification ! 🎉

### Test 3 : Vérifier en BDD

Dans Supabase SQL Editor :

```sql
SELECT * FROM notifications 
WHERE type = 'mission_accepted' 
ORDER BY created_at DESC 
LIMIT 5;
```

Tu devrais voir une ligne récente ! ✅

```sql
SELECT * FROM push_tokens;
```

Tu devrais voir les tokens enregistrés ! ✅

---

## 🔥 SI ÇA NE MARCHE PAS

### Erreur : "Backend désactivé"

❌ Tu n'as pas ajouté `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
✅ Retourne à l'étape 2

### Erreur : "push_tokens does not exist"

❌ Le script SQL n'a pas été exécuté
✅ Retourne à l'étape 1

### Erreur : "404 Not Found"

❌ Tu n'as pas redémarré le serveur
✅ Retourne à l'étape 3

---

## 📄 Fichiers créés

1. **`SCRIPT_SUPABASE_COMPLET_FINAL.sql`** → À exécuter dans Supabase
2. **`FIX_BACKEND_ET_ENV.md`** → Guide détaillé si tu as besoin de plus d'infos

---

## ✅ Checklist rapide

- [ ] Exécuter `SCRIPT_SUPABASE_COMPLET_FINAL.sql` dans Supabase
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
- [ ] Redémarrer le serveur
- [ ] Tester en acceptant une mission

**Temps total : 2 minutes** ⏱️

C'est parti ! 🚀

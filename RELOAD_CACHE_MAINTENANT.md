# 🔄 FIX IMMÉDIAT - Recharger le Cache Supabase

## ❌ Problème
```
Could not find the 'photo' column of 'users' in the schema cache
```

Le cache du schéma Supabase n'est pas synchronisé avec votre structure de base de données actuelle.

## ✅ Solution en 3 étapes

### Étape 1: Ouvrir Supabase Dashboard
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet **nkxucjhavjfsogzpitry**
3. Cliquez sur **SQL Editor** dans le menu à gauche

### Étape 2: Recharger le Cache
Copiez-collez cette commande dans le SQL Editor et exécutez:

```sql
NOTIFY pgrst, 'reload schema';
```

OU utilisez cette alternative:

```sql
SELECT pg_notify('pgrst', 'reload schema');
```

### Étape 3: Vérifier
Exécutez cette requête pour confirmer que les colonnes existent:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

Vous devriez voir:
- ✅ id
- ✅ email
- ✅ name
- ✅ phone
- ✅ photo
- ✅ user_type
- ✅ rating
- ✅ review_count
- ✅ created_at
- ✅ updated_at

## 🔄 Alternative: Redémarrer PostgREST

Si le rechargement du cache ne fonctionne pas, vous pouvez redémarrer le serveur PostgREST:

1. Dans le Dashboard Supabase
2. Allez dans **Settings** → **API**
3. Cliquez sur **Restart PostgREST Server** (si disponible)

OU attendez **quelques minutes** - Supabase recharge automatiquement le cache toutes les quelques minutes.

## 📝 Pourquoi ce problème?

Supabase utilise PostgREST qui met en cache le schéma de la base de données pour des raisons de performance. Quand vous modifiez le schéma (ajout/suppression de colonnes), le cache n'est pas toujours mis à jour immédiatement.

## 🔥 Test après le fix

Une fois le cache rechargé, testez l'inscription dans votre app:
1. Redémarrez l'app: `npx expo start --clear`
2. Essayez de créer un nouveau compte
3. Les erreurs de "column not found" devraient disparaître

---

**Note:** Cette commande ne modifie rien dans votre base de données, elle force juste PostgREST à relire la structure actuelle des tables.

# 🔧 CORRECTION IMMÉDIATE - Profil utilisateur manquant

## 🎯 Faire maintenant (2 minutes)

### 1️⃣ Ouvrir Supabase

Allez sur: **https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry**

### 2️⃣ Ouvrir le SQL Editor

- Dans le menu de gauche, cliquez sur **"SQL Editor"**
- Cliquez sur **"New query"**

### 3️⃣ Copier-coller ce code SQL

```sql
-- Créer le trigger de synchronisation automatique
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corriger les utilisateurs existants
INSERT INTO public.users (id, email, name, user_type, rating, review_count)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'client',
  0.00,
  0
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Créer les profils clients manquants
INSERT INTO public.clients (id)
SELECT u.id
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
WHERE u.user_type = 'client' AND c.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Ajouter les politiques d'insertion
DROP POLICY IF EXISTS users_auto_insert ON users;
CREATE POLICY users_auto_insert ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS clients_auto_insert ON clients;
CREATE POLICY clients_auto_insert ON clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Vérifier le résultat
SELECT 'Utilisateurs auth' as type, COUNT(*) FROM auth.users
UNION ALL
SELECT 'Profils users' as type, COUNT(*) FROM public.users
UNION ALL
SELECT 'Profils manquants' as type, COUNT(*) 
FROM auth.users au 
LEFT JOIN public.users u ON au.id = u.id 
WHERE u.id IS NULL;
```

### 4️⃣ Exécuter

Cliquez sur **"Run"** ou appuyez sur **Ctrl + Enter**

### 5️⃣ Vérifier le résultat

Vous devriez voir:
```
type                 | count
---------------------|-------
Utilisateurs auth    | 1
Profils users        | 1
Profils manquants    | 0
```

✅ Si "Profils manquants" = 0, c'est bon !

### 6️⃣ Tester l'app

1. Fermez complètement l'application
2. Relancez l'application
3. Connectez-vous

## 🎯 Résultat attendu

Vous devriez maintenant pouvoir vous connecter sans erreur !

## ⚠️ Si ça ne marche pas

Envoyez-moi une capture d'écran des résultats du SQL Editor.

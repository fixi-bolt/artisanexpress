-- ========================================
-- 🔧 FIX: Synchroniser les profils auth avec la table users
-- ========================================

-- 1. Créer une fonction trigger qui synchronise automatiquement
-- chaque nouvel utilisateur auth avec la table users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer un profil utilisateur par défaut
  -- Le type sera mis à jour par l'application après l'inscription
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

-- 2. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Corriger les utilisateurs existants qui n'ont pas de profil
INSERT INTO public.users (id, email, name, user_type, rating, review_count)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'client') as user_type,
  0.00 as rating,
  0 as review_count
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Créer une entrée client pour tous les users qui n'en ont pas
INSERT INTO public.clients (id)
SELECT u.id
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
WHERE u.user_type = 'client' AND c.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Ajouter une politique pour permettre l'insertion automatique
DROP POLICY IF EXISTS users_auto_insert ON users;
CREATE POLICY users_auto_insert ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS clients_auto_insert ON clients;
CREATE POLICY clients_auto_insert ON clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS artisans_auto_insert ON artisans;
CREATE POLICY artisans_auto_insert ON artisans 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS admins_auto_insert ON admins;
CREATE POLICY admins_auto_insert ON admins 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
  );

-- 7. Vérification
SELECT 
  'Auth users count:' as info,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Public users count:' as info,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Missing profiles:' as info,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

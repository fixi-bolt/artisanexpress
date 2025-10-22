-- ========================================
-- 🔧 FIX AUTOMATIC USER CREATION TRIGGER (version stable)
-- ========================================
-- Ce script crée (ou répare) le trigger qui insère
-- automatiquement un enregistrement dans public.users
-- à chaque nouveau signup (auth.users)
-- ========================================

-- 1️⃣ Créer la fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Éviter les doublons : si déjà présent, on ne refait rien
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Insérer dans la table public.users
  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING; -- sécurité supplémentaire

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth; -- évite les problèmes de contexte

-- 2️⃣ Supprimer l'ancien trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3️⃣ Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- ✅ Vérification
-- ========================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name = 'on_auth_user_created';

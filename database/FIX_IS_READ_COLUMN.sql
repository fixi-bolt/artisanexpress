-- ========================================
-- FIX: Colonne is_read manquante
-- ========================================
-- La colonne s'appelle "read" dans la base mais le code utilise "is_read"
-- On va créer un alias ou renommer la colonne

-- Solution simple: Renommer la colonne de "read" vers "is_read"
-- Cela permet de garder la même logique partout

-- 1. Désactiver temporairement RLS
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 2. Vérifier si la colonne "read" existe et "is_read" n'existe pas
DO $$
BEGIN
  -- Si la colonne "read" existe et "is_read" n'existe pas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    -- Renommer la colonne
    ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
    RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    RAISE NOTICE '✅ Colonne "is_read" existe déjà';
  ELSE
    RAISE NOTICE '⚠️ Colonne "read" n''existe pas, création de "is_read"';
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- 3. Mettre à jour l'index si nécessaire
DROP INDEX IF EXISTS public.idx_notifications_user_unread;
DROP INDEX IF EXISTS public.idx_notifications_user;

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- 4. Réactiver RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Vérification
DO $$
DECLARE
  v_column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CORRECTION TERMINÉE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Colonne "is_read" disponible dans notifications';
  ELSE
    RAISE EXCEPTION '❌ La colonne is_read n''a pas pu être créée';
  END IF;
END $$;

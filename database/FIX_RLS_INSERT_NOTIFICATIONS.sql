-- ============================================
-- FIX RLS POLICIES FOR NOTIFICATIONS INSERT
-- ============================================
-- Résout: new row violates row-level security policy for table "notifications"

-- 1. Supprimer toutes les politiques existantes en double
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

-- 2. Créer les politiques correctes

-- SELECT: Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can read own notifications" 
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Permettre à TOUS les utilisateurs authentifiés d'insérer des notifications
-- (car les triggers/fonctions s'exécutent avec les droits de l'utilisateur connecté)
CREATE POLICY "Allow authenticated users to insert notifications" 
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications" 
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Vérifier que les triggers sont avec SECURITY DEFINER
-- (pour qu'ils s'exécutent avec les privilèges du créateur)

-- Recréer la fonction notify_mission_accepted avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_mission_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Important!
SET search_path = public
AS $$
BEGIN
  -- Créer une notification pour le client
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    mission_id,
    is_read
  ) VALUES (
    NEW.client_id,
    'Mission acceptée',
    'Un artisan a accepté votre demande d''intervention',
    'mission_accepted',
    NEW.id,
    false
  );
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Logger l'erreur mais ne pas bloquer la transaction
  RAISE WARNING 'Erreur lors de la création de la notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_notify_mission_accepted ON public.missions;
CREATE TRIGGER trigger_notify_mission_accepted
  AFTER UPDATE OF status ON public.missions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_mission_accepted();

-- 4. Recréer la fonction notify_nearby_artisans avec SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- Important!
SET search_path = public
AS $$
DECLARE
  artisan RECORD;
  distance_km NUMERIC;
BEGIN
  -- Notifier les artisans à proximité
  FOR artisan IN
    SELECT 
      u.id,
      u.first_name,
      ap.latitude,
      ap.longitude,
      ap.intervention_radius
    FROM users u
    JOIN artisan_profiles ap ON u.id = ap.user_id
    WHERE u.user_type = 'artisan'
      AND ap.latitude IS NOT NULL
      AND ap.longitude IS NOT NULL
      AND ap.intervention_radius IS NOT NULL
      AND ap.is_available = true
      AND NEW.latitude IS NOT NULL
      AND NEW.longitude IS NOT NULL
  LOOP
    -- Calculer la distance
    distance_km := public.calculate_distance(
      NEW.latitude,
      NEW.longitude,
      artisan.latitude,
      artisan.longitude
    );
    
    -- Si l'artisan est dans le rayon, créer une notification
    IF distance_km <= artisan.intervention_radius THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        mission_id,
        is_read
      ) VALUES (
        artisan.id,
        'Nouvelle mission à proximité',
        'Une nouvelle mission est disponible à ' || ROUND(distance_km::numeric, 1) || ' km de vous',
        'new_mission',
        NEW.id,
        false
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Erreur lors de la notification des artisans: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON public.missions;
CREATE TRIGGER trigger_notify_nearby_artisans
  AFTER INSERT ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nearby_artisans();

-- 5. Vérification finale
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

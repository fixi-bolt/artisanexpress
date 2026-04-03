-- ========================================
-- CORRECTION: Fonction de notification des artisans à proximité
-- ========================================

-- Créer ou remplacer la fonction pour notifier les artisans proches
CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_notified_count INTEGER := 0;
BEGIN
  -- Log de démarrage
  RAISE NOTICE '🔔 Recherche artisans à proximité pour mission % (catégorie: %, lat: %, lon: %)',
    NEW.id, NEW.category, NEW.latitude, NEW.longitude;

  -- Sélectionne les artisans dans un rayon de 10 km
  FOR r IN
    SELECT 
      a.id, 
      u.name, 
      a.latitude, 
      a.longitude,
      public.calculate_distance_km(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) as distance
    FROM public.artisans a
    JOIN public.users u ON u.id = a.id
    WHERE a.category = NEW.category
      AND a.is_available = true
      AND a.is_suspended = false
      AND a.is_verified = true
      AND a.latitude IS NOT NULL
      AND a.longitude IS NOT NULL
      AND public.calculate_distance_km(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) <= a.intervention_radius
    ORDER BY distance ASC
    LIMIT 20
  LOOP
    -- Envoie une notification via la table "notifications"
    INSERT INTO public.notifications (
      user_id, 
      type,
      title, 
      message, 
      mission_id,
      is_read,
      created_at
    )
    VALUES (
      r.id,
      'mission_request',
      'Nouvelle mission disponible',
      format('Une nouvelle mission "%s" est disponible à %.1f km de vous.', 
        NEW.category, r.distance),
      NEW.id,
      false,
      NOW()
    );
    
    v_notified_count := v_notified_count + 1;
    
    RAISE NOTICE '✅ Notification envoyée à artisan % (distance: %.1f km)', 
      r.name, r.distance;
  END LOOP;

  RAISE NOTICE '📊 Total artisans notifiés: %', v_notified_count;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors de la notification des artisans: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

-- Créer le trigger sur la création d'une mission
CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- Vérification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NOTIFICATIONS GÉOLOCALISÉES ACTIVÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger: on_new_mission_notify';
  RAISE NOTICE 'Fonction: notify_nearby_artisans()';
  RAISE NOTICE 'Rayon: basé sur intervention_radius de chaque artisan';
  RAISE NOTICE 'Colonne utilisée: is_read';
END $$;

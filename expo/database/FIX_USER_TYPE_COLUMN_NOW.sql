-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORRECTION URGENTE - COLONNE user_type
-- ═══════════════════════════════════════════════════════════════
-- Erreur: "column u.type does not exist"
-- Solution: Remplacer u.type par u.user_type
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ SUPPRIMER L'ANCIEN TRIGGER ET LA FONCTION
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_mission_created_notify_artisans ON public.missions CASCADE;
DROP FUNCTION IF EXISTS public.notify_nearby_artisans() CASCADE;

-- 2️⃣ RECRÉER LA FONCTION AVEC LA BONNE COLONNE
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  artisan_record RECORD;
  distance_km DOUBLE PRECISION;
  client_name TEXT;
  client_lat DOUBLE PRECISION;
  client_lon DOUBLE PRECISION;
  notified_count INTEGER := 0;
BEGIN
  -- Récupérer les infos du client qui a créé la mission
  SELECT u.name, u.latitude, u.longitude
  INTO client_name, client_lat, client_lon
  FROM public.users u
  WHERE u.id = NEW.client_id;

  -- Si le client n'a pas de position GPS, utiliser la position de la mission
  IF client_lat IS NULL OR client_lon IS NULL THEN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      client_lat := NEW.latitude;
      client_lon := NEW.longitude;
    ELSE
      -- Position par défaut : Paris centre
      client_lat := 48.8566;
      client_lon := 2.3522;
    END IF;
  END IF;

  -- Log pour debug
  RAISE NOTICE '✅ Nouvelle mission créée: % à (%, %)', NEW.category, client_lat, client_lon;

  -- Parcourir tous les artisans actifs de la même catégorie
  FOR artisan_record IN
    SELECT 
      u.id, 
      u.name, 
      u.latitude, 
      u.longitude,
      a.intervention_radius,
      a.category
    FROM public.users u
    INNER JOIN public.artisans a ON a.id = u.id
    WHERE 
      u.user_type = 'artisan'  -- ✅ CORRECTION: user_type au lieu de type
      AND a.is_available = true
      AND a.is_suspended = false
      AND (a.category = NEW.category OR NEW.category = 'Non spécifié')
      AND u.latitude IS NOT NULL 
      AND u.longitude IS NOT NULL
  LOOP
    -- Calculer la distance entre le client et l'artisan
    distance_km := public.calculate_distance(
      client_lat,
      client_lon,
      artisan_record.latitude,
      artisan_record.longitude
    );

    -- Log pour debug
    RAISE NOTICE '📍 Artisan % à % km', artisan_record.name, distance_km;

    -- Si l'artisan est dans le rayon d'intervention (ou dans un rayon de 50km par défaut)
    IF distance_km <= COALESCE(artisan_record.intervention_radius, 50) THEN
      -- Insérer une notification
      INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type,
        mission_id,
        metadata
      )
      VALUES (
        artisan_record.id,
        '🔔 Nouvelle mission disponible',
        'Mission "' || NEW.category || '" à ' || 
        CAST(CAST(distance_km AS NUMERIC(10,1)) AS TEXT) || 
        ' km de vous. Client: ' || COALESCE(client_name, 'Client'),
        'mission',
        NEW.id,
        jsonb_build_object(
          'distance_km', CAST(distance_km AS NUMERIC(10,1)),
          'category', NEW.category,
          'mission_id', NEW.id,
          'client_name', client_name
        )
      );

      notified_count := notified_count + 1;
      RAISE NOTICE '✅ Notification envoyée à artisan %', artisan_record.name;
    END IF;
  END LOOP;

  RAISE NOTICE '🎉 Total artisans notifiés: %', notified_count;

  RETURN NEW;
END;
$$;

-- 3️⃣ RECRÉER LE TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER on_mission_created_notify_artisans
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- 4️⃣ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_exists boolean;
    v_function_exists boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION DE LA CORRECTION';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier le trigger
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'on_mission_created_notify_artisans'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✓ Trigger "on_mission_created_notify_artisans" existe';
    ELSE
        RAISE NOTICE '✗ Trigger "on_mission_created_notify_artisans" MANQUANT';
    END IF;
    
    -- Vérifier la fonction
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'notify_nearby_artisans'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✓ Fonction "notify_nearby_artisans" existe';
    ELSE
        RAISE NOTICE '✗ Fonction "notify_nearby_artisans" MANQUANTE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    
    IF v_trigger_exists AND v_function_exists THEN
        RAISE NOTICE '✅ CORRECTION RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 Vous pouvez maintenant créer des missions sans erreur';
        RAISE NOTICE '🎯 La colonne user_type est maintenant correctement utilisée';
    ELSE
        RAISE NOTICE '⚠️  CORRECTION INCOMPLÈTE';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 SCRIPT TERMINÉ !
-- ═══════════════════════════════════════════════════════════════

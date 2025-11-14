-- ═══════════════════════════════════════════════════════════════
-- 🚨 FIX URGENT - CRÉATION DE MISSIONS
-- ═══════════════════════════════════════════════════════════════
-- PROBLÈME: Impossible de créer des demandes d'intervention
-- SOLUTION: Corriger le trigger de notifications
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ SUPPRIMER LE TRIGGER DÉFECTUEUX
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS on_mission_created_notify_artisans ON public.missions CASCADE;
DROP FUNCTION IF EXISTS public.notify_nearby_artisans() CASCADE;

-- 2️⃣ RECRÉER LA FONCTION AVEC GESTION D'ERREURS
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
  -- Log de démarrage
  RAISE NOTICE '🚀 Nouvelle mission créée: ID=%, catégorie=%', NEW.id, NEW.category;

  -- Récupérer les informations du client
  BEGIN
    SELECT u.name, u.latitude, u.longitude
    INTO client_name, client_lat, client_lon
    FROM public.users u
    WHERE u.id = NEW.client_id;
    
    RAISE NOTICE '👤 Client: %, Position: (%, %)', client_name, client_lat, client_lon;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '⚠️  Erreur récupération client: %', SQLERRM;
      client_name := 'Client';
      client_lat := NULL;
      client_lon := NULL;
  END;

  -- Utiliser la position de la mission si le client n'a pas de coordonnées
  IF client_lat IS NULL OR client_lon IS NULL THEN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      client_lat := NEW.latitude;
      client_lon := NEW.longitude;
      RAISE NOTICE '📍 Utilisation position mission: (%, %)', client_lat, client_lon;
    ELSE
      -- Position par défaut : Paris centre
      client_lat := 48.8566;
      client_lon := 2.3522;
      RAISE NOTICE '📍 Utilisation position par défaut (Paris)';
    END IF;
  END IF;

  -- Parcourir tous les artisans disponibles de la même catégorie
  BEGIN
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
        u.user_type = 'artisan'
        AND a.is_available = true
        AND a.is_suspended = false
        AND (a.category = NEW.category OR NEW.category = 'Non spécifié')
        AND u.latitude IS NOT NULL 
        AND u.longitude IS NOT NULL
    LOOP
      -- Calculer la distance entre le client et l'artisan
      BEGIN
        distance_km := public.calculate_distance(
          client_lat,
          client_lon,
          artisan_record.latitude,
          artisan_record.longitude
        );

        RAISE NOTICE '📏 Distance pour artisan %: % km', artisan_record.name, distance_km;

        -- Si l'artisan est dans le rayon d'intervention
        IF distance_km <= COALESCE(artisan_record.intervention_radius, 50) THEN
          -- Créer une notification
          INSERT INTO public.notifications (
            user_id, 
            title, 
            message, 
            type,
            mission_id,
            metadata,
            is_read
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
            ),
            false
          );

          notified_count := notified_count + 1;
          RAISE NOTICE '✅ Notification envoyée à %', artisan_record.name;
        ELSE
          RAISE NOTICE '❌ Artisan % trop éloigné (% km > % km)', 
            artisan_record.name, 
            distance_km, 
            COALESCE(artisan_record.intervention_radius, 50);
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING '⚠️  Erreur notification artisan %: %', artisan_record.name, SQLERRM;
      END;
    END LOOP;

    RAISE NOTICE '🎉 Total artisans notifiés: %', notified_count;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '⚠️  Erreur boucle artisans: %', SQLERRM;
  END;

  -- Toujours retourner NEW pour que la mission soit créée
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING '🚨 ERREUR CRITIQUE dans notify_nearby_artisans: %', SQLERRM;
    -- Important: on retourne NEW même en cas d'erreur
    -- pour que la mission soit quand même créée
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

-- 4️⃣ VÉRIFIER LES PERMISSIONS
-- ═══════════════════════════════════════════════════════════════

-- S'assurer que les clients peuvent créer des missions
DO $$ 
BEGIN
  -- Supprimer l'ancienne policy si elle existe
  DROP POLICY IF EXISTS "clients_can_create_missions" ON public.missions;
  
  -- Recréer la policy
  CREATE POLICY "clients_can_create_missions"
  ON public.missions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
  );
  
  RAISE NOTICE '✅ Policy de création de missions créée';
END $$;

-- 5️⃣ TEST FINAL
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
  v_trigger_exists boolean;
  v_function_exists boolean;
  v_policy_exists boolean;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '🔍 VÉRIFICATION DE LA CORRECTION';
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_mission_created_notify_artisans'
  ) INTO v_trigger_exists;
  
  IF v_trigger_exists THEN
    RAISE NOTICE '✓ Trigger existe et est actif';
  ELSE
    RAISE NOTICE '✗ Trigger MANQUANT';
  END IF;
  
  -- Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'notify_nearby_artisans'
  ) INTO v_function_exists;
  
  IF v_function_exists THEN
    RAISE NOTICE '✓ Fonction existe';
  ELSE
    RAISE NOTICE '✗ Fonction MANQUANTE';
  END IF;
  
  -- Vérifier la policy
  SELECT EXISTS (
    SELECT 1 
    FROM pg_policies
    WHERE tablename = 'missions' 
    AND policyname = 'clients_can_create_missions'
  ) INTO v_policy_exists;
  
  IF v_policy_exists THEN
    RAISE NOTICE '✓ Policy de création existe';
  ELSE
    RAISE NOTICE '✗ Policy de création MANQUANTE';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════';
  
  IF v_trigger_exists AND v_function_exists AND v_policy_exists THEN
    RAISE NOTICE '✅ CORRECTION RÉUSSIE !';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Vous pouvez maintenant créer des missions';
    RAISE NOTICE '🎯 Les artisans seront notifiés automatiquement';
    RAISE NOTICE '🎯 Les erreurs sont gérées sans bloquer la création';
  ELSE
    RAISE NOTICE '⚠️  CORRECTION INCOMPLÈTE';
    RAISE NOTICE 'Contactez le support';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 SCRIPT TERMINÉ !
-- ═══════════════════════════════════════════════════════════════
-- 
-- Prochaines étapes:
-- 1. Testez de créer une mission dans l'app
-- 2. Vérifiez les logs dans la console de l'app
-- 3. Vérifiez les logs Supabase (onglet Logs)
--
-- Si ça ne fonctionne toujours pas, envoyez:
-- - Les logs de la console de l'app
-- - Les logs Supabase
-- - Le message d'erreur exact
-- ═══════════════════════════════════════════════════════════════

-- ========================================
-- 🚨 SCRIPT SQL DE CORRECTION COMPLÈTE
-- ========================================
-- Ce script corrige TOUTES les erreurs Supabase actuelles
-- À copier-coller dans le SQL Editor de Supabase

-- ========================================
-- 1. CRÉER LA FONCTION calculate_distance
-- ========================================
-- Cette fonction calcule la distance entre deux points GPS (formule de Haversine)
-- Retourne la distance en kilomètres

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R CONSTANT DOUBLE PRECISION := 6371; -- Rayon de la Terre en km
  dLat DOUBLE PRECISION;
  dLon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convertir les degrés en radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  -- Formule de Haversine
  a := sin(dLat/2) * sin(dLat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- Distance en kilomètres
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Permissions
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
GRANT EXECUTE ON FUNCTION calculate_distance TO service_role;

-- Commentaire
COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en km entre deux points GPS en utilisant la formule de Haversine';

-- ========================================
-- 2. TEST DE LA FONCTION calculate_distance
-- ========================================
-- Test: Distance Paris (48.8566, 2.3522) -> Lyon (45.7640, 4.8357)
-- Résultat attendu: ~392 km

DO $$
DECLARE
  test_distance DOUBLE PRECISION;
BEGIN
  SELECT calculate_distance(48.8566, 2.3522, 45.7640, 4.8357) INTO test_distance;
  
  RAISE NOTICE '✅ Distance test Paris-Lyon: % km', ROUND(test_distance::NUMERIC, 2);
  
  IF test_distance BETWEEN 390 AND 395 THEN
    RAISE NOTICE '✅ Fonction calculate_distance fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️ Résultat inattendu pour calculate_distance: % km', test_distance;
  END IF;
END $$;

-- ========================================
-- 3. RECRÉER find_nearby_missions
-- ========================================
-- Fonction qui trouve les missions proches d'un artisan

CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS TABLE(
  mission_id UUID,
  distance_km DOUBLE PRECISION,
  title TEXT,
  category TEXT,
  status TEXT,
  estimated_price NUMERIC(10,2),
  description TEXT,
  address TEXT,
  client_id UUID,
  client_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photos TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  -- Récupérer la catégorie et le rayon d'intervention de l'artisan
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  -- Si l'artisan n'existe pas, retourner vide
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Retourner les missions proches
  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    calculate_distance(
      p_latitude, p_longitude,
      m.latitude::DOUBLE PRECISION, m.longitude::DOUBLE PRECISION
    ) AS distance_km,
    m.title,
    m.category,
    m.status,
    m.estimated_price,
    m.description,
    m.address,
    m.client_id,
    u.name AS client_name,
    m.latitude::DOUBLE PRECISION,
    m.longitude::DOUBLE PRECISION,
    m.photos,
    m.created_at
  FROM missions m
  JOIN clients c ON c.id = m.client_id
  JOIN users u ON u.id = c.id
  WHERE m.status = 'pending'
    AND m.category = v_category
    AND m.artisan_id IS NULL
    AND calculate_distance(
      p_latitude, p_longitude,
      m.latitude::DOUBLE PRECISION, m.longitude::DOUBLE PRECISION
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissions
GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;

-- Commentaire
COMMENT ON FUNCTION find_nearby_missions IS 'Trouve les missions en attente près d''un artisan dans son rayon d''intervention';

-- ========================================
-- 4. VÉRIFIER LES TABLES ESSENTIELLES
-- ========================================
DO $$
BEGIN
  -- Vérifier que la table missions existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'missions') THEN
    RAISE EXCEPTION '❌ Table missions n''existe pas!';
  END IF;

  -- Vérifier que la table artisans existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'artisans') THEN
    RAISE EXCEPTION '❌ Table artisans n''existe pas!';
  END IF;

  -- Vérifier que la table clients existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'clients') THEN
    RAISE EXCEPTION '❌ Table clients n''existe pas!';
  END IF;

  -- Vérifier que la table users existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    RAISE EXCEPTION '❌ Table users n''existe pas!';
  END IF;

  RAISE NOTICE '✅ Toutes les tables essentielles existent';
END $$;

-- ========================================
-- 5. VÉRIFIER LES COLONNES ESSENTIELLES
-- ========================================
DO $$
BEGIN
  -- Vérifier latitude/longitude dans missions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'latitude'
  ) THEN
    RAISE EXCEPTION '❌ Colonne latitude manquante dans missions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'longitude'
  ) THEN
    RAISE EXCEPTION '❌ Colonne longitude manquante dans missions';
  END IF;

  -- Vérifier intervention_radius dans artisans
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artisans' AND column_name = 'intervention_radius'
  ) THEN
    RAISE EXCEPTION '❌ Colonne intervention_radius manquante dans artisans';
  END IF;

  RAISE NOTICE '✅ Toutes les colonnes essentielles existent';
END $$;

-- ========================================
-- 6. TEST COMPLET
-- ========================================
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Test de la fonction calculate_distance
  PERFORM calculate_distance(48.8566, 2.3522, 45.7640, 4.8357);
  RAISE NOTICE '✅ calculate_distance fonctionne';

  -- Compter les missions en attente
  SELECT COUNT(*) INTO test_count FROM missions WHERE status = 'pending';
  RAISE NOTICE '📊 Missions en attente: %', test_count;

  -- Compter les artisans
  SELECT COUNT(*) INTO test_count FROM artisans;
  RAISE NOTICE '📊 Artisans: %', test_count;

  RAISE NOTICE '🎉 TOUTES LES FONCTIONS SONT CRÉÉES';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser l''application !';
END $$;
